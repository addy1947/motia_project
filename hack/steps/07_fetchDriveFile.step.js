import { google } from 'googleapis';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';
import { updateLevel1StatusByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'FetchDriveFiles',
    type: 'event',
    subscribes: ['documents.received'],
    flows: ['EmployeeFlow'],
    emits: ['files.fetched', 'documents.retry'],
    description: 'Fetches the list of files from the provided Google Drive link and checks for required documents.'
};


export const handler = async (event, { logger, emit }) => {
    const { token, documents } = event.data || event;
    const driveLink = documents['Drive_Folder_Link'];

    await connectToDatabase();

    const employee = await Employee.findOne({ token });
    if (!employee) {
        if (logger) logger.error("❌ Employee not found for token", { token });
        return;
    }

    if (logger) logger.info(`📂 Step 7: Fetching File List for ${token}`, { driveLink });

    if (!process.env.GOOGLE_API_KEY) {
        if (logger) logger.error("❌ GOOGLE_API_KEY is missing.");
        return;
    }

    if (!driveLink) {
        if (logger) logger.error("❌ No Drive Link provided.");
        return;
    }

    const folderIdMatch = driveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
        if (logger) logger.error("❌ Invalid Drive Folder Link format.");
        return;
    }
    const folderId = folderIdMatch[1];

    const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

    try {
        const listRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        const files = listRes.data.files || [];
        const fileNames = files.map(f => f.name.toLowerCase());

        if (logger) logger.info(`✅ Found ${files.length} files: ${files.map(f => f.name).join(', ')}`);

        const requiredFiles = ['aadhaar.pdf', 'pan.pdf', '10thmarksheet.pdf', '12thmarksheet.pdf', 'photo.jpg'];
        const missingFiles = [];

        for (const req of requiredFiles) {
            if (req === 'photo.jpg') {
                if (!fileNames.some(f => f === 'photo.jpg' || f === 'photo.jpeg' || f === 'photo.png')) {
                    missingFiles.push(req);
                }
            } else {
                if (!fileNames.includes(req)) {
                    missingFiles.push(req);
                }
            }
        }

        if (missingFiles.length > 0) {
            if (logger) logger.warn(`⚠️ Missing files: ${missingFiles.join(', ')}. Triggering Retry.`);

            employee.ocrData = employee.ocrData || new Map();
            employee.ocrData.set('status', 'Validation Failed - Retrying');
            employee.ocrData.set('missing_files', missingFiles.join(', '));
            await employee.save();

            await updateLevel1StatusByToken(token, 'FAILED');
            if (logger) logger.info(`📊 Level 1 Status updated to FAILED for ${token}`);

            if (emit) {
                await emit({
                    topic: 'documents.retry',
                    data: {
                        token,
                        email: employee.email,
                        name: employee.name,
                        role: employee.role,
                        missingFiles
                    }
                });
            }
            return;
        }

        if (logger) logger.info("✅ All files matched. Proceeding to OCR.");

        employee.ocrData = employee.ocrData || new Map();
        employee.ocrData.set('drive_files_found', JSON.stringify(files.map(f => f.name)));
        employee.ocrData.set('status', 'Files Validated');
        await employee.save();

        await updateLevel1StatusByToken(token, 'PASSED');
        if (logger) logger.info(`📊 Level 1 Status updated to PASSED for ${token}`);

        if (emit) {
            await emit({
                topic: 'files.fetched',
                data: { token, files, folderId }
            });
        }

    } catch (error) {
        if (logger) logger.error("❌ Error fetching Drive files", error);
    }
};
