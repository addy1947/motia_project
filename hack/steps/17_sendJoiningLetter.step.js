
import { Resend } from 'resend';
import { updateJoiningLetterStatusByToken, updateJoiningDateByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'SendJoiningLetter',
    type: 'event',
    subscribes: ['credentials.generated'],
    flows: ['EmployeeFlow'],
    emits: ['joining.letter.sent'],
    description: 'Sends the formal joining letter with date calculated 3 days from kit receipt.'
};

export const handler = async (event, { logger, emit }) => {
    const { token, email: personalEmail, fullName, workEmail } = event.data || event;

    if (logger) logger.info(`📜 Preparing Joining Letter for ${fullName}`);

    // Calculate Joining Date: Today + 3 Days
    const today = new Date();
    const joiningDate = new Date(today);
    joiningDate.setDate(today.getDate() + 3);
    const dateString = joiningDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await updateJoiningLetterStatusByToken(token, 'SENT');
        await updateJoiningDateByToken(token, dateString);

        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: personalEmail,
            subject: '📜 Your Official Joining Letter',
            headers: { 'X-Entity-Ref-ID': token },
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Joining Letter</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Georgia', serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #d1d5db; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="padding: 60px;">
                                            <div style="text-align: right; font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #6b7280; margin-bottom: 40px;">
                                                Date: ${new Date().toLocaleDateString()}
                                            </div>

                                            <div style="text-align: center; margin-bottom: 40px;">
                                                <h1 style="font-size: 24px; color: #111827; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 10px;">Joining Letter</h1>
                                            </div>

                                            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                                                Dear <strong>${fullName}</strong>,
                                            </p>

                                            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                                                We are pleased to confirm your appointment. As discussed, your official joining date will be:
                                            </p>

                                            <div style="background-color: #f9fafb; border-left: 4px solid #000; padding: 20px; margin-bottom: 30px;">
                                                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">
                                                    📅 ${dateString}
                                                </p>
                                                <p style="margin: 10px 0 0; font-size: 15px; color: #4b5563;">
                                                    Reporting Time: 10:00 AM
                                                </p>
                                            </div>

                                            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                                                Please carry your original documents for verification on your first day. You have already received your work credentials (${workEmail}) to access our systems.
                                            </p>

                                            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 40px;">
                                                We look forward to a long and successful journey together!
                                            </p>

                                            <div style="margin-top: 60px;">
                                                <p style="font-size: 16px; font-weight: bold; margin: 0; color: #111827;">HR Department</p>
                                                <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Unity Inc.</p>
                                            </div>
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


        if (logger) logger.info(`✅ Joining Letter sent to ${fullName}`);

        // Send Onboarding Confirmation to HR
        await resend.emails.send({
            from: 'System Notification <onboarding@resend.dev>',
            to: 'adityamaurya5091@gmail.com',
            subject: '✅ Onboarding Complete',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Onboarding Complete</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                    <tr>
                                        <td style="background-color: #10b981; padding: 20px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Onboarding Complete</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px;">
                                            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                                                Hello HR Team,
                                            </p>
                                            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                                                The following employee has successfully completed the onboarding process.
                                            </p>
                                            
                                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding-bottom: 10px; color: #6b7280; font-size: 14px;">Name</td>
                                                        <td style="padding-bottom: 10px; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${fullName}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding-bottom: 10px; color: #6b7280; font-size: 14px;">Personal Email</td>
                                                        <td style="padding-bottom: 10px; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${personalEmail}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding-bottom: 10px; color: #6b7280; font-size: 14px;">Work Email</td>
                                                        <td style="padding-bottom: 10px; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${workEmail}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #6b7280; font-size: 14px;">Joining Date</td>
                                                        <td style="color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${dateString}</td>
                                                    </tr>
                                                </table>
                                            </div>

                                            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                                                System generated notification.
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

        if (logger) logger.info(`✅ HR Notification sent for ${fullName}`);
    } catch (err) {
        if (logger) logger.error('❌ Error sending joining letter', err);
    }
};
