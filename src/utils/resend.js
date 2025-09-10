import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend = null;

const getResendClient = () => {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

// Email templates
const createFormSubmissionEmail = (formData) => {
    const { name, email, formType, serviceType, description } = formData;

    let subject = '';
    let serviceInfo = '';

    switch (formType) {
        case 'Request a Service':
            subject = `New Service Request from ${name}`;
            serviceInfo = `
                <tr>
                    <td><strong>Service Type:</strong></td>
                    <td>${serviceType ?? ''}</td>
                </tr>
            `;
            break;
        case 'Ask a Question':
            subject = `New Question from ${name}`;
            break;

        default:
            subject = `New Form Submission from ${name}`;
    }

    return {
        subject,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Form Submission</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8f9fa; }
                    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .info-table td:first-child { font-weight: bold; width: 30%; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Form Submission</h1>
                        <p>You have received a new ${formType ? String(formType).toLowerCase() : 'form submission'}</p>
                    </div>
                    <div class="content">
                        <table class="info-table">
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${name}</td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td><strong>Form Type:</strong></td>
                                <td>${formType}</td>
                            </tr>
                            ${serviceInfo}
                            <tr>
                                <td><strong>Description:</strong></td>
                                <td>${description}</td>
                            </tr>
                            <tr>
                                <td><strong>Submitted At:</strong></td>
                                <td>${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>This email was sent from your DevXcript website contact form.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

const createNewsletterSubscriptionEmail = (email) => {
    return {
        subject: 'New Newsletter Subscription',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Newsletter Subscription</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8f9fa; }
                    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .info-table td:first-child { font-weight: bold; width: 30%; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Newsletter Subscription</h1>
                        <p>Someone has subscribed to your newsletter</p>
                    </div>
                    <div class="content">
                        <table class="info-table">
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td><strong>Subscribed At:</strong></td>
                                <td>${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="footer">
                        <p>This email was sent from your DevXcript website newsletter subscription.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Send form submission notification
export const sendFormSubmissionEmail = async (formData) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured. Email notification skipped.');
            return;
        }

        if (!process.env.ADMIN_EMAIL) {
            console.warn('ADMIN_EMAIL not configured. Email notification skipped.');
            return;
        }

        const { subject, html } = createFormSubmissionEmail(formData);

        const { data, error } = await getResendClient().emails.send({
            from: process.env.FROM_EMAIL || 'noreply@devxcript.com',
            to: process.env.ADMIN_EMAIL,
            subject,
            html
        });

        if (error) {
            console.error('Error sending form submission email:', error);
            return;
        }

        console.log('Form submission email sent successfully:', data);
    } catch (error) {
        console.error('Error sending form submission email:', error);
    }
};

// Send newsletter subscription notification
export const sendNewsletterSubscriptionEmail = async (email) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured. Email notification skipped.');
            return;
        }

        if (!process.env.ADMIN_EMAIL) {
            console.warn('ADMIN_EMAIL not configured. Email notification skipped.');
            return;
        }

        const { subject, html } = createNewsletterSubscriptionEmail(email);

        const { data, error } = await getResendClient().emails.send({
            from: process.env.FROM_EMAIL || 'noreply@devxcript.com',
            to: process.env.ADMIN_EMAIL,
            subject,
            html
        });

        if (error) {
            console.error('Error sending newsletter subscription email:', error);
            return;
        }

        console.log('Newsletter subscription email sent successfully:', data);
    } catch (error) {
        console.error('Error sending newsletter subscription email:', error);
    }
};

// Send confirmation email to user
export const sendUserConfirmationEmail = async (userEmail, formType, userName) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured. User confirmation email skipped.');
            return;
        }

        const subject = `Thank you for your ${String(formType).toLowerCase()} - DevXcript`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Thank you for contacting us</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8f9fa; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank you for contacting us!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${userName},</p>
                        <p>Thank you for your ${String(formType).toLowerCase()}. We have received your message and will get back to you as soon as possible.</p>
                        <p>We typically respond within 24-48 hours during business days.</p>
                        <p>Best regards,<br>The DevXcript Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated confirmation email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const { data, error } = await getResendClient().emails.send({
            from: process.env.FROM_EMAIL || 'noreply@devxcript.com',
            to: userEmail,
            subject,
            html
        });

        if (error) {
            console.error('Error sending user confirmation email:', error);
            return;
        }

        console.log('User confirmation email sent successfully:', data);
    } catch (error) {
        console.error('Error sending user confirmation email:', error);
    }
};

export default {
    sendFormSubmissionEmail,
    sendNewsletterSubscriptionEmail,
    sendUserConfirmationEmail,
};