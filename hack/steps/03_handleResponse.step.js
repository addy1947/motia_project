import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';
import { updateRowStatusByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'HandleOfferResponse',
    type: 'api',
    path: '/onboarding/respond',
    method: 'POST',
    flows: ['EmployeeFlow'],
    emits: ['offer.response.received'],
    virtualSubscribes: ['email.sent.with.token'],
    queryParams: [
        { name: 'token', description: 'Employee token for verification' },
        { name: 'action', description: 'Response action: yes or no' }
    ],
    description: 'Handles the candidates response (Accept/Decline) to the job offer.'
};


export const handler = async (req, { logger, emit }) => {
    if (req.method === 'HEAD') {
        return { status: 200 };
    }

    if (logger) {
        logger.info('🔍 Debugging Request', {
            method: req.method,
            body: req.body,
            input: req.input,
            headers: req.headers
        });
    }

    const bodyArgs = req.body || req.input || {};
    const queryArgs = req.queryParams || {};

    const token = bodyArgs.token || queryArgs.token;
    const action = bodyArgs.action || queryArgs.action;

    if (logger) {
        logger.info('📬 HandleOfferResponse triggered', {
            method: req.method,
            token,
            action,
            source: bodyArgs.token ? 'body' : (queryArgs.token ? 'query' : 'none')
        });
    }

    if (!token || !action) {
        return {
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Missing token or action' }
        };
    }

    let storedData = null;
    try {
        await connectToDatabase();
        storedData = await Employee.findOne({ token: token });

        if (logger) {
            if (storedData) {
                logger.info(`✅ Token found in MongoDB`, { token, email: storedData.email });
            } else {
                logger.warn(`⚠️ Token not found in MongoDB`, { token });
            }
        }
    } catch (err) {
        if (logger) {
            logger.error(`❌ Database Error`, { error: err.message });
        }
        return {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Database error' }
        };
    }

    if (!storedData) {
        return {
            status: 403,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: { error: 'Invalid token or expired link' }
        };
    }

    if (storedData.status !== 'PENDING') {
        const alreadyAccepted = storedData.status === 'ACCEPTED';
        return {
            status: 409,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: {
                error: 'Link expired',
                message: `You have already ${alreadyAccepted ? 'ACCEPTED' : 'DECLINED'} this offer. You cannot change your response.`
            }
        };
    }

    const status = action === 'yes' ? 'ACCEPTED' : 'REJECTED';

    try {
        await Employee.updateOne(
            { token: token },
            {
                status: status,
                updatedAt: new Date()
            }
        );
        if (logger) logger.info('✅ Employee status updated in MongoDB');

        try {
            await updateRowStatusByToken(token, status);
            if (logger) logger.info('✅ Google Sheet row updated with new status');
        } catch (sheetErr) {
            if (logger) logger.warn('⚠️ Google Sheet Row Update Failed', { error: sheetErr.message });
        }

    } catch (e) {
        if (logger) logger.warn('⚠️ Failed to update status in DB', { error: e.message });
    }

    if (logger) {
        logger.info(`✅ Token verified successfully`, {
            token,
            email: storedData.email,
            action,
            status
        });
    }

    if (emit) {
        await emit({
            topic: 'offer.response.received',
            data: {
                token,
                action,
                status,
                email: storedData.email,
                name: storedData.name,
                role: storedData.role,
                package: storedData.package,
                timestamp: new Date().toISOString()
            }
        });
    }

    return {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: {
            message: action === 'yes' ? 'Offer accepted successfully! Welcome aboard.' : 'Offer declined. Thank you for your time.',
            status: status,
            email: storedData.email
        }
    };
}
