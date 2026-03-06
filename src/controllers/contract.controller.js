import Contract from "../models/contract.model.js";
import Payment from "../models/payment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStripeClient } from "../config/stripe.js";
import { sendContractEmail } from "../utils/contractEmail.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE CONTRACT
//    Admin fills in project/client details, payment terms, custom clauses.
//    Contract is saved as "pending" until sent, signed, or paid.
// ─────────────────────────────────────────────────────────────────────────────
export const createContract = asyncHandler(async (req, res) => {
    const {
        projectName,
        clientName,
        clientEmail,
        contractAmount,
        advanceAmount,
        currency = "usd",
        startDate,
        endDate,
        paymentTerms,
        customClauses,
        notes,
    } = req.body;

    if (!projectName || !clientName || !clientEmail || !contractAmount || !startDate || !endDate || !paymentTerms) {
        throw new ApiError(400, "Missing required fields: projectName, clientName, clientEmail, contractAmount, startDate, endDate, paymentTerms");
    }

    if (new Date(endDate) <= new Date(startDate)) {
        throw new ApiError(400, "End date must be after start date");
    }

    if (advanceAmount != null && advanceAmount > contractAmount) {
        throw new ApiError(400, "Advance amount cannot exceed the total contract amount");
    }

    const contract = await Contract.create({
        projectName,
        clientName,
        clientEmail,
        contractAmount,
        advanceAmount: advanceAmount || 0,
        currency,
        startDate,
        endDate,
        paymentTerms,
        customClauses,
        notes,
        status: "pending",
    });

    return res.status(201).json(
        new ApiResponse(201, contract, "Contract created successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET ALL CONTRACTS (Admin — paginated + filterable)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllContracts = asyncHandler(async (req, res) => {
    const rawPage  = Number(req.query.page)  || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page  = rawPage  < 1 ? 1  : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);

    const search       = (req.query.search || "").trim();
    const status       = req.query.status?.trim();
    const paymentTerms = req.query.paymentTerms?.trim();
    const startFrom    = req.query.startFrom;   // filter: startDate >= startFrom
    const startTo      = req.query.startTo;     // filter: startDate <= startTo

    const filter = {};

    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { clientName:  { $regex: regex } },
            { clientEmail: { $regex: regex } },
            { projectName: { $regex: regex } },
        ];
    }
    if (status)       filter.status       = status;
    if (paymentTerms) filter.paymentTerms = paymentTerms;
    if (startFrom || startTo) {
        filter.startDate = {};
        if (startFrom) filter.startDate.$gte = new Date(startFrom);
        if (startTo)   filter.startDate.$lte = new Date(startTo);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Contract.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Contract.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        }, "Contracts fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET SINGLE CONTRACT
//    Used by both admin (JWT) and client (public view via emailed link)
// ─────────────────────────────────────────────────────────────────────────────
export const getContractById = asyncHandler(async (req, res) => {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
        throw new ApiError(404, "Contract not found");
    }

    return res.status(200).json(
        new ApiResponse(200, contract, "Contract fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE CONTRACT STATUS
//    Admin can manually set: pending → signed → paid → active → cancelled
//    Also handles client signature (signed) and advance payment (paid → active)
// ─────────────────────────────────────────────────────────────────────────────
export const updateContractStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const VALID_STATUSES = ["pending", "signed", "paid", "active", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
        throw new ApiError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) {
        throw new ApiError(404, "Contract not found");
    }

    // Prevent invalid transitions
    if (contract.status === "cancelled") {
        throw new ApiError(400, "Cannot update a cancelled contract");
    }

    contract.status = status;

    if (status === "signed" && !contract.signedAt) {
        contract.signedAt = new Date();
        // Auto-activate if advance is 0 — no payment needed
        if (!contract.advanceAmount || contract.advanceAmount === 0) {
            contract.status = "active";
        }
    }

    if (status === "paid" && !contract.paidAt) {
        contract.paidAt = new Date();
        contract.status = "active"; // Payment received → immediately active
    }

    await contract.save();

    return res.status(200).json(
        new ApiResponse(200, contract, `Contract status updated to '${contract.status}' successfully`)
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SEND CONTRACT
//    Generates a Stripe Payment Intent for the advance (if any),
//    then emails the client a link to view, sign, and optionally pay.
// ─────────────────────────────────────────────────────────────────────────────
export const sendContract = asyncHandler(async (req, res) => {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
        throw new ApiError(404, "Contract not found");
    }

    if (contract.status === "cancelled") {
        throw new ApiError(400, "Cannot send a cancelled contract");
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const contractViewUrl = `${frontendUrl}/contracts/view/${contract._id}`;

    let paymentLink = null;

    // If an advance is required, create a Stripe Payment Intent
    if (contract.advanceAmount && contract.advanceAmount > 0) {
        const stripe = getStripeClient();

        const paymentIntent = await stripe.paymentIntents.create({
            amount:      Math.round(contract.advanceAmount * 100), // cents
            currency:    contract.currency,
            description: `Advance payment — ${contract.projectName}`,
            metadata: {
                contractId:  contract._id.toString(),
                clientEmail: contract.clientEmail,
                clientName:  contract.clientName,
                projectName: contract.projectName,
            },
            receipt_email: contract.clientEmail,
        });

        contract.stripePaymentIntentId = paymentIntent.id;

        // Build a Stripe-hosted payment page URL via Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode:       "payment",
            line_items: [{
                price_data: {
                    currency:     contract.currency,
                    product_data: { name: `Advance — ${contract.projectName}` },
                    unit_amount:  Math.round(contract.advanceAmount * 100),
                },
                quantity: 1,
            }],
            customer_email: contract.clientEmail,
            success_url: `${contractViewUrl}?payment=success`,
            cancel_url:  `${contractViewUrl}?payment=cancelled`,
            metadata: {
                contractId: contract._id.toString(),
            },
        });

        paymentLink = session.url;
    }

    // Mark as sent
    contract.sentAt = new Date();
    await contract.save();

    // Send contract email (non-blocking)
    sendContractEmail({
        clientName:      contract.clientName,
        clientEmail:     contract.clientEmail,
        projectName:     contract.projectName,
        contractAmount:  contract.contractAmount,
        advanceAmount:   contract.advanceAmount,
        currency:        contract.currency,
        startDate:       contract.startDate,
        endDate:         contract.endDate,
        paymentTerms:    contract.paymentTerms,
        contractViewUrl,
        paymentLink,
    }).catch((err) => console.error("[Contract Email Error]", err.message));

    return res.status(200).json(
        new ApiResponse(200, {
            contract,
            contractViewUrl,
            paymentLink,
        }, "Contract sent to client successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DOWNLOAD CONTRACT
//    Returns contract data formatted for PDF generation on the frontend.
//    (PDF rendering handled client-side or via a dedicated PDF service on Day 6)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadContract = asyncHandler(async (req, res) => {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
        throw new ApiError(404, "Contract not found");
    }

    // Return the full contract document — frontend will render to PDF
    return res.status(200).json(
        new ApiResponse(200, contract, "Contract data ready for download")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. DUPLICATE CONTRACT
//    Creates a new contract as a copy of an existing one, resetting status,
//    dates, and Stripe references so it can be edited and re-sent.
// ─────────────────────────────────────────────────────────────────────────────
export const duplicateContract = asyncHandler(async (req, res) => {
    const original = await Contract.findById(req.params.id);
    if (!original) {
        throw new ApiError(404, "Contract not found");
    }

    const duplicate = await Contract.create({
        projectName:    `${original.projectName} (Copy)`,
        clientName:     original.clientName,
        clientEmail:    original.clientEmail,
        contractAmount: original.contractAmount,
        advanceAmount:  original.advanceAmount,
        currency:       original.currency,
        startDate:      original.startDate,
        endDate:        original.endDate,
        paymentTerms:   original.paymentTerms,
        customClauses:  original.customClauses,
        notes:          original.notes,
        // Reset all status/tracking fields
        status:                  "pending",
        stripePaymentIntentId:   null,
        sentAt:                  null,
        signedAt:                null,
        paidAt:                  null,
    });

    return res.status(201).json(
        new ApiResponse(201, duplicate, "Contract duplicated successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DELETE CONTRACT
//    Only pending or cancelled contracts can be deleted.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteContract = asyncHandler(async (req, res) => {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
        throw new ApiError(404, "Contract not found");
    }

    if (!["pending", "cancelled"].includes(contract.status)) {
        throw new ApiError(400, "Only pending or cancelled contracts can be deleted. Cancel the contract first.");
    }

    await Contract.findByIdAndDelete(req.params.id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Contract deleted successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. CONTRACT STATS (Admin dashboard summary)
// ─────────────────────────────────────────────────────────────────────────────
export const getContractStats = asyncHandler(async (req, res) => {
    const [total, pending, signed, paid, active, cancelled] = await Promise.all([
        Contract.countDocuments(),
        Contract.countDocuments({ status: "pending" }),
        Contract.countDocuments({ status: "signed" }),
        Contract.countDocuments({ status: "paid" }),
        Contract.countDocuments({ status: "active" }),
        Contract.countDocuments({ status: "cancelled" }),
    ]);

    // Total contract value from active contracts
    const revenueAgg = await Contract.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalContractValue: { $sum: "$contractAmount" } } },
    ]);
    const totalContractValue = revenueAgg[0]?.totalContractValue || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            pending,
            signed,
            paid,
            active,
            cancelled,
            totalContractValue,
        }, "Contract stats fetched successfully")
    );
});