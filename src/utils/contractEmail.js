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
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    return transporter;
};

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
    .milestone-table { width:100%; border-collapse:collapse; margin:16px 0; }
    .milestone-table td { padding:10px 8px; border-bottom:1px solid #eee; font-size:14px; vertical-align:top; }
    .milestone-table td.amount-col { text-align:right; white-space:nowrap; font-weight:bold; }
    .milestone-table tr.total-row td { border-bottom:none; border-top:2px solid #ddd; font-weight:bold; padding-top:14px; }
    .milestone-desc { color:#777; font-size:12px; display:block; margin-top:2px; }
    .btn-row { margin-top:24px; }
    .btn { display:inline-block; padding:12px 24px; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold; margin-right:10px; margin-bottom:10px; }
    .btn-primary   { background:${accentColor}; }
    .btn-secondary { background:#2b6cb0; }
    .btn-decline   { background:#fff; color:#a33; border:1px solid #e0b4b4; }
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

const formatCurrency = (amount) =>
    `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const escapeHtml = (str = "") =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildMilestoneTable = (milestones = [], currency = "usd", highlightIndex = null, accessToken = null) => {
    const backendUrl = process.env.API_URL || "http://localhost:8000";
    const rows = milestones
        .map((m, i) => {
            const isHighlighted = highlightIndex === i;
            let payButtonHtml = "";
            if (isHighlighted && accessToken) {
                const payUrl = `${backendUrl}/api/v1/contracts/token/${accessToken}/milestones/${m._id}/checkout-redirect`;
                payButtonHtml = ` &nbsp;<a href="${payUrl}" style="display:inline-block;padding:3px 10px;background:#13a87c;color:#fff;text-decoration:none;border-radius:4px;font-size:11px;font-weight:bold;margin-left:6px;">Pay Now</a>`;
            }
            return `
        <tr>
          <td>
            ${i + 1}. ${escapeHtml(m.title)}
            ${isHighlighted ? '<span style="color:#13a87c;font-size:11px;font-weight:bold;"> &nbsp;DUE NOW</span>' : ""}
            ${payButtonHtml}
            ${m.description ? `<span class="milestone-desc">${escapeHtml(m.description)}</span>` : ""}
            ${m.dueDate ? `<span class="milestone-desc">Due: ${formatDate(m.dueDate)}</span>` : ""}
          </td>
          <td class="amount-col">${formatCurrency(m.amount, currency)}</td>
        </tr>`;
        })
        .join("");

    const total = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

    return `
      <table class="milestone-table">
        ${rows}
        <tr class="total-row">
          <td>Total contract value</td>
          <td class="amount-col">${formatCurrency(total, currency)}</td>
        </tr>
      </table>`;
};

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async (to, subject, html, tag) => {
    const mailer = getTransporter();

    console.log(`[ContractEmail] from: ${process.env.SMTP_USER} → to: ${to}`);

    try {
        const info = await mailer.sendMail({
            from: process.env.SMTP_USER,
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

const buildContractEmail = ({
    clientName,
    projectName,
    contractAmount,
    milestones,
    currency,
    startDate,
    endDate,
    paymentTerms,
    acceptUrl,
    rejectUrl,
}) => {
    const subject = `Contract Ready for Review — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Your Contract is Ready",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${escapeHtml(clientName)}</strong>,</p>
        <p>DeveloperTag has prepared a contract for your upcoming project. Please review the details and milestones below.</p>
        <table class="info-table">
          <tr><td>Project</td><td>${escapeHtml(projectName)}</td></tr>
          <tr><td>Payment Terms</td><td>${PAYMENT_TERMS_LABEL[paymentTerms] || paymentTerms}</td></tr>
          <tr><td>Start Date</td><td>${formatDate(startDate)}</td></tr>
          <tr><td>End Date</td><td>${formatDate(endDate)}</td></tr>
        </table>

        <p style="font-weight:bold;margin-top:20px;">Milestones &amp; payment schedule</p>
        ${buildMilestoneTable(milestones, currency)}

        <div class="btn-row">
          <a href="${acceptUrl}" class="btn btn-primary">Accept contract →</a>
          <a href="${rejectUrl}" class="btn btn-decline">Decline</a>
        </div>

        <div class="note">
          Once accepted, milestone 1 (${formatCurrency(milestones[0]?.amount, currency)}) becomes payable to officially activate the project. Questions? Contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

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
          <tr><td>Client</td><td>${escapeHtml(clientName)}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
          <tr><td>Project</td><td>${escapeHtml(projectName)}</td></tr>
          <tr><td>Contract Value</td><td>${formatCurrency(contractAmount, currency)}</td></tr>
          <tr><td>Payment Terms</td><td>${PAYMENT_TERMS_LABEL[paymentTerms] || paymentTerms}</td></tr>
          <tr><td>Sent At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>`
    );

    return { subject, html };
};

const buildContractAcceptedEmail = ({
    clientName,
    projectName,
    contractAmount,
    milestones,
    currency,
    startDate,
    endDate,
    accessToken,
}) => {
    const subject = `Contract Accepted — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Contract Accepted Successfully",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${escapeHtml(clientName)}</strong>,</p>
        <p>Thank you for accepting the contract for <strong>${escapeHtml(projectName)}</strong>. Here is a summary for your records:</p>
        <table class="info-table">
          <tr><td>Project</td><td>${escapeHtml(projectName)}</td></tr>
          <tr><td>Contract Value</td><td>${formatCurrency(contractAmount, currency)}</td></tr>
          <tr><td>Start Date</td><td>${formatDate(startDate)}</td></tr>
          <tr><td>End Date</td><td>${formatDate(endDate)}</td></tr>
          <tr><td>Accepted At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>

        ${buildMilestoneTable(milestones, currency, 0, accessToken)}

        <p><strong>Next step:</strong> Please complete payment for Milestone 1 to activate the project.</p>
        <div class="note">
          You will receive a payment link shortly, or you can pay directly from the contract page. Questions? Reach us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

const buildContractRejectedEmail = ({ clientName, projectName, rejectionReason }) => {
    const subject = `Contract Declined — ${projectName} | DeveloperTag`;

    const html = emailShell(
        "#a33",
        "Contract Declined",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${escapeHtml(clientName)}</strong>,</p>
        <p>We've noted that you declined the contract for <strong>${escapeHtml(projectName)}</strong>.</p>
        ${rejectionReason ? `<div class="note">Reason provided: ${escapeHtml(rejectionReason)}</div>` : ""}
        <p>If this was a mistake or you'd like to discuss revised terms, just reply to this address: <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.</p>`
    );

    return { subject, html };
};

const buildAdminResponseNotificationEmail = ({
    clientName,
    clientEmail,
    projectName,
    status,
    rejectionReason,
}) => {
    const isAccepted = status === "accepted";
    const subject = `Contract ${isAccepted ? "Accepted" : "Rejected"} — ${projectName} (${clientName})`;

    const html = emailShell(
        isAccepted ? "#13a87c" : "#a33",
        `Client ${isAccepted ? "Accepted" : "Rejected"} the Contract`,
        projectName,
        `
        <table class="info-table">
          <tr><td>Client</td><td>${escapeHtml(clientName)}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
          <tr><td>Project</td><td>${escapeHtml(projectName)}</td></tr>
          <tr><td>Status</td><td>${status}</td></tr>
          ${rejectionReason ? `<tr><td>Reason</td><td>${escapeHtml(rejectionReason)}</td></tr>` : ""}
          <tr><td>Responded At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>`
    );

    return { subject, html };
};

const buildMilestonePaymentConfirmationEmail = ({
    clientName,
    projectName,
    milestone,
    currency,
    isFinalMilestone,
}) => {
    const subject = `Payment Received — ${milestone.title} (${projectName}) | DeveloperTag`;

    const html = emailShell(
        "#13a87c",
        "Milestone Payment Received",
        `Project: ${projectName}`,
        `
        <p>Hi <strong>${escapeHtml(clientName)}</strong>,</p>
        <p>We've received your payment for the following milestone:</p>
        <table class="info-table">
          <tr><td>Milestone</td><td>${escapeHtml(milestone.title)}</td></tr>
          <tr><td>Amount Paid</td><td>${formatCurrency(milestone.amount, currency)}</td></tr>
          <tr><td>Paid At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <p>${
            isFinalMilestone
                ? "That was the final milestone — the contract is now fully paid. Thank you!"
                : "We'll be in touch with a payment link for the next milestone once this stage of work is ready."
        }</p>
        <div class="note">
          Keep this email as your payment confirmation. Queries? <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
        </div>`
    );

    return { subject, html };
};

const buildAdminMilestonePaidEmail = ({
    clientName,
    clientEmail,
    projectName,
    milestone,
    currency,
    isFinalMilestone,
}) => {
    const subject = `Milestone Paid — ${milestone.title} (${projectName})`;

    const html = emailShell(
        "#2b6cb0",
        "Milestone Payment Received",
        projectName,
        `
        <table class="info-table">
          <tr><td>Client</td><td>${escapeHtml(clientName)}</td></tr>
          <tr><td>Email</td><td><a href="mailto:${clientEmail}">${clientEmail}</a></td></tr>
          <tr><td>Milestone</td><td>${escapeHtml(milestone.title)}</td></tr>
          <tr><td>Amount</td><td>${formatCurrency(milestone.amount, currency)}</td></tr>
          <tr><td>Status</td><td>${isFinalMilestone ? "Final milestone — contract fully paid" : "More milestones remain"}</td></tr>
          <tr><td>Paid At</td><td>${new Date().toLocaleString()}</td></tr>
        </table>`
    );

    return { subject, html };
};

// ─── EXPORTED SEND FUNCTIONS ───────────────────────────────────────────────────

export const sendContractEmail = async (data) => {
    const { subject, html } = buildContractEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-sharing");

    const { subject: aSubject, html: aHtml } = buildAdminNotificationEmail(data);
    sendEmail(ADMIN_EMAIL, aSubject, aHtml, "admin-contract-notification").catch(
        (err) => console.error("[ContractEmail] Admin notification failed:", err.message)
    );
};

export const sendContractAcceptedEmail = async (data) => {
    const { subject, html } = buildContractAcceptedEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-accepted");

    const { subject: aSubject, html: aHtml } = buildAdminResponseNotificationEmail({ ...data, status: "accepted" });
    sendEmail(ADMIN_EMAIL, aSubject, aHtml, "admin-accept-notification").catch(
        (err) => console.error("[ContractEmail] Admin accept notification failed:", err.message)
    );
};

export const sendContractRejectedEmail = async (data) => {
    const { subject, html } = buildContractRejectedEmail(data);
    await sendEmail(data.clientEmail, subject, html, "contract-rejected");

    const { subject: aSubject, html: aHtml } = buildAdminResponseNotificationEmail({ ...data, status: "rejected" });
    sendEmail(ADMIN_EMAIL, aSubject, aHtml, "admin-reject-notification").catch(
        (err) => console.error("[ContractEmail] Admin reject notification failed:", err.message)
    );
};

export const sendMilestonePaymentConfirmationEmail = async (data) => {
    const { subject, html } = buildMilestonePaymentConfirmationEmail(data);
    await sendEmail(data.clientEmail, subject, html, "milestone-payment-confirmation");

    const { subject: aSubject, html: aHtml } = buildAdminMilestonePaidEmail(data);
    sendEmail(ADMIN_EMAIL, aSubject, aHtml, "admin-milestone-paid-notification").catch(
        (err) => console.error("[ContractEmail] Admin milestone-paid notification failed:", err.message)
    );
};
