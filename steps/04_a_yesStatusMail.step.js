import { Resend } from 'resend';

export const config = {
    name: 'SendYesStatusMail',
    type: 'event',
    subscribes: ['offer.response.received'],
    flows: ['EmployeeFlow'],
    emits: ['offer.accepted'],
    description: 'Sends a welcome email with next steps if the candidate accepts the offer.'
};


export const handler = async (event, { logger, emit }) => {
    const { status, token, email, name, role, package: pkg } = event.data || event;

    if (status !== 'ACCEPTED') {
        return;
    }

    if (logger) {
        logger.info(`🎉 Processing ACCEPTED status for ${email}`);
    }

    if (!email) {
        if (logger) logger.error('❌ Missing email in event payload');
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        if (logger) logger.info(`📧 Sending WELCOME/NEXT STEPS email to ${email}`);

        await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Welcome Aboard! Next Steps',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Welcome Aboard</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                    
                                    <tr>
                                        <td style="padding: 40px 40px 0 40px; text-align: center;">
                                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">Welcome to the Team! 🎉</h1>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 30px 40px 40px 40px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Congratulations <strong>${name}</strong>! We are thrilled to confirm your acceptance of the <strong>${role}</strong> position. We can't wait to see what you'll achieve with us.
                                            </p>
                                            
                                            <h2 style="color: #111827; font-size: 18px; margin: 30px 0 15px 0;">Next Steps:</h2>
                                            
                                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; border: 1px solid #e5e7eb;">
                                                <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                                                    <li style="margin-bottom: 8px;">Complete your onboarding paperwork</li>
                                                    <li style="margin-bottom: 8px;">Set up your work equipment</li>
                                                    <li>Attend orientation on your start date</li>
                                                </ol>
                                            </div>

                                            <div style="margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                                                <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Your Role:</strong> ${role}</p>
                                                <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;"><strong>Package:</strong> ${pkg}</p>
                                            </div>

                                            <p style="margin: 30px 0 0; color: #374151; font-size: 16px; text-align: center;">
                                                We will be in touch shortly with more details throughout our onboarding process.
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

        if (logger) logger.info('✅ Welcome email sent successfully');

        if (emit) {
            await emit({
                topic: 'offer.accepted',
                data: {
                    token,
                    email,
                    name,
                    role
                }
            });
            if (logger) logger.info('📤 Emitted offer.accepted event');
        }

    } catch (err) {
        if (logger) logger.error('❌ Error sending welcome email', { error: err.message });
    }
};
