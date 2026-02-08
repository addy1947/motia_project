import { Resend } from 'resend';
import { updateDocumentLinkByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'SendDocumentRequest',
    type: 'event',
    subscribes: ['offer.accepted'],
    flows: ['EmployeeFlow'],
    emits: ['document.request.sent'],
    description: 'Sends an email requesting document uploads (Aadhaar, PAN, Marksheets) to the candidate.'
};


export const handler = async (event, { logger, emit }) => {
    const { token, email, name } = event.data || event;

    if (logger) logger.info(`📄 Preparing Document Request for ${email}`, { token });

    if (!email) {
        if (logger) logger.error('❌ Missing email in event payload');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    const uploadLink = `${frontendUrl}/submitform/document?token=${token}`;

    try {
        await updateDocumentLinkByToken(token, 'SENT');
        if (logger) logger.info(`📊 Updated Google Sheet with document link for ${email}`);

    } catch (dbErr) {
        if (logger) logger.error('⚠️ Failed to update DB/Sheet with doc link', dbErr);
    }

    try {
        const response = await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Action Required: Document Verification',
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
                    <title>Document Verification</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                    
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px; text-align: center;">
                                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">Document Verification</h1>
                                            <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">Step 2 of 3</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 40px 40px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Hello <strong>${name || 'Candidate'}</strong>,
                                            </p>
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Welcome to the team! To complete your onboarding, please provide the following documents.
                                            </p>

                                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
                                                <p style="margin: 0 0 15px; font-weight: 600; color: #111827; font-size: 15px;">Required Files & Naming Convention:</p>
                                                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                                                    <li style="margin-bottom: 5px;">
                                                        <strong style="color: #374151;">Aadhaar</strong> 
                                                        <span style="color: #9ca3af;"> — Save as: </span>
                                                        <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #ef4444; font-family: monospace;">aadhaar.pdf</code>
                                                    </li>
                                                    <li style="margin-bottom: 5px;">
                                                        <strong style="color: #374151;">PAN Card</strong> 
                                                        <span style="color: #9ca3af;"> — Save as: </span>
                                                        <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #ef4444; font-family: monospace;">pancard.pdf</code>
                                                    </li>
                                                    <li style="margin-bottom: 5px;">
                                                        <strong style="color: #374151;">10th Marksheet</strong> 
                                                        <span style="color: #9ca3af;"> — Save as: </span>
                                                        <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #ef4444; font-family: monospace;">10thmarksheet.pdf</code>
                                                    </li>
                                                    <li style="margin-bottom: 5px;">
                                                        <strong style="color: #374151;">12th Marksheet</strong> 
                                                        <span style="color: #9ca3af;"> — Save as: </span>
                                                        <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #ef4444; font-family: monospace;">12thmarksheet.pdf</code>
                                                    </li>
                                                    <li style="margin-bottom: 5px;">
                                                        <strong style="color: #374151;">Passport photo</strong> 
                                                        <span style="color: #9ca3af;"> — Save as: </span>
                                                        <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #ef4444; font-family: monospace;">photo.jpg</code>
                                                    </li>
                                                </ul>
                                            </div>

                                            <p style="margin: 0 0 15px; font-weight: 600; color: #111827; font-size: 16px;">Instructions:</p>
                                            <div style="margin-bottom: 30px;">
                                                 <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                                                    <li style="margin-bottom: 8px;">Create a folder on Google Drive.</li>
                                                    <li style="margin-bottom: 8px;">Upload all documents renamed exactly as shown above.</li>
                                                    <li style="margin-bottom: 8px;">Set folder access to <strong>"Anyone with the link"</strong>.</li>
                                                    <li>Click the button below to submit your folder link.</li>
                                                </ol>
                                            </div>

                                            <div style="text-align: center;">
                                                <a href="${uploadLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px;">
                                                    Submit Document Links
                                                </a>
                                            </div>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                If the button didn't work, copy this link:<br>
                                                Link: ${uploadLink}
                                            </p>
                                            <p style="margin-top: 20px; color: #d1d5db; font-size: 12px;">
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

        if (logger) logger.info('✅ Document request email sent', { response });

        if (emit) {
            await emit({
                topic: 'document.request.sent',
                data: { token, email }
            });
        }

    } catch (err) {
        if (logger) logger.error('❌ Error sending document request', { error: err.message });
    }
};
