import { Resend } from 'resend';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

export const config = {
    name: 'VerificationFailed',
    type: 'event',
    subscribes: ['verification.failed'],
    flows: ['EmployeeFlow'],
    emits: ['verification.retry.sent'],
    description: 'Handles failed AI verification: Updates status to REJECTED/FAILED and sends detail failure email.'
};


export const handler = async (event, { logger, emit }) => {
    const { token, email, name, geminiResult } = event.data || event;

    if (logger) logger.info(`❌ Verification Failed for ${email}`);

    await connectToDatabase();

    try {
        const employee = await Employee.findOne({ token });
        if (employee) {
            employee.status = 'REJECTED';
            await employee.save();
        }
    } catch (err) { }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const uploadLink = `http://localhost:5173/submitform/document?token=${token}`;

    const issues = [];
    if (geminiResult.status === 'FAIL' || geminiResult.status === 'fail') {
        if (!geminiResult.isAadhaarPresent) issues.push("Aadhaar Card not detected.");
        if (!geminiResult.isPanPresent) issues.push("PAN Card not detected.");
        if (geminiResult.isNameConsistent === false) issues.push("Name mismatch across documents.");
        if (geminiResult.isDobConsistent === false) issues.push("Date of Birth mismatch.");
        if (geminiResult.consistencyNotes) issues.push(geminiResult.consistencyNotes);
    } else {
        issues.push("Automated verification could not confirm document validity.");
    }

    try {
        await resend.emails.send({
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
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Stage 2 Failed</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>${name}</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Unfortunately, our AI system failed to verify your documents based on the information provided.
                                            </p>

                                            <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 12px; padding: 24px;">
                                                <div style="margin-bottom: 16px; border-bottom: 1px solid #feb2b2; padding-bottom: 12px;">
                                                    <span style="font-size: 14px; font-weight: 700; color: #c53030; text-transform: uppercase; letter-spacing: 0.5px;">Issues Found</span>
                                                </div>
                                                <ul style="margin: 0; padding-left: 20px; color: #9b2c2c; font-size: 15px; line-height: 1.8;">
                                                    ${issues.map(i => `<li>${i}</li>`).join('')}
                                                </ul>
                                            </div>

                                            <p style="margin: 32px 0 16px; font-weight: 700; color: #111827; font-size: 16px;">Recommended Action:</p>
                                            <div style="margin-bottom: 40px; padding-left: 10px;">
                                                <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                                                    <li style="margin-bottom: 8px;">Ensure you have uploaded high-quality, clear images.</li>
                                                    <li style="margin-bottom: 8px;">Verify that your Name and DOB match across all IDs.</li>
                                                    <li>Click below to re-submit your documents.</li>
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
        if (logger) logger.info('✅ Failure email sent.');

        if (emit) {
            await emit({
                topic: 'verification.retry.sent',
                data: { token, email, name }
            });
        }
    } catch (err) {
        if (logger) logger.error('❌ Error sending failure email', err);
    }
};
