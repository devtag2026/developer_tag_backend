/**
 * seedSubscriptionEmail.js
 *
 * Test script to fire all 4 subscription email templates via Resend.
 * Run this once to verify your email templates are rendering correctly
 * before going live with the real Stripe webhook flow.
 *
 * Usage:
 *   node -r dotenv/config src/utils/seedSubscriptionEmail.js
 *
 * Optional — send only a specific template:
 *   TEMPLATE=invitation   node -r dotenv/config src/utils/seedSubscriptionEmail.js
 *   TEMPLATE=confirmation node -r dotenv/config src/utils/seedSubscriptionEmail.js
 *   TEMPLATE=failed       node -r dotenv/config src/utils/seedSubscriptionEmail.js
 *   TEMPLATE=receipt      node -r dotenv/config src/utils/seedSubscriptionEmail.js
 */

import {
    sendSubscriptionInvitationEmail,
    sendSubscriptionConfirmationEmail,
    sendPaymentFailedEmail,
    sendPaymentReceiptEmail,
} from "./subscriptionEmail.js";

// ─── Mock data — edit to match your test client ──────────────────────────────
const TEST_CLIENT = {
    clientName:  "Ahmed Raza",
    clientEmail: process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || "test@developertag.com",
    planName:    "Annual Maintenance",
    planType:    "12-month",
    amount:      1999,
    currency:    "usd",
    description: "Full-year maintenance plan with priority support.",
};

const MOCK_DATA = {
    invitation: {
        ...TEST_CLIENT,
        paymentLink: "https://checkout.stripe.com/pay/cs_test_mock_link",
    },

    confirmation: {
        ...TEST_CLIENT,
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },

    failed: {
        ...TEST_CLIENT,
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },

    receipt: {
        ...TEST_CLIENT,
        invoiceNumber: "INV-00001",
        paidAt:        new Date(),
    },
};

// ─── Runner ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
    const template = process.env.TEMPLATE?.toLowerCase();

    console.log("=".repeat(60));
    console.log("📧  Subscription Email Seed Script");
    console.log("=".repeat(60));

    if (!process.env.RESEND_API_KEY) {
        console.error("❌  RESEND_API_KEY is not set. Aborting.");
        process.exit(1);
    }

    const target = TEST_CLIENT.clientEmail;
    console.log(`📬  Sending test emails to: ${target}\n`);

    const tasks = [
        {
            key:   "invitation",
            label: "Subscription Invitation",
            fn:    () => sendSubscriptionInvitationEmail(MOCK_DATA.invitation),
        },
        {
            key:   "confirmation",
            label: "Subscription Confirmation",
            fn:    () => sendSubscriptionConfirmationEmail(MOCK_DATA.confirmation),
        },
        {
            key:   "failed",
            label: "Payment Failed",
            fn:    () => sendPaymentFailedEmail(MOCK_DATA.failed),
        },
        {
            key:   "receipt",
            label: "Payment Receipt",
            fn:    () => sendPaymentReceiptEmail(MOCK_DATA.receipt),
        },
    ];

    const toRun = template
        ? tasks.filter((t) => t.key === template)
        : tasks;

    if (toRun.length === 0) {
        console.error(`❌  Unknown template: "${template}". Valid options: invitation, confirmation, failed, receipt`);
        process.exit(1);
    }

    for (const task of toRun) {
        try {
            console.log(`🚀  Sending: ${task.label}...`);
            await task.fn();
            console.log(`✅  Sent:    ${task.label}\n`);
            // Small delay between sends to avoid rate limiting
            await delay(800);
        } catch (err) {
            console.error(`❌  Failed:  ${task.label}`);
            console.error(`    Reason:  ${err.message}\n`);
        }
    }

    console.log("=".repeat(60));
    console.log("✅  Email seed complete. Check your inbox.");
    console.log("=".repeat(60));
    process.exit(0);
};

run();