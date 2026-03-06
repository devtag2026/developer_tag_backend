import Subscription from "../models/subscription.model.js";
import Payment from "../models/payment.model.js";
import Invoice from "../models/invoice.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStripeClient, PLAN_INTERVAL_MAP } from "../config/stripe.js";
import {
    sendSubscriptionInvitationEmail,
    sendSubscriptionConfirmationEmail,
    sendPaymentFailedEmail,
    sendPaymentReceiptEmail,
} from "../utils/subscriptionEmail.js";

// ─── Helper: get or create a Stripe customer ─────────────────────────────────
const getOrCreateStripeCustomer = async (stripe, clientName, clientEmail, existingCustomerId) => {
    if (existingCustomerId) {
        return existingCustomerId;
    }
    const customer = await stripe.customers.create({
        name: clientName,
        email: clientEmail,
    });
    return customer.id;
};

// ─── Helper: map plan type to Stripe price amount + interval ─────────────────
const buildStripePrice = async (stripe, planType, amount, currency, productName) => {
    const intervalConfig = PLAN_INTERVAL_MAP[planType];
    if (!intervalConfig) {
        throw new ApiError(400, `Invalid plan type: ${planType}`);
    }

    // Create a one-time product per subscription (no shared price IDs)
    const product = await stripe.products.create({ name: productName });

    const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100), // Stripe uses cents
        currency,
        recurring: {
            interval:       intervalConfig.interval,
            interval_count: intervalConfig.interval_count,
        },
        product: product.id,
    });

    return price.id;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE SUBSCRIPTION
//    Admin creates a subscription record + Stripe customer + payment link.
//    The subscription stays "pending" until the client pays.
// ─────────────────────────────────────────────────────────────────────────────
export const createSubscription = asyncHandler(async (req, res) => {
    const { clientName, clientEmail, planType, planName, description, amount, currency = "usd" } = req.body;

    if (!clientName || !clientEmail || !planType || !planName || amount == null) {
        throw new ApiError(400, "Missing required fields: clientName, clientEmail, planType, planName, amount");
    }

    if (!PLAN_INTERVAL_MAP[planType]) {
        throw new ApiError(400, `Invalid planType. Must be one of: ${Object.keys(PLAN_INTERVAL_MAP).join(", ")}`);
    }

    const stripe = getStripeClient();

    // Check if this client already has an active subscription
    const existing = await Subscription.findOne({ clientEmail, status: "active" });
    if (existing) {
        throw new ApiError(409, "This client already has an active subscription");
    }

    // Create or reuse Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, clientName, clientEmail, null);

    // Create Stripe Price (recurring)
    const stripePriceId = await buildStripePrice(
        stripe,
        planType,
        amount,
        currency,
        `${planName} — ${clientName}`
    );

    // Create Stripe Checkout Session (hosted payment page)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
        customer:   stripeCustomerId,
        mode:       "subscription",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${frontendUrl}/subscription/cancel`,
        metadata: {
            clientName,
            clientEmail,
            planType,
            planName,
        },
    });

    // Save subscription to DB (status: pending until webhook fires)
    const subscription = await Subscription.create({
        clientName,
        clientEmail,
        planType,
        planName,
        description,
        amount,
        currency,
        stripeCustomerId,
        stripePriceId,
        status: "pending",
        invitationSentAt: new Date(),
    });

    return res.status(201).json(
        new ApiResponse(201, {
            subscription,
            paymentLink: session.url,
        }, "Subscription created successfully. Share the payment link with the client.")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEND SUBSCRIPTION INVITATION EMAIL
//    Admin manually triggers the invitation email to the client.
// ─────────────────────────────────────────────────────────────────────────────
export const sendSubscriptionInvitation = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    if (subscription.status === "active") {
        throw new ApiError(400, "Subscription is already active");
    }

    const stripe = getStripeClient();

    // Generate a fresh checkout session for the invite link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
        customer:   subscription.stripeCustomerId,
        mode:       "subscription",
        line_items: [{ price: subscription.stripePriceId, quantity: 1 }],
        success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${frontendUrl}/subscription/cancel`,
    });

    // Send invitation email (non-blocking)
    sendSubscriptionInvitationEmail({
        clientName:  subscription.clientName,
        clientEmail: subscription.clientEmail,
        planName:    subscription.planName,
        planType:    subscription.planType,
        amount:      subscription.amount,
        currency:    subscription.currency,
        description: subscription.description,
        paymentLink: session.url,
    }).catch((err) => console.error("[Invite Email Error]", err.message));

    // Update invitationSentAt timestamp
    subscription.invitationSentAt = new Date();
    await subscription.save();

    return res.status(200).json(
        new ApiResponse(200, { paymentLink: session.url }, "Invitation email sent to client successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET ALL SUBSCRIPTIONS (Admin — paginated + filterable)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    const rawPage  = Number(req.query.page)  || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page  = rawPage  < 1 ? 1  : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);

    const search   = (req.query.search || "").trim();
    const status   = req.query.status?.trim();
    const planType = req.query.planType?.trim();

    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { clientName:  { $regex: regex } },
            { clientEmail: { $regex: regex } },
            { planName:    { $regex: regex } },
        ];
    }
    if (status)   filter.status   = status;
    if (planType) filter.planType = planType;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Subscription.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
        }, "Subscriptions fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET SINGLE SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
