import Contract from "../models/contract.model.js";
import Payment from "../models/payment.model.js";
import Invoice from "../models/invoice.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/pagination.js";
import { getStripeClient } from "../config/stripe.js";
import {
  sendContractEmail,
  sendContractPaymentConfirmationEmail,
} from "../utils/contractEmail.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE CONTRACT
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

  if (
    !projectName ||
    !clientName ||
    !clientEmail ||
    !contractAmount ||
    !startDate ||
    !endDate ||
    !paymentTerms
  ) {
    throw new ApiError(
      400,
      "Missing required fields: projectName, clientName, clientEmail, contractAmount, startDate, endDate, paymentTerms",
    );
  }
  if (new Date(endDate) <= new Date(startDate))
    throw new ApiError(400, "End date must be after start date");
  if (advanceAmount != null && advanceAmount > contractAmount)
    throw new ApiError(
      400,
      "Advance amount cannot exceed the total contract amount",
    );

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

  return res
    .status(201)
    .json(new ApiResponse(201, contract, "Contract created successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET ALL CONTRACTS
// ─────────────────────────────────────────────────────────────────────────────
export const getAllContracts = asyncHandler(async (req, res) => {
  const { skip, limit, getPaginationMeta } = paginate(req.query);

  const search = (req.query.search || "").trim();
  const status = req.query.status?.trim();
  const paymentTerms = req.query.paymentTerms?.trim();
  const startFrom = req.query.startFrom;
  const startTo = req.query.startTo;

  const filter = {};
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { clientName: { $regex: regex } },
      { clientEmail: { $regex: regex } },
      { projectName: { $regex: regex } },
    ];
  }
  if (status) filter.status = status;
  if (paymentTerms) filter.paymentTerms = paymentTerms;
  if (startFrom || startTo) {
    filter.startDate = {};
    if (startFrom) filter.startDate.$gte = new Date(startFrom);
    if (startTo) filter.startDate.$lte = new Date(startTo);
  }

  const [items, total] = await Promise.all([
    Contract.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contract.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { items, pagination: getPaginationMeta(total) },
        "Contracts fetched successfully",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET SINGLE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE CONTRACT STATUS
// ─────────────────────────────────────────────────────────────────────────────
export const updateContractStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID_STATUSES = ["pending", "signed", "paid", "active", "cancelled"];

  if (!status || !VALID_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");
  if (contract.status === "cancelled")
    throw new ApiError(400, "Cannot update a cancelled contract");

  contract.status = status;

  if (status === "signed" && !contract.signedAt) {
    contract.signedAt = new Date();
    if (!contract.advanceAmount || contract.advanceAmount === 0) {
      contract.status = "active";
      await _createContractInvoice(
        contract,
        contract.contractAmount,
        "full-balance",
      );
    }
  }

  if (status === "paid" && !contract.paidAt) {
    contract.paidAt = new Date();
    contract.status = "active";
    const remaining = contract.contractAmount - (contract.advanceAmount || 0);
    if (remaining > 0)
      await _createContractInvoice(contract, remaining, "remaining-balance");
  }

  await contract.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        contract,
        `Contract status updated to '${contract.status}' successfully`,
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SEND CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const sendContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");
  if (contract.status === "cancelled")
    throw new ApiError(400, "Cannot send a cancelled contract");

  const { contractViewUrl, paymentLink } = await _buildContractLinks(contract);
  contract.sentAt = new Date();
  await contract.save();

  await sendContractEmail({
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    projectName: contract.projectName,
    contractAmount: contract.contractAmount,
    advanceAmount: contract.advanceAmount,
    currency: contract.currency,
    startDate: contract.startDate,
    endDate: contract.endDate,
    paymentTerms: contract.paymentTerms,
    contractViewUrl,
    paymentLink,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { contract, contractViewUrl, paymentLink },
        "Contract sent to client successfully",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. RESEND CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const resendContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");
  if (contract.status === "cancelled")
    throw new ApiError(400, "Cannot resend a cancelled contract");
  if (contract.status === "active")
    throw new ApiError(400, "Contract is already active. No need to resend.");

  const { contractViewUrl, paymentLink } = await _buildContractLinks(contract);
  contract.sentAt = new Date();
  await contract.save();

  await sendContractEmail({
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    projectName: contract.projectName,
    contractAmount: contract.contractAmount,
    advanceAmount: contract.advanceAmount,
    currency: contract.currency,
    startDate: contract.startDate,
    endDate: contract.endDate,
    paymentTerms: contract.paymentTerms,
    contractViewUrl,
    paymentLink,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { contract, contractViewUrl, paymentLink },
        "Contract resent to client successfully",
      ),
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. DOWNLOAD CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const downloadContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract data ready for download"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DUPLICATE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const duplicateContract = asyncHandler(async (req, res) => {
  const original = await Contract.findById(req.params.id);
  if (!original) throw new ApiError(404, "Contract not found");

  const duplicate = await Contract.create({
    projectName: `${original.projectName} (Copy)`,
    clientName: original.clientName,
    clientEmail: original.clientEmail,
    contractAmount: original.contractAmount,
    advanceAmount: original.advanceAmount,
    currency: original.currency,
    startDate: original.startDate,
    endDate: original.endDate,
    paymentTerms: original.paymentTerms,
    customClauses: original.customClauses,
    notes: original.notes,
    status: "pending",
    stripePaymentIntentId: null,
    sentAt: null,
    signedAt: null,
    paidAt: null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, duplicate, "Contract duplicated successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. DELETE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export const deleteContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) throw new ApiError(404, "Contract not found");

  if (!["pending", "cancelled"].includes(contract.status)) {
    throw new ApiError(
      400,
      "Only pending or cancelled contracts can be deleted. Cancel the contract first.",
    );
  }

  await Contract.findByIdAndDelete(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Contract deleted successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. CONTRACT STATS
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

  const revenueAgg = await Contract.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: null, totalContractValue: { $sum: "$contractAmount" } } },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        pending,
        signed,
        paid,
        active,
        cancelled,
        totalContractValue: revenueAgg[0]?.totalContractValue || 0,
      },
      "Contract stats fetched successfully",
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. STRIPE WEBHOOK — CONTRACT PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const contractStripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  const webhookSecret =
    process.env.STRIPE_CONTRACT_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!webhookSecret)
    throw new ApiError(500, "STRIPE_CONTRACT_WEBHOOK_SECRET is not configured");

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(
      "[ContractWebhook] Signature verification failed:",
      err.message,
    );
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const contractId = session.metadata?.contractId;
      if (!contractId) break;

      const contract = await Contract.findById(contractId);
      if (!contract || contract.status === "active") break;

      const amountPaid = session.amount_total / 100;
      const currency = session.currency;

      contract.status = "active";
      contract.paidAt = new Date();
      contract.stripePaymentIntentId = session.payment_intent;
      await contract.save();

      await Payment.create({
        referenceType: "contract",
        referenceId: contract._id,
        referenceModel: "Contract",
        clientName: contract.clientName,
        clientEmail: contract.clientEmail,
        amount: amountPaid,
        currency,
        status: "succeeded",
        stripePaymentIntentId: session.payment_intent,
        description: `Advance payment — ${contract.projectName}`,
        receiptSentAt: new Date(),
      });

      const remaining = contract.contractAmount - amountPaid;
      if (remaining > 0)
        await _createContractInvoice(contract, remaining, "remaining-balance");

      sendContractPaymentConfirmationEmail({
        clientName: contract.clientName,
        clientEmail: contract.clientEmail,
        projectName: contract.projectName,
        advanceAmount: amountPaid,
        currency,
      }).catch((err) =>
        console.error(
          "[ContractWebhook] Confirmation email error:",
          err.message,
        ),
      );

      console.log(
        `[ContractWebhook] checkout.session.completed — contract ${contractId} activated`,
      );
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const contractId = intent.metadata?.contractId;
      if (!contractId) break;

      const contract = await Contract.findById(contractId);
      if (contract) {
        await Payment.create({
          referenceType: "contract",
          referenceId: contract._id,
          referenceModel: "Contract",
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          amount: intent.amount / 100,
          currency: intent.currency,
          status: "failed",
          stripePaymentIntentId: intent.id,
          failureReason: intent.last_payment_error?.message || "Payment failed",
          description: `Advance payment failed — ${contract.projectName}`,
        });
      }
      break;
    }

    default:
      console.log(`[ContractWebhook] Unhandled event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const _buildContractLinks = async (contract) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const contractViewUrl = `${frontendUrl}/contracts/view/${contract._id}`;
  let paymentLink = null;

  if (contract.advanceAmount && contract.advanceAmount > 0) {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: contract.currency,
            product_data: { name: `Advance — ${contract.projectName}` },
            unit_amount: Math.round(contract.advanceAmount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: contract.clientEmail,
      success_url: `${contractViewUrl}?payment=success`,
      cancel_url: `${contractViewUrl}?payment=cancelled`,
      metadata: {
        contractId: contract._id.toString(),
        clientEmail: contract.clientEmail,
        clientName: contract.clientName,
        projectName: contract.projectName,
      },
    });

    contract.stripePaymentIntentId = session.payment_intent;
    await contract.save();
    paymentLink = session.url;
  }

  return { contractViewUrl, paymentLink };
};

const _createContractInvoice = async (contract, amount, type) => {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await Invoice.create({
      contractId: contract._id,
      clientName: contract.clientName,
      clientEmail: contract.clientEmail,
      description: `${contract.projectName} — ${type === "remaining-balance" ? "Remaining Balance" : "Full Payment"}`,
      amount,
      currency: contract.currency,
      dueDate,
      status: "unpaid",
    });

    console.log(
      `[Invoice] Auto-created ${type} invoice for contract ${contract._id}`,
    );
  } catch (err) {
    console.error("[Invoice] Failed to auto-create invoice:", err.message);
  }
};
