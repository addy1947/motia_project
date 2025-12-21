import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';
import { updateLevel3StatusByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'ReceiveDetails',
    type: 'api',
    path: '/onboarding/details',
    method: 'POST',
    flows: ['EmployeeFlow'],
    virtualSubscribes: ['details.form.sent'],
    emits: ['details.received'],
    description: 'Receives the submitted employee details (Personal, Bank, Address) and stores them.'
};


export const handler = async (req, { logger, emit }) => {
    try {
        await connectToDatabase();

        const body = req.body;
        if (!body || typeof body !== 'object') {
            return { status: 400, body: { error: 'Invalid JSON request body' } };
        }

        const { token, details } = body;

        if (!token) {
            return { status: 400, body: { error: 'Missing token' } };
        }
        if (!details || typeof details !== 'object') {
            return { status: 400, body: { error: 'Missing details payload' } };
        }

        if (logger) logger.info(`📝 Receiving details for token: ${token}`);

        const employee = await Employee.findOne({ token });
        if (!employee) {
            return { status: 404, body: { error: 'Employee not found' } };
        }

        if (!employee.details) employee.details = new Map();

        for (const [key, value] of Object.entries(details)) {
            employee.details.set(key, value);
        }

        await employee.save();

        if (logger) logger.info(`💾 Updated employee record with form details.`);

        await updateLevel3StatusByToken(token, 'RECEIVED');
        if (logger) logger.info(`📊 Updated Google Sheet Level 3 Status to RECEIVED for ${token}`);

        if (emit) {
            await emit({
                topic: 'details.received',
                data: { token, details }
            });
        }

        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                message: 'Details received and stored successfully'
            }
        };

    } catch (error) {
        if (logger) logger.error('❌ Error handling form details', error);
        return {
            status: 500,
            body: {
                error: error.message || 'Internal Server Error'
            }
        };
    }
};
