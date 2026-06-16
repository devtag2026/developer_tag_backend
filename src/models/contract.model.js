import mongoose, { Schema } from "mongoose";
import { EMAIL } from "../constant/validations/pattern.js";

const contractSchema = new Schema(
    {
        // Project & Client Info
        projectName: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: [200, "Project name cannot exceed 200 characters"],
        },
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
            match: [EMAIL.regex,EMAIL.message],
        },

        // Contract Financials
        contractAmount: {
            type: Number,
            required: [true, "Contract amount is required"],
            min: [0, "Contract amount cannot be negative"],
        },
        currency: {
            type: String,
            default: "usd",
            lowercase: true,
            trim: true,
        },
        advanceAmount: {
            type: Number,
            default: 0,
            min: [0, "Advance amount cannot be negative"],
        },

        // Contract Dates
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },

        // Payment Terms
        paymentTerms: {
            type: String,
            enum: ["milestone", "final-payment", "upfront", "installments"],
            required: [true, "Payment terms are required"],
        },

        // Content
        customClauses: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },

        // Status
        status: {
            type: String,
            enum: ["pending", "signed", "paid", "active", "cancelled"],
            default: "pending",
        },

        // Stripe References
        stripePaymentIntentId: {
            type: String,
            trim: true,
        },

        // Tracking
        sentAt: {
            type: Date,
        },
        signedAt: {
            type: Date,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
contractSchema.index({ clientEmail: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ projectName: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Contract", contractSchema);