export const getSubscriptionById = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }
    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscription fetched successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CANCEL SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
export const cancelSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    if (subscription.status === "cancelled") {
        throw new ApiError(400, "Subscription is already cancelled");
    }

    // Cancel on Stripe if we have a Stripe subscription ID
    if (subscription.stripeSubscriptionId) {
        const stripe = getStripeClient();
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    subscription.status      = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscription cancelled successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PAUSE SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
export const pauseSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    if (subscription.status !== "active") {
        throw new ApiError(400, "Only active subscriptions can be paused");
    }

    // Pause billing on Stripe
    if (subscription.stripeSubscriptionId) {
        const stripe = getStripeClient();
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: { behavior: "void" },
        });
    }

    subscription.status = "paused";
    await subscription.save();

    return res.status(200).json(
        new ApiResponse(200, subscription, "Subscription paused successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBSCRIPTION STATS (Admin dashboard summary)
// ─────────────────────────────────────────────────────────────────────────────
export const getSubscriptionStats = asyncHandler(async (req, res) => {
    const [total, active, paused, cancelled, pending, expired] = await Promise.all([
        Subscription.countDocuments(),
        Subscription.countDocuments({ status: "active" }),
        Subscription.countDocuments({ status: "paused" }),
        Subscription.countDocuments({ status: "cancelled" }),
        Subscription.countDocuments({ status: "pending" }),
        Subscription.countDocuments({ status: "expired" }),
    ]);

    // Total monthly revenue from active subscriptions
    const revenueAgg = await Subscription.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            active,
            paused,
            cancelled,
            pending,
            expired,
            totalRevenue,
        }, "Subscription stats fetched successfully")
    );
});

