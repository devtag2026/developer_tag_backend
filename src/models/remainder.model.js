import mongoose, { Schema } from "mongoose";

const reminderLogSchema = new Schema(
    {
        // Reference to the invoice
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
            required: [true, "Invoice ID is required"],
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

        // Reminder Details
        reminderType: {
            type: String,
            required: [true, "Reminder type is required"],
            enum: ["before-3-days", "before-1-day", "after-2-days", "after-5-days", "custom"],
        },
        emailSubject: {
            type: String,
            required: [true, "Email subject is required"],
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: ["sent", "failed"],
            default: "sent",
        },
        failureReason: {
            type: String,
            trim: true,
        },

        // Timestamps
        sentAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

reminderLogSchema.index({ invoiceId: 1 });
reminderLogSchema.index({ clientEmail: 1 });
reminderLogSchema.index({ status: 1 });
reminderLogSchema.index({ sentAt: -1 });
reminderLogSchema.index({ invoiceId: 1, reminderType: 1 });

export default mongoose.model("ReminderLog", reminderLogSchema);