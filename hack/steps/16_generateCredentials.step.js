import { Resend } from 'resend';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

export const config = {
    name: 'GenerateWorkCredentials',
    type: 'event',
    subscribes: ['kit.received'],
    flows: ['EmployeeFlow'],
    emits: ['credentials.generated'],
    description: 'Generates work email and password for the employee and sends them via email.'
};




export const handler = async (event, { logger, emit }) => {
    const { token, email: personalEmail, fullName } = event.data || event;

    if (logger) logger.info(`🔐 Generating Work Credentials for ${fullName}`);

    await connectToDatabase();
    const employee = await Employee.findOne({ token });
    if (!employee) {
        if (logger) logger.error('❌ Employee not found');
        return;
    }

    if (employee.workCredentials && employee.workCredentials.workEmail) {
        if (logger) logger.info(`⚠️ Credentials already generated for ${token}. Skipping duplicate.`);
        return;
    }

    const names = fullName.trim().split(' ');
    const firstName = names[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastName = names.length > 1 ? names[names.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') : 'emp';

    const workEmail = `${firstName}.${lastName}@unity.com`;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (logger) logger.info(`📧 Generated: ${workEmail} / ***`);

    try {
        employee.workCredentials = {
            workEmail,
            initialPassword: password,
            generatedAt: new Date()
        };
        await employee.save();
        if (logger) logger.info('💾 Saved credentials to MongoDB');
    } catch (err) {
        if (logger) logger.error('❌ Error saving credentials to DB', err);
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await resend.emails.send({
            from: 'IT Support <onboarding@resend.dev>',
            to: personalEmail,
            subject: '🔐 Your Work Account Credentials',
            headers: {
                'X-Entity-Ref-ID': token,
            },
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Work Credentials</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #1e3a8a, #4f46e5);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #e0e7ff; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">🔑</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Your Work Account</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Access details for Company Systems</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>${fullName}</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Your official work account has been provisioned. Please use the credentials below to log in to your workstation and company portal on your first day.
                                            </p>

                                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
                                                <div style="margin-bottom: 20px;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Work Email</p>
                                                    <p style="margin: 0; font-size: 18px; color: #1e293b; font-family: monospace; font-weight: 600;">${workEmail}</p>
                                                </div>
                                                <div style="margin-bottom: 0;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Temporary Password</p>
                                                    <div style="background-color: #ffffff; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 6px; display: inline-block;">
                                                        <p style="margin: 0; font-size: 20px; color: #0f172a; font-family: monospace; letter-spacing: 2px;">${password}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <p style="margin: 32px 0 0; color: #ef4444; font-size: 14px; text-align: center; background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca;">
                                                ⚠️ Please change your password immediately after your first login.
                                            </p>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                Contact IT Support if you have trouble logging in.
                                            </p>
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
        if (logger) logger.info('✅ Credentials email sent.');

        if (emit) {
            await emit({
                topic: 'credentials.generated',
                data: {
                    token,
                    workEmail
                }
            });
        }

    } catch (err) {
        if (logger) logger.error('❌ Error sending credentials email', err);
    }
};
