import { google } from 'googleapis';
import { pdfToPng } from 'pdf-to-png-converter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';
import { updateLevel2StatusByToken } from '../lib/googleSheets.js';

export const config = {
    name: 'GeminiOCR',
    type: 'event',
    subscribes: ['step1.success.sent'],
    flows: ['EmployeeFlow'],
    emits: ['verification.passed', 'verification.failed'],
    description: 'Uses Google Gemini 1.5 Flash to perform OCR and verify the identity documents (Name, DOB consistency).'
};


export const handler = async (event, { logger, emit }) => {
    const { token, files } = event.data || event;

    await connectToDatabase();

    if (logger) logger.info(`👁️ Step 8: Starting OCR (Gemini Flash) for ${files.length} files...`);

    if (!process.env.GEMENI_API_KEY) {
        if (logger) logger.error("❌ GEMENI_API_KEY missing.");
        return;
    }

    const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
    const genAI = new GoogleGenerativeAI(process.env.GEMENI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    try {
        const employee = await Employee.findOne({ token });
        if (!employee) throw new Error("Employee not found");

        if (!employee.ocrData) employee.ocrData = new Map();
        employee.ocrData.set('status', 'OCR In Progress');
        await employee.save();

        const imageParts = [];
        const processedFiles = [];

        for (const file of files) {
            const { id, name, mimeType } = file;

            if (name.toLowerCase().includes('photo') && (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png'))) {
                if (logger) logger.info(`⏭️ Skipping recognized photo file: ${name}`);
                continue;
            }

            if (logger) logger.info(`⬇️ Downloading & Converting ${name}...`);

            try {
                const getRes = await drive.files.get(
                    { fileId: id, alt: 'media' },
                    { responseType: 'arraybuffer' }
                );

                let buffer;
                if (Buffer.isBuffer(getRes.data)) {
                    buffer = getRes.data;
                } else if (getRes.data instanceof ArrayBuffer) {
                    buffer = Buffer.from(getRes.data);
                } else {
                    throw new Error(`Unexpected data type from Drive: ${typeof getRes.data}`);
                }

                if (mimeType === 'application/pdf') {
                    const pngPages = await pdfToPng(buffer, {
                        disableFontFace: false,
                        useSystemFonts: false,
                        viewportScale: 1.5
                    });

                    for (const page of pngPages) {
                        imageParts.push({
                            inlineData: {
                                data: page.content.toString('base64'),
                                mimeType: 'image/png'
                            }
                        });
                    }
                    processedFiles.push(`${name} (converted to ${pngPages.length} images)`);
                } else if (mimeType.startsWith('image/')) {
                    imageParts.push({
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType: mimeType
                        }
                    });
                    processedFiles.push(name);
                } else {
                    if (logger) logger.warn(`Skipping unsupported file type for Gemini: ${name} (${mimeType})`);
                }

            } catch (err) {
                if (logger) logger.error(`❌ Failed to prepare file ${name}: ${err.message}`);
            }
        }

        if (imageParts.length === 0) {
            if (logger) logger.warn("⚠️ No valid document images found for OCR.");
            return;
        }

        if (logger) logger.info(`🚀 Sending ${imageParts.length} image parts to Gemini Flash...`);

        const prompt = `
        You are an expert document verifier. I am providing you with images of documents uploaded by a user from India. 
        These should ideally include: Aadhaar Card, PAN Card, 10th Marksheet, and 12th Marksheet.

        Please perform the following tasks strictly and provide the output in JSON format:

        1. **Verify Document Types**: Check if the uploaded images contain an Aadhaar Card and a PAN Card.
        2. **Extract & Verify Data**:
            - **Name**: Extract the name. Check if the name is spelled exactly the same way across all documents (Aadhaar, PAN, Marksheets).
            - **Aadhaar Number**: Extract the 12-digit Aadhaar number.
            - **PAN Number**: Extract the PAN number.
            - **Date of Birth (DOB)**: Extract DOB and check if it exactly matches across all documents.
        3. **Determine Status**: Set "status" to "PASS" ONLY if:
            - Aadhaar Card is present.
            - PAN Card is present.
            - 10th Marksheet is present.
            - 12th Marksheet is present.
            - Name is consistent across all documents.
            - DOB is consistent across all documents.
            Otherwise, set "status" to "FAIL".

        **Output Structure (JSON Only)**:
        {
            "status": "PASS" | "FAIL",
            "name": "Extracted Name",
            "aadhaarNumber": "Extracted Aadhaar Number (or null if not found)",
            "panNumber": "Extracted PAN Number (or null if not found)",
            "dob": "DD/MM/YYYY",
            "isAadhaarPresent": true/false,
            "isPanPresent": true/false,
            "isNameConsistent": true/false,
            "isDobConsistent": true/false,
            "consistencyNotes": "Brief explanation if names or DOBs do not match, or 'Consistent' if they do."
        }
        `;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const textResponse = response.text();

        let jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonString.startsWith('json')) jsonString = jsonString.slice(4).trim();

        let extractedData = {};

        try {
            extractedData = JSON.parse(jsonString);
            if (logger) logger.info("✅ Gemini response parsed successfully.");
        } catch (e) {
            if (logger) logger.error("❌ Failed to parse Gemini JSON. Raw response:", textResponse);
            extractedData = { rawResponse: textResponse, error: "JSON Parse Failed", status: "fail", consistencyNotes: "Failed to parse API response." };
        }

        employee.ocrData.set('gemini_result', extractedData);
        employee.ocrData.set('processed_files', processedFiles);
        employee.ocrData.set('source_model', 'gemini-3-flash-preview');

        if (extractedData.name) employee.ocrData.set('extracted_name', extractedData.name);
        if (extractedData.aadhaarNumber) employee.ocrData.set('extracted_aadhaar', extractedData.aadhaarNumber);
        if (extractedData.panNumber) employee.ocrData.set('extracted_pan', extractedData.panNumber);

        employee.ocrData.set('status', 'OCR Completed');
        employee.ocrData.set('ocrCompletedAt', new Date().toISOString());

        await employee.save();

        if (logger) logger.info("🎉 Step 8 Result:", JSON.stringify(extractedData, null, 2));

        const payload = {
            token,
            email: employee.email,
            name: employee.name,
            role: employee.role,
            geminiResult: extractedData
        };

        const finalStatus = extractedData.status ? extractedData.status.toUpperCase() : 'FAIL';
        await updateLevel2StatusByToken(token, finalStatus);
        if (logger) logger.info(`📊 Level 2 Status updated to ${finalStatus} for ${token}`);

        if (finalStatus === 'PASS') {
            if (emit) await emit({ topic: 'verification.passed', data: payload });
            if (logger) logger.info("📢 Emitted verification.passed");
        } else {
            if (emit) await emit({ topic: 'verification.failed', data: payload });
            if (logger) logger.info("📢 Emitted verification.failed");
        }

    } catch (error) {
        if (logger) logger.error("❌ Error in GeminiOCR Step", error);

        try {
            const employee = await Employee.findOne({ token });
            if (employee) {
                employee.ocrData.set('status', 'OCR Failed');
                employee.ocrData.set('error', error.message);
                await employee.save();
            }
        } catch (cancelErr) { }
    }
};
