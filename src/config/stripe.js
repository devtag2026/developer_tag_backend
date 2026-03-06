import Stripe from "stripe";

// Lazy initialization — Stripe client created only when first needed
let stripeClient = null;

export const getStripeClient = () => {
    if (!stripeClient) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY environment variable is not set");
        }
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-04-10",
        });
    }
    return stripeClient;
};

// Interval mapping from plan type to Stripe recurring interval
export const PLAN_INTERVAL_MAP = {
    "monthly":  { interval: "month", interval_count: 1 },
    "4-month":  { interval: "month", interval_count: 4 },
    "8-month":  { interval: "month", interval_count: 8 },
    "12-month": { interval: "year",  interval_count: 1 },
};

export default getStripeClient;