export const stripeWebhook = asyncHandler(async (req, res) => {
    const stripe          = getStripeClient();
    const webhookSecret   = process.env.STRIPE_WEBHOOK_SECRET;
    const sig             = req.headers["stripe-signature"];

    if (!webhookSecret) {
        throw new ApiError(500, "STRIPE_WEBHOOK_SECRET is not configured");
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {

        case "invoice.paid": {
            const invoice        = event.data.object;
            const stripeSubId    = invoice.subscription;
            const stripeInvoiceId = invoice.id;
            const amountPaid     = invoice.amount_paid / 100; // cents → dollars
            const currency       = invoice.currency;
            const periodEnd      = new Date(invoice.lines?.data?.[0]?.period?.end * 1000);
            const periodStart    = new Date(invoice.lines?.data?.[0]?.period?.start * 1000);

            const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubId })
                || await Subscription.findOne({ stripeCustomerId: invoice.customer });

            if (!sub) {
                console.warn(`[Webhook] invoice.paid — no subscription found for ${stripeSubId}`);
                break;
            }

            if (sub.status === "pending" || sub.status === "past_due") {
                sub.stripeSubscriptionId = stripeSubId;
                sub.status               = "active";
                sub.activatedAt          = sub.activatedAt || new Date();
            }
            sub.currentPeriodStart = periodStart;
            sub.currentPeriodEnd   = periodEnd;
            await sub.save();

            const payment = await Payment.create({
                referenceType:          "subscription",
                referenceId:            sub._id,
                referenceModel:         "Subscription",
                clientName:             sub.clientName,
                clientEmail:            sub.clientEmail,
                amount:                 amountPaid,
                currency,
                status:                 "succeeded",
                stripePaymentIntentId:  invoice.payment_intent,
                stripeInvoiceId,
                description:            `${sub.planName} — cycle payment`,
            });

            // Mark any related DB invoices as paid
            await Invoice.updateMany(
                { subscriptionId: sub._id, status: "unpaid" },
                { status: "paid", paidAt: new Date(), stripeInvoiceId }
            );

            // Send receipt email (non-blocking)
            sendPaymentReceiptEmail({
                clientName:    sub.clientName,
                clientEmail:   sub.clientEmail,
                planName:      sub.planName,
                amount:        amountPaid,
                currency,
                invoiceNumber: stripeInvoiceId,
                paidAt:        new Date(),
            }).catch((err) => console.error("[Receipt Email Error]", err.message));


            if (!sub.activatedAt || sub.status === "pending") {
                sendSubscriptionConfirmationEmail({
                    clientName:       sub.clientName,
                    clientEmail:      sub.clientEmail,
                    planName:         sub.planName,
                    planType:         sub.planType,
                    amount:           amountPaid,
                    currency,
                    currentPeriodEnd: periodEnd,
                }).catch((err) => console.error("[Confirmation Email Error]", err.message));
            }

            
            payment.receiptSentAt = new Date();
            await payment.save();

            console.log(`[Webhook] invoice.paid — subscription ${sub._id} activated/renewed`);
            break;
        }


        case "invoice.payment_failed": {
            const invoice     = event.data.object;
            const stripeSubId = invoice.subscription;
            const nextRetry   = invoice.next_payment_attempt
                ? new Date(invoice.next_payment_attempt * 1000)
                : null;

            const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubId })
                || await Subscription.findOne({ stripeCustomerId: invoice.customer });

            if (!sub) {
                console.warn(`[Webhook] invoice.payment_failed — no subscription found for ${stripeSubId}`);
                break;
            }

            sub.status = "past_due";
            await sub.save();
            await Payment.create({
                referenceType:  "subscription",
                referenceId:    sub._id,
                referenceModel: "Subscription",
                clientName:     sub.clientName,
                clientEmail:    sub.clientEmail,
                amount:         invoice.amount_due / 100,
                currency:       invoice.currency,
                status:         "failed",
                stripeInvoiceId: invoice.id,
                failureReason:  invoice.last_finalization_error?.message || "Payment failed",
                description:    `${sub.planName} — failed payment`,
            });

            sendPaymentFailedEmail({
                clientName:  sub.clientName,
                clientEmail: sub.clientEmail,
                planName:    sub.planName,
                amount:      invoice.amount_due / 100,
                currency:    invoice.currency,
                retryDate:   nextRetry,
            }).catch((err) => console.error("[Payment Failed Email Error]", err.message));

            console.log(`[Webhook] invoice.payment_failed — subscription ${sub._id} marked past_due`);
            break;
        }


        case "customer.subscription.deleted": {
            const stripeSub = event.data.object;

            const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
            if (!sub) {
                console.warn(`[Webhook] subscription.deleted — no record found for ${stripeSub.id}`);
                break;
            }

            sub.status      = "cancelled";
            sub.cancelledAt = new Date();
            await sub.save();

            console.log(`[Webhook] customer.subscription.deleted — subscription ${sub._id} cancelled`);
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }


    return res.status(200).json({ received: true });
});