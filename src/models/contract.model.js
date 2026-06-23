import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { EMAIL } from "../constant/validations/pattern.js";

const milestoneSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Milestone title is required"],
            trim: true,
            maxlength: [200, "Milestone title cannot exceed 200 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Milestone description cannot exceed 1000 characters"],
        },
        amount: {
            type: Number,
            required: [true, "Milestone amount is required"],
            min: [0.01, "Milestone amount must be greater than 0"],
        },
        dueDate: {
            type: Date,
        },
        order: {
            type: Number,
            required: true,
        },

        // Lifecycle: pending_payment -> checkout_created -> paid
        status: {
            type: String,
            enum: ["pending_payment", "checkout_created", "paid"],
            default: "pending_payment",
        },

        // Stripe references (populated as the flow progresses)
        stripeCheckoutSessionId: {
            type: String,
            trim: true,
        },
        stripePaymentIntentId: {
            type: String,
            trim: true,
        },
        paidAt: {
            type: Date,
        },

        // Delivery lifecycle: upcoming -> in_progress -> completed
        workStatus: {
            type: String,
            enum: ["upcoming", "in_progress", "completed"],
            default: "upcoming",
        },

        completedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

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
            match: [EMAIL.regex, EMAIL.message],
        },
        serviceType: {
            type: String,
            trim: true,
            maxlength: [200, "Service type cannot exceed 200 characters"],
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

        // Milestones — replace the old single advanceAmount model.
        // Every contract must have at least one; amounts must sum to contractAmount.
        milestones: {
            type: [milestoneSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: "At least one milestone is required",
            },
        },

        // Index of the milestone currently in progress. Advances when due date
        // passes (auto) or admin marks complete — not when payment is received.
        currentMilestoneIndex: {
            type: Number,
            default: 0,
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

        // Project Scope
        revisions: {
            type: Number,
            default: 2,
            min: [0, "Revisions cannot be negative"],
        },
        scopeOfWork: {
            type: String,
            trim: true,
            maxlength: [2000, "Scope of work cannot exceed 2000 characters"],
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

        // Status — added "rejected" for the client decline path,
        // and reordered to reflect the real lifecycle.
        status: {
            type: String,
            enum: ["draft", "sent", "accepted", "pending", "rejected", "active", "completed", "cancelled"],
            default: "draft",
        },

        // Unguessable token used in the accept/reject email links,
        // since the client acts on this without being authenticated.
        accessToken: {
            type: String,
            unique: true,
            index: true,
        },

        // Tracking
        sentAt: {
            type: Date,
        },
        respondedAt: {
            type: Date, // set on accept OR reject
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [1000, "Rejection reason cannot exceed 1000 characters"],
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Generate a secure access token before first save
contractSchema.pre("validate", function (next) {
    if (!this.accessToken) {
        this.accessToken = crypto.randomBytes(32).toString("hex");
    }
    next();
});

// Indexes for efficient querying
contractSchema.index({ clientEmail: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ projectName: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Contract", contractSchema);