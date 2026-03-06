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

// ─── Shared HTML shell (matches subscriptionEmail.js branding) ───────────────
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
    .btn-row { margin-top:24px; display:flex; gap:12px; flex-wrap:wrap; }
    .btn { display:inline-block; padding:12px 24px; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold; }
    .btn-primary  { background:${accentColor}; }
    .btn-secondary { background:#2b6cb0; }
    .divider { border:none; border-top:1px solid #eee; margin:24px 0; }
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
    <div class="footer">DeveloperTag &mdash; This is an automated email. Please do not reply directly.</div>
  </div>
</body>
</html>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

const formatCurrency = (amount, currency = "usd") =>
    `${currency.toUpperCase()} $${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const PAYMENT_TERMS_LABEL = {
    "milestone":      "Milestone-Based",
    "final-payment":  "Final Payment",
    "upfront":        "Upfront / Full Payment",
    "installments":   "Installments",
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTRACT SHARING EMAIL (sent to client)
//    Includes: contract summary, view/sign link, optional advance payment link
// ─────────────────────────────────────────────────────────────────────────────
const buildContractEmail = ({
    clientName,
    projectName,
    contractAmount,
    advanceAmount,
    currency,
    startDate,
    endDate,
    paymentTerms,
    contractViewUrl,
    paymentLink,
}) => {
    const subject = `Contract Ready for Review — ${projectName} | DeveloperTag`;

    const advanceRow = advanceAmount && advanceAmount > 0
        ? `<tr><td>Advance Due</td><td>${formatCurrency(advanceAmount, currency)}</td></tr>`
        : "";

    const paymentSection = paymentLink
        ? `
        <hr class="divider">
        <p><strong>Advance Payment</strong></p>
        <p>An advance payment of <strong>${formatCurrency(advanceAmount, currency)}</strong> is required to activate this contract. You can pay securely using the button below.</p>
        <div class="btn-row">
          <a href="${contractViewUrl}" class="btn btn-primary">View &amp; Sign Contract →</a>
          <a href="${paymentLink}"     class="btn btn-secondary">Pay Advance Now →</a>
        </div>`
        : `
        <div class="btn-row">
          <a href="${contractViewUrl}" class="btn btn-primary">View &amp; Sign Contract →</a>
        </div>`;

    const html = emailShell(
        "#13a87c",
        "Your Contract is Ready",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>DeveloperTag has prepared a contract for your upcoming project. Please review the details below and sign the contract at your earliest convenience.</p>

        <table class="info-table">
          <tr><td>Project</td><td>${projectName}</td></tr>
          <tr><td>Contract Value</td><td>${formatCurrency(contractAmount, currency)}</td></tr>
          ${advanceRow}
          <tr><td>Payment Terms</td><td>${PAYMENT_TERMS_LABEL[paymentTerms] || paymentTerms}</td></tr>
          <tr><td>Start Date</td><td>${formatDate(startDate)}</td></tr>
          <tr><td>End Date</td><td>${formatDate(endDate)}</td></tr>
        </table>

        ${paymentSection}

        <div class="note">
          📄 Once the contract is signed${advanceAmount > 0 ? " and the advance payment is received" : ""}, your project will be officially activated. If you have any questions, contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>
        `
    );

    return { subject, html };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN NOTIFICATION EMAIL
//    Sent to admin when a contract is dispatched to a client
// ─────────────────────────────────────────────────────────────────────────────
const buildAdminContractNotificationEmail = ({
    clientName,
    clientEmail,
    projectName,
    contractAmount,
    currency,
    paymentTerms,
}) => {
    const subject = `Contract Sent — ${projectName} (${clientName})`;

    const html = emailShell(
        "#2b6cb0",
        "Contract Dispatched",
        "A contract has been sent to a client",
        `
        <table class="info-table">
          <tr><td>Client</td><td>${clientName}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
          <tr><td>Project</td><td>${projectName}</td></tr>
          <tr><td>Contract Value</td><td>${formatCurrency(contractAmount, currency)}</td></tr>
          <tr><td>Payment Terms</td><td>${PAYMENT_TERMS_LABEL[paymentTerms] || paymentTerms}</td></tr>
          <tr><td>Sent At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        `
    );

    return { subject, html };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONTRACT SIGNED CONFIRMATION (sent to client after signing)
// ─────────────────────────────────────────────────────────────────────────────
const buildContractSignedEmail = ({
    clientName,
    projectName,
    contractAmount,
    currency,
    startDate,
    endDate,
}) => {
    const subject = `Contract Signed — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Contract Signed Successfully ✅",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>Thank you for signing the contract for <strong>${projectName}</strong>. Here is a summary for your records:</p>

        <table class="info-table">
          <tr><td>Project</td><td>${projectName}</td></tr>
          <tr><td>Contract Value</td><td>${formatCurrency(contractAmount, currency)}</td></tr>
          <tr><td>Start Date</td><td>${formatDate(startDate)}</td></tr>
          <tr><td>End Date</td><td>${formatDate(endDate)}</td></tr>
          <tr><td>Signed At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>

        <p>Our team will now begin project preparations. We'll be in touch shortly with next steps.</p>

        <div class="note">
          If you have any questions or concerns, please contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>
        `
    );

    return { subject, html };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONTRACT ADVANCE PAYMENT CONFIRMATION (sent to client after advance paid)
// ─────────────────────────────────────────────────────────────────────────────
const buildContractPaymentConfirmationEmail = ({
    clientName,
    projectName,
    advanceAmount,
    currency,
}) => {
    const subject = `Advance Payment Received — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Advance Payment Received 🎉",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>We have successfully received your advance payment for <strong>${projectName}</strong>. Your project is now officially activated!</p>

        <table class="info-table">
          <tr><td>Project</td><td>${projectName}</td></tr>
          <tr><td>Amount Received</td><td>${formatCurrency(advanceAmount, currency)}</td></tr>
          <tr><td>Received At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>

        <p>Our team is excited to get started. You will receive a project kickoff communication from us very soon.</p>

        <div class="note">
          Keep this email as your payment confirmation. For any queries, reach us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>
        `
    );

    return { subject, html };
};

// ─── Send helper ─────────────────────────────────────────────────────────────
const send = async (to, subject, html, tag) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn(`[ContractEmail] RESEND_API_KEY not set. Skipping: ${tag}`);
            return;
        }
        const { data, error } = await getResendClient().emails.send({ from: FROM_EMAIL, to, subject, html });
        if (error) {
            console.error(`[ContractEmail] Failed to send ${tag}:`, error);
            return;
        }
        console.log(`[ContractEmail] Sent ${tag}:`, data?.id);
    } catch (err) {
        console.error(`[ContractEmail] Exception sending ${tag}:`, err.message);
    }
};

// ─── Exported send functions ──────────────────────────────────────────────────

// Called in contract.controller.js → sendContract()
export const sendContractEmail = async (data) => {
    const { subject, html } = buildContractEmail(data);
    await send(data.clientEmail, subject, html, "contract-sharing");

    // Notify admin (non-blocking)
    const { subject: aSubject, html: aHtml } = buildAdminContractNotificationEmail(data);
    send(ADMIN_EMAIL, aSubject, aHtml, "admin-contract-notification").catch(() => {});
};

// Called when client signs the contract (Day 6 — client-facing page)
export const sendContractSignedEmail = async (data) => {
    const { subject, html } = buildContractSignedEmail(data);
    await send(data.clientEmail, subject, html, "contract-signed");
};

// Called after Stripe payment intent succeeds for contract advance (Day 3/6)
export const sendContractPaymentConfirmationEmail = async (data) => {
    const { subject, html } = buildContractPaymentConfirmationEmail(data);
    await send(data.clientEmail, subject, html, "contract-payment-confirmation");
};