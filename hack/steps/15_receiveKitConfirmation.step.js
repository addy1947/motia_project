
import { updateKitReceivedByToken } from '../lib/googleSheets.js';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

export const config = {
    name: 'ReceiveKitConfirmation',
    type: 'api',
    method: 'GET',
    path: '/onboarding/kit-received',
    flows: ['EmployeeFlow'],
    emits: ['kit.received'],
    virtualSubscribes: ['kit.dispatched.mail.sent'],
    description: 'Handles the confirmation from the employee that they have received the Welcome Kit.'
};

export const handler = async (req, { logger, emit }) => {
    const { token } = req.query;

    if (logger) logger.info(`📦 Kit receipt confirmed for token: ${token}`);

    if (!token) {
        return {
            status: 400,
            body: 'Missing token'
        };
    }

    await connectToDatabase();
    let email = '', fullName = '';

    try {
        const employee = await Employee.findOne({ token });
        if (employee) {
            employee.welcomeKit.status = 'RECEIVED';
            employee.welcomeKit.receivedAt = new Date();
            await employee.save();
            email = employee.email;
            fullName = employee.name;
        }

        await updateKitReceivedByToken(token, 'RECEIVED');
        if (logger) logger.info(`✅ Updated Sheet for Kit Received: ${token}`);

        if (emit) {
            await emit({
                topic: 'kit.received',
                data: { token, email, fullName }
            });
        }

    } catch (err) {
        if (logger) logger.error('❌ Error handling kit confirmation', err);
        return {
            status: 500,
            body: 'Internal Server Error'
        };
    }

    return {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: {
            message: 'Kit confirmation received',
            token: token
        }
    };
};
