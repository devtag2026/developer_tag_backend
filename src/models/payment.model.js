import mongoose, { Schema } from "mongoose";

const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded", "cancelled"];

const paymentSchema = new Schema(
    {
        // Reference to the parent entity
        referenceType: {
            type: String,
            required: [true, "Reference type is required"],
            enum: ["subscription", "contract", "invoice"],
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: [true, "Reference ID is required"],
            refPath: "referenceModel",
        },
        referenceModel: {
            type: String,
            required: true,
            enum: ["Subscription", "Contract", "Invoice"],
        },

        // Client Info (denormalized for quick access)
        clientName: {
            type: String,
            required: [true, "Client name is required"],
            trim: true,
        },
        clientEmail: {
            type: String,
            required: [true, "Client email is required"],
            trim: true,
            lowercase: true,
        },

        // Payment Details
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        currency: {
            type: String,
            default: "usd",
            lowercase: true,
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: "pending",
        },

        // Stripe References
        stripePaymentIntentId: {
            type: String,
            trim: true,
        },
        stripeInvoiceId: {
            type: String,
            trim: true,
        },
        stripeChargeId: {
            type: String,
            trim: true,
        },

        // Metadata
        description: {
            type: String,
            trim: true,
        },
        receiptSentAt: {
            type: Date,
        },
        failureReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ referenceType: 1, referenceId: 1 });
paymentSchema.index({ clientEmail: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model("Payment", paymentSchema);