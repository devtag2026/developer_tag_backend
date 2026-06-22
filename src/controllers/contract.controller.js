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
  sendContractAcceptedEmail,
  sendContractRejectedEmail,
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
    currency = "usd",
    startDate,
    endDate,
    paymentTerms,
    serviceType,
    revisions,
    scopeOfWork,
    customClauses,
    notes,
    milestones,
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

  if (new Date(endDate) <= new Date(startDate)) {
    throw new ApiError(400, "End date must be after start date");
  }

  // ── Milestone validation ──────────────────────────────
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new ApiError(400, "At least one milestone is required");
  }

  let milestonesTotal = 0;
  const normalizedMilestones = milestones.map((m, index) => {
    if (!m.title || typeof m.title !== "string") {
      throw new ApiError(400, `Milestone ${index + 1} is missing a title`);
    }
    const amount = Number(m.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(
        400,
        `Milestone ${index + 1} must have an amount greater than 0`,
      );
    }
    if (m.dueDate && new Date(m.dueDate) < new Date(startDate)) {
      throw new ApiError(
        400,
        `Milestone ${index + 1} due date cannot be before the contract start date`,
      );
    }

    milestonesTotal += amount;

    return {
      title: m.title.trim(),
      description: m.description?.trim() || "",
      amount,
      dueDate: m.dueDate || undefined,
      order: index,
      status: "pending_payment",
    };
  });

  // Server-side source of truth: milestones must sum exactly to contractAmount.
  // Never trust client-side sums for money — the modal's own balance check
  // is a UX convenience, not a security boundary.
  const amountDiff = Math.abs(milestonesTotal - Number(contractAmount));
  if (amountDiff > 0.01) {
    throw new ApiError(
      400,
      `Milestone amounts ($${milestonesTotal.toFixed(2)}) must add up to the contract amount ($${Number(contractAmount).toFixed(2)})`,
    );
  }

  const contract = await Contract.create({
    projectName,
    clientName,
    clientEmail,
    serviceType,
    contractAmount,
    currency,
    startDate,
    endDate,
    paymentTerms,
    revisions,
    scopeOfWork,
    customClauses,
    notes,
    milestones: normalizedMilestones,
    currentMilestoneIndex: 0,
    status: "draft",
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
  const { id } = req.params;
  const contract = await Contract.findById(id);
  if (!contract) {
      throw new ApiError(404, "Contract not found");
  }

  if (contract.status !== "draft") {
      throw new ApiError(
          400,
          `Cannot send a contract with status "${contract.status}". Only draft contracts can be sent.`,
      );
  }

  const acceptUrl = `${process.env.FRONTEND_URL}/contract/${contract.accessToken}?action=accept`;
  const rejectUrl = `${process.env.FRONTEND_URL}/contract/${contract.accessToken}?action=reject`;

  
  await sendContractEmail({
      clientName: contract.clientName,
      clientEmail: contract.clientEmail,
      projectName: contract.projectName,
      contractAmount: contract.contractAmount,
      milestones: contract.milestones,
      currency: contract.currency,
      startDate: contract.startDate,
      endDate: contract.endDate,
      paymentTerms: contract.paymentTerms,
      acceptUrl,
      rejectUrl,
  });

  contract.status = "pending";
  contract.sentAt = new Date();
  await contract.save();

  return res
      .status(200)
      .json(new ApiResponse(200, contract, "Contract sent to client"));
});

/**
 * Public contract preview for emailed client links (token-based, no JWT).
 */
