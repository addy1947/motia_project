import { Resend } from 'resend';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

export const config = {
    name: 'VerificationPassed',
    type: 'event',
    subscribes: ['verification.passed'],
    flows: ['EmployeeFlow'],
    emits: ['verification.passed.email.sent'],
    description: 'Handles successful AI verification: Updates status to ACCEPTED and sends success email.'
};


export const handler = async (event, { logger, emit }) => {
    const { token, email, name, geminiResult } = event.data || event;

    if (logger) logger.info(`🎉 Verification Passed for ${email}`);

    await connectToDatabase();

    try {
        const employee = await Employee.findOne({ token });
        if (employee) {
            employee.status = 'ACCEPTED';
            await employee.save();
        }
    } catch (err) {
        if (logger) logger.error('❌ Failed to update employee status', err);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Stage 2 Complete: Document Verification Successful',
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
                    <title>Verification Successful</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #10b981, #059669);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #ecfdf5; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">✅</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Verification Successful</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Stage 2 of 3 Complete</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>${name}</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                We are pleased to inform you that you have <strong>successfully passed the AI Document Verification</strong>. All your submitted documents matched our records.
                                            </p>

                                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">
                                                <div style="margin-bottom: 16px; border-bottom: 1px solid #dcfce7; padding-bottom: 12px;">
                                                    <span style="font-size: 14px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Verified Details</span>
                                                </div>
                                                <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 15px; line-height: 1.8;">
                                                    <li><strong>Name Verified:</strong> ${geminiResult.name}</li>
                                                    <li><strong>Aadhaar Detected:</strong> Yes</li>
                                                    <li><strong>PAN Detected:</strong> Yes</li>
                                                </ul>
                                            </div>

                                            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                                 <p style="margin: 0 0 12px; font-weight: 700; color: #111827; font-size: 16px;">Next Steps</p>
                                                 <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                                    We will contact you shortly regarding <strong>Stage 3</strong>. No further action is required from you at this moment.
                                                 </p>
                                            </div>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 13px;">
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
        if (logger) logger.info('✅ Success email sent.');

        if (emit) {
            await emit({
                topic: 'verification.passed.email.sent',
                data: { token, email, name }
            });
            if (logger) logger.info("📢 Emitted verification.passed.email.sent to trigger details form email.");
        }

    } catch (err) {
        if (logger) logger.error('❌ Error sending success email', err);
    }
};
