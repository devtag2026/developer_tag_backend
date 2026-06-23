import nodemailer from 'nodemailer';

// Lazy initialization of Nodemailer transporter
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('SMTP environment variables are not set (SMTP_HOST, SMTP_USER, SMTP_PASS)');
        }

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
};

// Brand color
const BRAND_COLOR = 'rgb(19, 168, 124)';
const BRAND_COLOR_DARK = 'rgb(14, 130, 96)';
const BRAND_COLOR_LIGHT = 'rgb(234, 250, 244)';

// Shared row helper - keeps table markup consistent and skips empty values
const row = (label, value, options = {}) => {
    if (value === undefined || value === null || value === '') return '';
    const { isLink = false, isLast = false } = options;
    const content = isLink ? `<a href="mailto:${value}" style="color: ${BRAND_COLOR_DARK}; text-decoration: none;">${value}</a>` : value;

    return `
        <tr>
            <td style="padding: 14px 16px; ${isLast ? '' : 'border-bottom: 1px solid #eef2f1;'} font-size: 13px; font-weight: 600; color: #6b7280; width: 36%; vertical-align: top;">${label}</td>
            <td style="padding: 14px 16px; ${isLast ? '' : 'border-bottom: 1px solid #eef2f1;'} font-size: 14px; color: #1f2937; vertical-align: top;">${content}</td>
        </tr>
    `;
};

// Shared email shell so every email looks consistent
const emailShell = ({ headerTitle, headerSubtitle, bodyHtml, footerText }) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f5; padding: 32px 16px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">

                        <!-- Header -->
                        <tr>
                            <td style="background-color: ${BRAND_COLOR}; padding: 32px 32px 28px 32px;">
                                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.8);">DeveloperTag</p>
                                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">${headerTitle}</h1>
                                ${headerSubtitle ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${headerSubtitle}</p>` : ''}
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 32px;">
                                ${bodyHtml}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 32px; background-color: ${BRAND_COLOR_LIGHT}; border-top: 1px solid #e1f3ec;">
                                <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5;">${footerText}</p>
                            </td>
                        </tr>
                    </table>

                    <p style="margin: 20px 0 0 0; font-size: 11px; color: #9ca3af;">&copy; ${new Date().getFullYear()} DeveloperTag. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
`;

// Email templates
const createFormSubmissionEmail = (formData) => {
    const {
        name,
        email,
        formType,
        serviceType,
        description,
        phoneNumber,
        projectGoal,
        expertiseNeeded,
        budget
    } = formData;

    let subject = '';

    switch (formType) {
        case 'Request a Service':
            subject = `New Service Request from ${name}`;
            break;
        case 'Ask a Question':
            subject = `New Question from ${name}`;
            break;
        case 'Contact Us':
            subject = `New Contact Form Submission from ${name}`;
            break;
        default:
            subject = `New Form Submission from ${name}`;
    }

    const tableRows = [
        row('Name', name),
        row('Email', email, { isLink: true }),
        row('Form Type', formType),
        row('Phone Number', phoneNumber),
        row('Service Type', serviceType),
        row('Looking To', projectGoal),
        row('Expertise Needed', expertiseNeeded),
        row('Budget', budget),
        row(formType === 'Contact Us' ? 'Message' : 'Description', description),
        row('Submitted At', new Date().toLocaleString(), { isLast: true }),
    ].filter(Boolean).join('');

    const bodyHtml = `
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563;">
            You've received a new ${formType ? String(formType).toLowerCase() : 'form submission'} through your website. Details are below.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eef2f1; border-radius: 8px; overflow: hidden;">
            ${tableRows}
        </table>
    `;

    return {
        subject,
        html: emailShell({
            headerTitle: 'New Form Submission',
            headerSubtitle: `via ${formType || 'website'} form`,
            bodyHtml,
            footerText: 'This email was sent from your DeveloperTag website contact form.'
        })
    };
};

const createNewsletterSubscriptionEmail = (email) => {
    const tableRows = [
        row('Email', email, { isLink: true }),
        row('Subscribed At', new Date().toLocaleString(), { isLast: true }),
    ].join('');

    const bodyHtml = `
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563;">
            Someone has subscribed to your newsletter. Details are below.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eef2f1; border-radius: 8px; overflow: hidden;">
            ${tableRows}
        </table>
    `;

    return {
        subject: 'New Newsletter Subscription',
        html: emailShell({
            headerTitle: 'New Newsletter Subscription',
            headerSubtitle: null,
            bodyHtml,
            footerText: 'This email was sent from your DeveloperTag website newsletter subscription.'
        })
    };
};

// Send form submission notification
export const sendFormSubmissionEmail = async (formData) => {
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP environment variables not configured. Email notification skipped.');
            return;
        }

        if (!process.env.ADMIN_EMAIL) {
            console.warn('ADMIN_EMAIL not configured. Email notification skipped.');
            return;
        }

        const { subject, html } = createFormSubmissionEmail(formData);

        const info = await getTransporter().sendMail({
            from: process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL,
            subject,
            html
        });

        console.log('Form submission email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending form submission email:', error);
    }
};

// Send newsletter subscription notification
export const sendNewsletterSubscriptionEmail = async (email) => {
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP environment variables not configured. Email notification skipped.');
            return;
        }

        if (!process.env.ADMIN_EMAIL) {
            console.warn('ADMIN_EMAIL not configured. Email notification skipped.');
            return;
        }

        const { subject, html } = createNewsletterSubscriptionEmail(email);

        const info = await getTransporter().sendMail({
            from: process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL,
            subject,
            html
        });

        console.log('Newsletter subscription email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending newsletter subscription email:', error);
    }
};

// Send confirmation email to user
export const sendUserConfirmationEmail = async (userEmail, formType, userName) => {
    try {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('SMTP environment variables not configured. User confirmation email skipped.');
            return;
        }

        const subject = `Thank you for your ${String(formType).toLowerCase()} - DeveloperTag`;

        const bodyHtml = `
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #1f2937;">Dear ${userName},</p>
            <p style="margin: 0 0 16px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Thank you for your ${String(formType).toLowerCase()}. We've received your message and one of our team members will get back to you shortly.
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                We typically respond within <strong style="color: #1f2937;">24&ndash;48 hours</strong> during business days.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="background-color: ${BRAND_COLOR}; border-radius: 6px;">
                        <p style="margin: 0; padding: 12px 22px; font-size: 14px; font-weight: 600; color: #ffffff;">We'll be in touch soon</p>
                    </td>
                </tr>
            </table>
            <p style="margin: 28px 0 0 0; font-size: 14px; color: #4b5563;">
                Best regards,<br>
                <strong style="color: #1f2937;">The DeveloperTag Team</strong>
            </p>
        `;

        const html = emailShell({
            headerTitle: 'Thank You for Reaching Out!',
            headerSubtitle: 'We\'ve received your message',
            bodyHtml,
            footerText: 'This is an automated confirmation email. Please do not reply to this email.'
        });

        const info = await getTransporter().sendMail({
            from: process.env.SMTP_USER,
            to: userEmail,
            subject,
            html
        });

        console.log('User confirmation email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending user confirmation email:', error);
    }
};

export default {
    sendFormSubmissionEmail,
    sendNewsletterSubscriptionEmail,
    sendUserConfirmationEmail,
};