export const getContractByToken = asyncHandler(async (req, res) => {
  const { accessToken } = req.params;

  const contract = await Contract.findOne({ accessToken }).select(
    "-stripePaymentIntentId -accessToken",
  );
  if (!contract) {
    throw new ApiError(404, "Invalid or expired contract link");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract fetched successfully"));
});

/**
* Client accepts or rejects via the emailed link (no login — accessToken
* is the auth). pending -> accepted | rejected
*/
export const respondToContract = asyncHandler(async (req, res) => {
  const { accessToken } = req.params;
  const { action, rejectionReason } = req.body; // "accept" | "reject"

  if (!["accept", "reject"].includes(action)) {
      throw new ApiError(400, "Action must be either 'accept' or 'reject'");
  }

  const contract = await Contract.findOne({ accessToken });
  if (!contract) {
      throw new ApiError(404, "Invalid or expired contract link");
  }

  const alreadyFinalized = ["active", "rejected", "completed", "cancelled"].includes(
      contract.status,
  );
  const canRespond =
      contract.status === "pending" ||
      contract.status === "sent" ||
      (contract.status === "draft" && contract.sentAt);

  if (alreadyFinalized) {
      throw new ApiError(
          400,
          `This contract has already been responded to (current status: "${contract.status}")`,
      );
  }

  if (!canRespond) {
      throw new ApiError(
          400,
          "This contract is not available for response yet. Please contact DeveloperTag if you believe this is an error.",
      );
  }

  if (action === "accept") {
      // "active" — contract enters its working/payment phase; milestone 1
      // checkout becomes available next.
      contract.status = "active";
      contract.respondedAt = new Date();
      await contract.save();

      await sendContractAcceptedEmail({
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          projectName: contract.projectName,
          contractAmount: contract.contractAmount,
          milestones: contract.milestones,
          currency: contract.currency,
          startDate: contract.startDate,
          endDate: contract.endDate,
      });
  } else {
      contract.status = "rejected";
      contract.rejectionReason = rejectionReason || "";
      contract.respondedAt = new Date();
      await contract.save();

      await sendContractRejectedEmail({
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          projectName: contract.projectName,
          rejectionReason: contract.rejectionReason,
      });
  }

  return res
      .status(200)
      .json(
          new ApiResponse(
              200,
              contract,
              action === "accept"
                  ? "Contract accepted successfully"
                  : "Contract rejected",
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
// 12. ACCEPT CONTRACT (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
export const acceptContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contract = await Contract.findById(id);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  if (contract.status === "active" || contract.status === "signed") {
    throw new ApiError(400, "Contract is already accepted/signed");
  }

  if (contract.status === "cancelled") {
    throw new ApiError(400, "Cannot accept a cancelled contract");
  }

  // Update contract status to signed
  contract.status = "signed";
  contract.signedAt = new Date();
  await contract.save();

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract accepted successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. REJECT CONTRACT (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
export const rejectContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  const contract = await Contract.findById(id);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  if (contract.status === "rejected") {
    throw new ApiError(400, "Contract is already rejected");
  }

  if (contract.status === "active" || contract.status === "signed" || contract.status === "paid") {
    throw new ApiError(400, "Cannot reject an active/signed/paid contract");
  }

  // Update contract status to rejected
  contract.status = "rejected";
  contract.rejectionReason = rejectionReason || "Rejected by admin";
  contract.respondedAt = new Date();
  await contract.save();

  // Send rejection email to client
  await sendContractRejectedEmail({
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    projectName: contract.projectName,
    rejectionReason: contract.rejectionReason,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, contract, "Contract rejected successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. GET CONTRACT STATUS (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
export const getContractStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contract = await Contract.findById(id);

  if (!contract) {
    throw new ApiError(404, "Contract not found");
  }

  const statusInfo = {
    id: contract._id,
    projectName: contract.projectName,
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    status: contract.status,
    contractAmount: contract.contractAmount,
    currency: contract.currency,
    signedAt: contract.signedAt || null,
    paidAt: contract.paidAt || null,
    sentAt: contract.sentAt || null,
    respondedAt: contract.respondedAt || null,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    currentMilestoneIndex: contract.currentMilestoneIndex,
    milestones: contract.milestones,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, statusInfo, "Contract status fetched successfully")
    );
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