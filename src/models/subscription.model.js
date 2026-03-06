import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        // Client Info
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

        // Plan Details
        planType: {
            type: String,
            required: [true, "Plan type is required"],
            enum: ["monthly", "4-month", "8-month", "12-month"],
        },
        planName: {
            type: String,
            required: [true, "Plan name is required"],
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

        // Stripe References
        stripeCustomerId: {
            type: String,
            trim: true,
        },
        stripeSubscriptionId: {
            type: String,
            trim: true,
        },
        stripePriceId: {
            type: String,
            trim: true,
        },

        // Billing Cycle
        currentPeriodStart: {
            type: Date,
        },
        currentPeriodEnd: {
            type: Date,
        },
        autoRenew: {
            type: Boolean,
            default: true,
        },

        // Status
        status: {
            type: String,
            enum: ["pending", "active", "paused", "cancelled", "expired", "past_due"],
            default: "pending",
        },

        // Invitation
        invitationSentAt: {
            type: Date,
        },
        activatedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

subscriptionSchema.index({ clientEmail: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ planType: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.model("Subscription", subscriptionSchema);