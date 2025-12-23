import { Resend } from 'resend';

export const config = {
    name: 'SendKitDispatchedMail',
    type: 'event',
    subscribes: ['kit.ordered'],
    flows: ['EmployeeFlow'],
    emits: ['kit.dispatched.mail.sent'],
    description: 'Sends an email to the employee with the Welcome Kit tracking number and shipping label.'
};



export const handler = async (event, { logger }) => {
    const { token, email, fullName, trackingNumber, labelUrl } = event.data || event;

    if (!email) {
        if (logger) logger.error('❌ Missing email for kit dispatched mail');
        return;
    }

    if (logger) logger.info(`📧 Sending Kit Dispatched Email to ${email}`);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const trackingLink = `https://www.ups.com/track?tracknum=${trackingNumber}`;
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

    try {
        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: '📦 Your Welcome Kit is on the way!',
            headers: {
                'X-Entity-Ref-ID': token,
            },
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Welcome Kit Shipped</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #f59e0b, #d97706);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #fffbeb; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">🚚</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome Kit Shipped!</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Get ready for your swag</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hi <strong>${fullName},</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Exciting news! Your official employee welcome kit has been dispatched. It includes your company laptop and some cool t-shirts to get you started in style.
                                            </p>

                                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                                                <div style="margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                                                    <span style="font-size: 14px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</span>
                                                    <span style="font-size: 12px; color: #10b981; font-weight: 600; background-color: #ecfdf5; padding: 4px 10px; border-radius: 20px;">In Transit</span>
                                                </div>
                                                <ul style="margin: 0; padding: 0; list-style: none;">
                                                    <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                                                        <span style="color: #6b7280; font-size: 15px;">Carrier: </span>
                                                        <span style="color: #111827; font-weight: 600; font-size: 15px;">UPS</span>
                                                    </li>
                                                    <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                                                        <span style="color: #6b7280; font-size: 15px;">Tracking Number: </span>
                                                        <span style="color: #111827; font-weight: 600; font-size: 15px;">${trackingNumber}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div style="text-align: center; margin-top: 32px;">
                                                <a href="${trackingLink}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.4); transition: background-color 0.2s;">
                                                    Track Your Package
                                                </a>
                                            </div>

                                            <div style="text-align: center; margin-top: 16px;">
                                                <a href="${frontendUrl}/kit-confirmation?token=${token}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4); transition: background-color 0.2s;">
                                                    I have received the Kit
                                                </a>
                                            </div>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                                                Need help? Reply to this email.
                                            </p>

                                            <div style="margin-bottom: 5px;">Tracking Link: <div style="color: #6b7280; word-break: break-all;">${trackingLink}</div></div>
                                            <div style="margin-bottom: 5px;">Kit Confirmation Link: <div style="color: #6b7280; word-break: break-all;">${frontendUrl}/kit-confirmation?token=${token}</div></div>
                                            <div>Label Download: <div style="color: #6b7280; word-break: break-all;">Download Label PDF</div></div>
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
        if (logger) logger.info('✅ Kit Dispatched email sent.');

        if (emit) {
            // using a clean payload to avoid circular references from the raw event object
            await emit({
                topic: 'kit.dispatched.mail.sent',
                data: { token, email, fullName, trackingNumber, labelUrl }
            });
        }
    } catch (err) {
        if (logger) logger.error('❌ Error in SendKitDispatchedMail step', err);
    }
};
