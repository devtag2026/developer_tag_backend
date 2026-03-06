import { Resend } from "resend";

let resend = null;

const getResendClient = () => {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const FROM_EMAIL  = process.env.FROM_EMAIL  || "noreply@developertag.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@developertag.com";

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const emailShell = (accentColor = "#13a87c", headerTitle, headerSub, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f4f4; color:#333; }
    .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header  { background:${accentColor}; color:#fff; padding:28px 32px; }
    .header h1 { margin:0 0 6px; font-size:22px; }
    .header p  { margin:0; font-size:14px; opacity:.88; }
    .body    { padding:28px 32px; }
    .info-table { width:100%; border-collapse:collapse; margin:18px 0; }
    .info-table td { padding:10px 8px; border-bottom:1px solid #eee; font-size:14px; vertical-align:top; }
    .info-table td:first-child { font-weight:bold; width:38%; color:#555; }
    .btn { display:inline-block; margin-top:22px; padding:12px 28px; background:${accentColor}; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold; }
    .note { margin-top:18px; padding:14px; background:#f9f9f9; border-left:4px solid ${accentColor}; font-size:13px; color:#555; border-radius:0 4px 4px 0; }
    .footer { padding:18px 32px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${headerTitle}</h1>
      <p>${headerSub}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">DeveloperTag &mdash; This is an automated email. Please do not reply.</div>
  </div>
</body>
</html>`;

// ─── 1. Subscription Invitation (sent to client by admin) ────────────────────
const buildInvitationEmail = ({ clientName, planName, planType, amount, currency, description, paymentLink }) => {
    const subject = `You're invited to subscribe — ${planName} | DeveloperTag`;
    const html = emailShell(
        "#13a87c",
        "Maintenance Subscription Invitation",
        "DeveloperTag is inviting you to activate your maintenance plan",
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>DeveloperTag has prepared a maintenance subscription for you. Please review the details below and click the button to activate your plan.</p>
        <table class="info-table">
          <tr><td>Plan</td><td>${planName}</td></tr>
          <tr><td>Type</td><td>${planType}</td></tr>
          <tr><td>Amount</td><td>${currency.toUpperCase()} $${amount}</td></tr>
          <tr><td>Description</td><td>${description || "Ongoing maintenance and support."}</td></tr>
        </table>
        <a href="${paymentLink}" class="btn">Activate Subscription →</a>
        <div class="note">
          ⚠️ This link is secure and unique to you. Your subscription will be activated automatically once payment is confirmed.
        </div>
        `
    );
    return { subject, html };
};

// ─── 2. Subscription Confirmation (sent to client after payment succeeds) ─────
const buildConfirmationEmail = ({ clientName, planName, planType, amount, currency, currentPeriodEnd }) => {
    const renewDate = currentPeriodEnd
        ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

    const subject = `Subscription Activated — ${planName} | DeveloperTag`;
    const html = emailShell(
        "#13a87c",
        "Subscription Activated 🎉",
        "Your maintenance plan is now live",
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>Your subscription has been successfully activated. Here's a summary:</p>
        <table class="info-table">
          <tr><td>Plan</td><td>${planName}</td></tr>
          <tr><td>Type</td><td>${planType}</td></tr>
          <tr><td>Amount Charged</td><td>${currency.toUpperCase()} $${amount}</td></tr>
          <tr><td>Next Renewal</td><td>${renewDate}</td></tr>
        </table>
        <p>You will be billed automatically at the start of each cycle. If you have any questions, feel free to reach out to us.</p>
        <div class="note">
          Your subscription will auto-renew unless cancelled. You can manage your subscription by contacting us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>
        `
    );
    return { subject, html };
};

// ─── 3. Payment Failed (sent to client when Stripe charge fails) ──────────────
const buildPaymentFailedEmail = ({ clientName, planName, amount, currency, retryDate }) => {
    const retry = retryDate
        ? new Date(retryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "soon";

    const subject = `Action Required: Payment Failed — ${planName} | DeveloperTag`;
    const html = emailShell(
        "#e53e3e",
        "Payment Failed",
        "We were unable to process your subscription payment",
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>We were unable to charge your card for your <strong>${planName}</strong> subscription. Here are the details:</p>
        <table class="info-table">
          <tr><td>Plan</td><td>${planName}</td></tr>
          <tr><td>Amount Due</td><td>${currency.toUpperCase()} $${amount}</td></tr>
          <tr><td>Next Retry</td><td>${retry}</td></tr>
        </table>
        <p>Please update your payment method to avoid interruption to your maintenance services.</p>
        <div class="note">
          ⚠️ Your subscription will be paused if payment is not received. Please contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> for assistance.
        </div>
        `
    );
    return { subject, html };
};

// ─── 4. Admin Notification (sent to admin when new subscription activates) ────
const buildAdminNotificationEmail = ({ clientName, clientEmail, planName, amount, currency }) => {
    const subject = `New Subscription Activated — ${clientName}`;
    const html = emailShell(
        "#2b6cb0",
        "New Subscription Activated",
        "A client has successfully subscribed to a maintenance plan",
        `
        <table class="info-table">
          <tr><td>Client</td><td>${clientName}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
          <tr><td>Plan</td><td>${planName}</td></tr>
          <tr><td>Amount</td><td>${currency.toUpperCase()} $${amount}</td></tr>
          <tr><td>Activated At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        `
    );
    return { subject, html };
};

// ─── 5. Payment Receipt (sent to client after each successful charge) ─────────
const buildReceiptEmail = ({ clientName, planName, amount, currency, invoiceNumber, paidAt }) => {
    const paidDate = paidAt
        ? new Date(paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString();

    const subject = `Payment Receipt — ${invoiceNumber || planName} | DeveloperTag`;
    const html = emailShell(
        "#13a87c",
        "Payment Receipt",
        "Thank you — your payment has been received",
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>We've received your payment. Here's your receipt:</p>
        <table class="info-table">
          <tr><td>Invoice</td><td>${invoiceNumber || "—"}</td></tr>
          <tr><td>Plan</td><td>${planName}</td></tr>
          <tr><td>Amount Paid</td><td>${currency.toUpperCase()} $${amount}</td></tr>
          <tr><td>Date</td><td>${paidDate}</td></tr>
        </table>
        <p>Thank you for trusting DeveloperTag with your project maintenance.</p>
        `
    );
    return { subject, html };
};

// ─── Send helpers ─────────────────────────────────────────────────────────────
const send = async (to, subject, html, tag) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn(`[Email] RESEND_API_KEY not set. Skipping: ${tag}`);
            return;
        }
        const { data, error } = await getResendClient().emails.send({ from: FROM_EMAIL, to, subject, html });
        if (error) {
            console.error(`[Email] Failed to send ${tag}:`, error);
            return;
        }
        console.log(`[Email] Sent ${tag}:`, data?.id);
    } catch (err) {
        console.error(`[Email] Exception sending ${tag}:`, err.message);
    }
};

export const sendSubscriptionInvitationEmail = async (data) => {
    const { subject, html } = buildInvitationEmail(data);
    await send(data.clientEmail, subject, html, "subscription-invitation");
};

export const sendSubscriptionConfirmationEmail = async (data) => {
    const { subject, html } = buildConfirmationEmail(data);
    await send(data.clientEmail, subject, html, "subscription-confirmation");
    // Also notify admin (non-blocking)
    const { subject: aSubject, html: aHtml } = buildAdminNotificationEmail(data);
    send(ADMIN_EMAIL, aSubject, aHtml, "admin-subscription-notification").catch(() => {});
};

export const sendPaymentFailedEmail = async (data) => {
    const { subject, html } = buildPaymentFailedEmail(data);
    await send(data.clientEmail, subject, html, "payment-failed");
};

export const sendPaymentReceiptEmail = async (data) => {
    const { subject, html } = buildReceiptEmail(data);
    await send(data.clientEmail, subject, html, "payment-receipt");
};