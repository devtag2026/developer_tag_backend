import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
    {
        // Optional references to parent entities
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
            default: null,
        },
        contractId: {
            type: Schema.Types.ObjectId,
            ref: "Contract",
            default: null,
        },

        // Client Info (denormalized for quick access)
        clientName: {
            type: String,
            required: [true, "Client name is required"],
            trim: true,
            maxlength: [100, "Client name cannot exceed 100 characters"],
        },
        clientEmail: {
            type: String,
            required: [true, "Client email is required"],
            trim: true,
            lowercase: true,
            match: [/.+\@.+\..+/, "Please provide a valid email address"],
        },

        // Invoice Details
        invoiceNumber: {
            type: String,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
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

        // Due Date
        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
        },

        // Status
        status: {
            type: String,
            enum: ["unpaid", "paid", "overdue", "cancelled"],
            default: "unpaid",
        },

        // Stripe Reference
        stripeInvoiceId: {
            type: String,
            trim: true,
        },

        // Tracking
        paidAt: {
            type: Date,
        },
        reminderCount: {
            type: Number,
            default: 0,
        },
        lastReminderSentAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate invoice number before saving
invoiceSchema.pre("save", async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model("Invoice").countDocuments();
        const pad = String(count + 1).padStart(5, "0");
        this.invoiceNumber = `INV-${pad}`;
    }
    next();
});

invoiceSchema.index({ clientEmail: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ subscriptionId: 1 });
invoiceSchema.index({ contractId: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model("Invoice", invoiceSchema);