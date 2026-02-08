import { Resend } from 'resend';

export const config = {
    name: 'SendJoiningMail',
    type: 'event',
    subscribes: ['employee.data.received'],
    flows: ['EmployeeFlow'],
    emits: ['email.sent.with.token'],
    description: 'Sends the formal job offer email to the candidate with Accept/Decline links.'
};


export const handler = async (event, { logger, emit, state }) => {
    const payload = event.data || event;
    const { name, email, role, package: pkg, token } = payload;

    if (!email) {
        if (logger) {
            logger.error('❌ Missing email in event payload', { payload });
        }
        return;
    }

    if (logger) {
        logger.info(`📧 Sending joining email to ${email}...`);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

    try {
        const response = await resend.emails.send({
            from: 'HR Team <onboarding@resend.dev>',
            to: email,
            subject: 'Welcome to the Team!',
            headers: {
                'X-Entity-Ref-ID': token,
            },
            tags: [
                { name: 'category', value: 'onboarding' }
            ],
            clicks: false,
            opens: false,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Job Offer</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                            <td align="center" style="padding: 40px 0;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                    
                                    <tr>
                                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">Job Offer</h1>
                                            <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">Welcome to the Team</p>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 0 40px 30px 40px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                                                Hello <strong>${name}</strong>,
                                            </p>
                                            <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
                                                We are thrilled to formally offer you the position of <strong>${role}</strong>. We believe your skills and experience will be an excellent match for our company.
                                            </p>

                                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding-bottom: 8px; color: #6b7280; font-size: 14px;">Role</td>
                                                        <td style="padding-bottom: 8px; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${role}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="color: #6b7280; font-size: 14px;">Annual Package</td>
                                                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${pkg}</td>
                                                    </tr>
                                                </table>
                                            </div>

                                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; text-align: center;">
                                                Please review the details and let us know your decision below.
                                            </p>

                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${frontendUrl}/respond?token=${token}&action=yes" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 10px;">
                                                            Accept Offer
                                                        </a>
                                                        
                                                        <a href="${frontendUrl}/respond?token=${token}&action=no" style="display: inline-block; background-color: #ffffff; color: #dc2626; text-decoration: none; padding: 13px 31px; border-radius: 9999px; font-weight: 600; font-size: 16px; border: 1px solid #e5e7eb; margin: 0 10px 10px 10px;">
                                                            Decline
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                If you created this request by mistake, you can ignore this email.
                                            </p>
                                            <div style="margin-top: 12px; font-size: 10px; color: #d1d5db; word-break: break-all; line-height: 1.4;">
                                                 Direct Links:<br>
                                                 Accept: ${frontendUrl}/respond?token=${token}&action=yes<br>
                                                 Decline: ${frontendUrl}/respond?token=${token}&action=no
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">
                                    &copy; ${new Date().getFullYear()} Our Company. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (logger) {
            logger.info('✅ Email sent successfully', { response });
        }

        if (emit) {
            await emit({
                topic: 'email.sent.with.token',
                data: {
                    token,
                    email,
                    name,
                    role,
                    package: pkg
                }
            });
        }

    } catch (err) {
        if (logger) {
            logger.error('❌ Error in SendJoiningMail', { error: err.message });
        }
    }
}
