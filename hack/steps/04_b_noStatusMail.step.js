import { Resend } from 'resend';

export const config = {
    name: 'SendNoStatusMail',
    type: 'event',
    subscribes: ['offer.response.received'],
    flows: ['EmployeeFlow'],
    emits: [],
    description: 'Notifies HR that the candidate has declined the job offer.'
};


export const handler = async (event, { logger }) => {
    const { status, email, name } = event.data || event;

    if (status !== 'REJECTED') {
        return;
    }

    if (logger) {
        logger.info(`Processing REJECTED status for ${email}`);
    }

    if (!email) {
        if (logger) logger.error('❌ Missing email in event payload');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        if (logger) logger.info(`🚫 Sending DECLINE confirmation email to ${email}`);

        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Thank you for your response',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Response Received</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                    
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px; text-align: center;">
                                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">Thank You</h1>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 40px 40px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                                                Dear <strong>${name}</strong>,
                                            </p>
                                            
                                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb; text-align: center;">
                                                <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                                    We have received your response declining the offer. We respect your decision and appreciate the time you took to consider us.
                                                </p>
                                            </div>

                                            <p style="margin: 30px 0 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                                                We wish you all the very best in your future endeavors.
                                            </p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
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
        if (logger) logger.info('✅ Decline confirmation email sent successfully');

        await resend.emails.send({
            from: 'System Notification <onboarding@resend.dev>',
            to: 'adityamaurya5091@gmail.com',
            subject: '⚠️ Candidate Rejected Offer',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Candidate Rejection</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', user-select, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                                    
                                    <tr>
                                        <td style="height: 6px; background: linear-gradient(to right, #ef4444, #b91c1c);"></td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 40px 40px 10px 40px; text-align: center;">
                                            <div style="display: inline-block; padding: 12px; background-color: #fef2f2; border-radius: 50%; margin-bottom: 20px;">
                                                <div style="font-size: 32px;">🛑</div>
                                            </div>
                                            <h1 style="margin: 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Offer Rejected</h1>
                                            <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Candidate declined the position</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 50px 40px;">
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                Hello <strong>HR Team</strong>,
                                            </p>
                                            <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 1.7;">
                                                The following candidate has officially <strong>REJECTED</strong> the job offer via the onboarding portal.
                                            </p>

                                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                                                <div style="margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">
                                                    <span style="font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Candidate Details</span>
                                                </div>
                                                <ul style="margin: 0; padding: 0; list-style: none;">
                                                    <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                                                        <span style="color: #6b7280; font-size: 15px;">Name</span>
                                                        <span style="color: #111827; font-weight: 600; font-size: 15px;">${name}</span>
                                                    </li>
                                                    <li style="margin-bottom: 0; display: flex; justify-content: space-between;">
                                                        <span style="color: #6b7280; font-size: 15px;">Email</span>
                                                        <span style="color: #111827; font-weight: 600; font-size: 15px;">${email}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <p style="margin: 32px 0 0; color: #dc2626; font-size: 14px; text-align: center; background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; font-weight: 500;">
                                                Action Required: Close file & update ATS.
                                            </p>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                System Notification
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
        if (logger) logger.info('✅ HR notification sent for rejection');

    } catch (err) {
        if (logger) logger.error('❌ Error sending decline email', { error: err.message });
    }
};
