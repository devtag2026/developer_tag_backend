import nodemailer from "nodemailer";
import { ApiError } from "./apiError.js";
import { PAYMENT_TERMS_LABEL } from "../constant/enums.js";
// ─── Lazy SMTP transporter ────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new ApiError(500, "SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env file.");
        }

        transporter = nodemailer.createTransport({
            host:   process.env.SMTP_HOST,
            port:   Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true", // true for port 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    return transporter;
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
    .btn-row { margin-top:24px; }
    .btn { display:inline-block; padding:12px 24px; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold; margin-right:10px; margin-bottom:10px; }
    .btn-primary   { background:${accentColor}; }
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

const formatCurrency = (amount, currency = "usd") =>
    `${currency.toUpperCase()} $${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;



// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async (to, subject, html, tag) => {
    const mailer = getTransporter(); // throws ApiError if misconfigured

    try {
        const info = await mailer.sendMail({
            from:    `"DeveloperTag" <${FROM_EMAIL}>`,
            to,
            subject,
            html,
        });
        console.log(`[ContractEmail] Sent ${tag}: ${info.messageId}`);
    } catch (err) {
        throw new ApiError(500, `Failed to send ${tag} email: ${err.message}`);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Contract sharing email (client)
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
        <p><strong>Advance Payment Required</strong></p>
        <p>An advance of <strong>${formatCurrency(advanceAmount, currency)}</strong> is required to activate this contract.</p>
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
        <p>DeveloperTag has prepared a contract for your upcoming project. Please review the details below and sign at your earliest convenience.</p>
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
         Once signed${advanceAmount > 0 ? " and the advance is received" : ""}, your project will be officially activated. Questions? Contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

// 2. Admin notification (when contract is sent)
const buildAdminNotificationEmail = ({
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
        </table>`
    );

    return { subject, html };
};

// 3. Contract signed confirmation (client)
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
        "Contract Signed Successfully",
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
        <p>Our team will begin project preparations shortly and will be in touch with next steps.</p>
        <div class="note">
          Questions? Reach us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

// 4. Advance payment confirmation (client)
const buildContractPaymentConfirmationEmail = ({
    clientName,
    projectName,
    advanceAmount,
    currency,
}) => {
    const subject = `Advance Payment Received — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Advance Payment Received",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>We have successfully received your advance payment for <strong>${projectName}</strong>. Your project is now officially activated!</p>
        <table class="info-table">
          <tr><td>Project</td><td>${projectName}</td></tr>
          <tr><td>Amount Received</td><td>${formatCurrency(advanceAmount, currency)}</td></tr>
          <tr><td>Received At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <p>Our team is excited to get started. A project kickoff communication is on its way.</p>
        <div class="note">
          Keep this email as your payment confirmation. Queries? <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED SEND FUNCTIONS
// All throw ApiError on failure so asyncHandler catches and forwards them.
// ─────────────────────────────────────────────────────────────────────────────

// Called in contract.controller.js → sendContract() / resendContract()
export const sendContractEmail = async (data) => {
    const { subject, html } = buildContractEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-sharing");

    // Admin notification — non-blocking, failure should not block the response
    const { subject: aSubject, html: aHtml } = buildAdminNotificationEmail(data);
    sendEmail(ADMIN_EMAIL, aSubject, aHtml, "admin-contract-notification").catch(
        (err) => console.error("[ContractEmail] Admin notification failed:", err.message)
    );
};

// Called when client signs via client-facing page (Day 6)
export const sendContractSignedEmail = async (data) => {
    const { subject, html } = buildContractSignedEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-signed");
};

// Called after Stripe confirms advance payment (webhook / Day 6)
export const sendContractPaymentConfirmationEmail = async (data) => {
    const { subject, html } = buildContractPaymentConfirmationEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-payment-confirmation");
};