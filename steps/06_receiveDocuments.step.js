import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';
import { updateLinkReceivedByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'ReceiveDocuments',
    type: 'api',
    path: '/onboarding/documents',
    method: 'POST',
    flows: ['EmployeeFlow'],
    virtualSubscribes: ['document.request.sent', 'document.retry.sent', 'verification.retry.sent'],
    emits: ['documents.received'],
    description: 'Receives the Google Drive link containing uploaded documents from the candidate.'
};


export const handler = async (req, { logger, emit }) => {
    try {
        await connectToDatabase();
        if (logger) logger.info('✅ DB Connected');

        const body = req.body;

        if (!body || typeof body !== 'object') {
            return { status: 400, body: { error: 'Invalid JSON request body' } };
        }

        const { token, documents } = body;

        if (!token) {
            return { status: 400, body: { error: 'Missing token' } };
        }
        if (!documents || typeof documents !== 'object' || Object.keys(documents).length === 0) {
            return { status: 400, body: { error: 'No document links provided' } };
        }

        if (logger) logger.info(`📂 Processing document links for token: ${token}`);

        const employee = await Employee.findOne({ token });
        if (!employee) {
            return { status: 404, body: { error: 'Employee not found' } };
        }

        if (!employee.documents) employee.documents = new Map();

        for (const [docType, link] of Object.entries(documents)) {
            if (typeof link === 'string' && link.trim() !== '') {
                employee.documents.set(docType, link.trim());
            }
        }

        await employee.save();

        if (logger) logger.info(`💾 Updated employee record with ${Object.keys(documents).length} document links.`);

        const driveLink = documents['Drive_Folder_Link'] || Object.values(documents)[0];
        if (driveLink) {
            await updateLinkReceivedByToken(token, driveLink);
            if (logger) logger.info(`📊 Updated Google Sheet with received link for ${token}`);
        }

        if (emit) {
            await emit({
                topic: 'documents.received',
                data: { token, documents }
            });
        }

        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                message: 'Document links received and stored successfully',
                documents: documents
            }
        };

    } catch (error) {
        if (logger) logger.error('❌ Error handling document links', error);
        return {
            status: 500,
            body: {
                error: error.message || 'Internal Server Error'
            }
        };
    }
};
