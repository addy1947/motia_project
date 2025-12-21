import { z } from 'zod';
import { updateGoogleSheet } from '../lib/googleSheets.js';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

const employeeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    role: z.string().min(1, 'Role is required'),
    package: z.string().min(1, 'Package is required')
})

export const config = {
    name: 'ReceiveEmployeeData',
    type: 'api',
    path: '/first',
    method: 'POST',
    flows: ['EmployeeFlow'],
    emits: ['employee.data.received'],
    description: 'Receives initial employee data (name, email, role, package) and generates a verification token.'
}


export const handler = async (req, { logger, emit }) => {
    try {
        const data = req.body;
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 15);
        const token = `${timestamp}-${randomPart}`;
        const updateTime = new Date().toLocaleString();

        if (logger) {
            logger.info('🔑 Token generated', {
                token,
                tokenLength: token.length
            });
        }

        try {
            await connectToDatabase();

            const employee = await Employee.create({
                name: data.name,
                email: data.email,
                role: data.role,
                package: data.package,
                token: token,
                status: 'PENDING',
                updatedAt: new Date()
            });

            if (logger) {
                logger.info('✅ Employee saved to MongoDB', { id: employee._id });
            }
        } catch (dbError) {
            if (logger) {
                logger.error('❌ Database Error', { error: dbError.message });
            }
        }

        try {
            await updateGoogleSheet([[
                token,
                data.name,
                updateTime,
                data.email,
                data.role,
                data.package,
                'PENDING'
            ]]);
            if (logger) logger.info('✅ Google Sheet updated successfully via Service Account');
        } catch (sheetErr) {
            if (logger) logger.warn('⚠️ Google Sheet Update Failed', { error: sheetErr.message });
        }

        if (logger) {
            logger.info('📩 Received employee data', {
                name: data.name,
                email: data.email,
                role: data.role,
                package: data.package,
                token: token
            });
        }

        if (emit) {
            await emit({
                topic: 'employee.data.received',
                data: {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    package: data.package,
                    token: token
                }
            });
        }

        return {
            status: 200,
            body: {
                message: 'Data received and stored successfully',
                receivedData: data,
                token: token
            }
        };
    } catch (error) {
        if (logger) {
            logger.error('❌ Error processing employee data', { error: error.message });
        }
        return {
            status: 400,
            body: { error: 'Invalid data format or server error' }
        };
    }
}
