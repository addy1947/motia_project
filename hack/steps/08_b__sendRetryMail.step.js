import { Resend } from 'resend';

export const config = {
    name: 'SendDocumentRetry',
    type: 'event',
    subscribes: ['documents.retry'],
    flows: ['EmployeeFlow'],
    emits: ['document.retry.sent'],
    description: 'Sends an email to the candidate listing missing files and requesting re-upload.'
};


export const handler = async (event, { logger }) => {
    const { token, email, name, missingFiles } = event.data || event;

    if (logger) logger.info(`📧 Sending Retry Email to ${email}`, { missingFiles });

    if (!email) {
        if (logger) logger.error('❌ Missing email in event payload');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const uploadLink = `http://localhost:5173/submitform/document?token=${token}`;

    try {
        const response = await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Action Required: Verification Failed',
            headers: {
                'X-Entity-Ref-ID': token,
            },
            clicks: false,
            opens: false,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Verification Failed</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #dc2626, #b91c1c);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #fef2f2; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">⚠️</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Verification Failed</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Action Required</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>${name || 'Candidate'}</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Unfortunately, we could not verify your documents. Some files in your folder are either missing or named incorrectly.
                                            </p>

                                            <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 24px;">
                                                <div style="margin-bottom: 16px; border-bottom: 1px solid #feb2b2; padding-bottom: 12px;">
                                                    <span style="font-size: 14px; font-weight: 700; color: #c53030; text-transform: uppercase; letter-spacing: 0.5px;">Missing / Incorrect Files</span>
                                                </div>
                                                
                                                <ul style="margin: 0; padding-left: 20px; color: #9b2c2c; font-size: 15px; line-height: 1.8;">
                                                    ${(missingFiles || []).map(f => `<li><strong>${f}</strong></li>`).join('')}
                                                </ul>
                                            </div>

                                            <p style="margin: 32px 0 16px; font-weight: 700; color: #111827; font-size: 16px;">How to Fix This:</p>
                                            <div style="margin-bottom: 40px; padding-left: 10px;">
                                                <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                                                    <li style="margin-bottom: 8px;">Go to your Google Drive folder.</li>
                                                    <li style="margin-bottom: 8px;">Upload or rename files to match the list above exactly.</li>
                                                    <li style="margin-bottom: 8px;">Ensure access is set to <strong>"Anyone with the link"</strong>.</li>
                                                    <li>Click the button below to retry.</li>
                                                </ol>
                                            </div>

                                            <div style="text-align: center;">
                                                <a href="${uploadLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.4); transition: background-color 0.2s;">
                                                    Re-Submit Documents
                                                </a>
                                            </div>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                                                Use this link if the button doesn't work:
                                            </p>
                                            <div style="color: #6b7280; font-size: 12px; text-decoration: underline; word-break: break-all;">
                                                ${uploadLink}
                                            </div>
                                            <p style="margin: 24px 0 0; color: #d1d5db; font-size: 12px;">
                                                &copy; ${new Date().getFullYear()} Our Company. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (logger) logger.info('✅ Retry email sent successfully', { response });

    } catch (err) {
        if (logger) logger.error('❌ Error sending retry email', { error: err.message });
    }
};
