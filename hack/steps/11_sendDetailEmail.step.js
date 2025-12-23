import { Resend } from 'resend';

export const config = {
    name: 'SendDetailFormEmail',
    type: 'event',
    subscribes: ['verification.passed.email.sent'],
    flows: ['EmployeeFlow'],
    emits: ['details.form.sent'],
    description: 'Sends the Employee Details Form (Bank, Address) email after successful document verification.'
};


export const handler = async (event, { logger, emit }) => {
    const { token, email, name } = event.data || event;

    if (logger) logger.info(`📧 Sending Details Form Email to ${email}`);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    const formLink = `${frontendUrl}/submitform/detail?token=${token}`;

    try {
        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Action Required: Complete Your Employee Profile',
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
                    <title>Complete Your Profile</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #3b82f6, #6366f1);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">📝</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Final Step: Profile Details</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Stage 3 of 3</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>${name}</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Great news! Your documents have been successfully verified. We are now ready to finalize your onboarding.
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Please click the button below to provide your personal and banking details securely.
                                            </p>

                                            <div style="text-align: center;">
                                                <a href="${formLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4); transition: background-color 0.2s;">
                                                    Fill Employee Details
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
                                                ${formLink}
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
        if (logger) logger.info('✅ Detail Request Email sent.');

        if (emit) {
            await emit({
                topic: 'details.form.sent',
                data: { token, email, name }
            });
            if (logger) logger.info('📤 Emitted details.form.sent event');
        }

    } catch (err) {
        if (logger) logger.error('❌ Error sending detail request email', err);
    }
};
