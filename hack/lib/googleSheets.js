import { google } from 'googleapis';
import path from 'path';

const getSheetsClient = () => {
    // Check if critical env vars are present
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Missing Google Service Account credentials in .env');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            project_id: process.env.GOOGLE_PROJECT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
};


const getSpreadsheetId = () => {
    return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1FDzl6x9rvzXh0P8aLaZlx3oxfGU6gOgYphIT8SGayPQ';
};

/**
 * Appends a row of data to the Google Sheet.
 * @param {Array<Array<any>>} values - 2D array of values to append.
 * @param {string} [range='Sheet1!A:G'] - The range to append to.
 */
export const updateGoogleSheet = async (values, range = 'Sheet1!A:G') => {
    try {
        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.append({
            spreadsheetId: getSpreadsheetId(),
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
        });
    } catch (error) {
        throw new Error(`Google Sheet Append Failed: ${error.message}`);
    }
};

/**
 * Updates the status and timestamp for a specific token.
 * @param {string} token - The token to search for (Column A).
 * @param {string} status - The new status (ACCEPTED/REJECTED).
 */
export const updateRowStatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Find the row index
        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A', // Read only Column A (Tokens)
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) {
            throw new Error('No data found in sheet');
        }

        // Find index (1-based for Sheet range)
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1; // 1-based index
                break;
            }
        }

        if (rowIndex === -1) {
            throw new Error(`Token ${token} not found in sheet`);
        }

        // 2. Update 'Last Update' (Col C) and 'Status' (Col G)

        // Update Status (Column G)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!G${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

        // Update Last Update (Column C)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!C${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[new Date().toLocaleString()]] }
        });

    } catch (error) {
        throw new Error(`Google Sheet Update Row Failed: ${error.message}`);
    }
};

/**
 * Updates the document link for a specific token in Column H.
 * @param {string} token - The token to search for.
 * @param {string} link - The document link to save.
 */
export const updateDocumentLinkByToken = async (token, link) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Find the row index (same logic as above, we could refactor if needed)
        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for doc link update.`);
            return;
        }

        // 2. Update 'Document Link' (Column H)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!H${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[link]] }
        });

    } catch (error) {
        console.error(`Google Sheet Doc Link Update Failed: ${error.message}`);
    }
};

/**
 * Updates the 'Link Received' (Column I) for a specific token.
 * @param {string} token - The token to search for.
 * @param {string} link - The received drive link to save.
 */
export const updateLinkReceivedByToken = async (token, link) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Find the row index
        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Link Received update.`);
            return;
        }

        // 2. Update 'Link Received' (Column I)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!I${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[link]] }
        });

    } catch (error) {
        console.error(`Google Sheet Link Received Update Failed: ${error.message}`);
    }
};

/**
 * Updates 'Level 1' (Column J) with PASSED/FAILED.
 * @param {string} token - The token to search for.
 * @param {string} status - PASSED or FAILED
 */
export const updateLevel1StatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Level 1 update.`);
            return;
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!J${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet Level 1 Update Failed: ${error.message}`);
    }
};

/**
 * Updates 'Level 2' (Column K) with PASSED/FAILED.
 * @param {string} token - The token to search for.
 * @param {string} status - PASSED or FAILED
 */
export const updateLevel2StatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Find the row index
        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Level 2 update.`);
            return;
        }

        // 2. Update 'Level 2' (Column K)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!K${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet Level 2 Update Failed: ${error.message}`);
    }
};

/**
 * Updates 'Level 3' (Column N) with a status (e.g. RECEIVED).
 * @param {string} token - The token to search for.
 * @param {string} status - Status string
 */
export const updateLevel3StatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Level 3 update.`);
            return;
        }

        // Column M is the 14th column
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!M${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet Level 3 Update Failed: ${error.message}`);
    }
};

/**
 * Updates 'Kit Status' (Column N) with a status (e.g. ORDERED).
 * @param {string} token - The token to search for.
 * @param {string} status - Status string
 */
export const updateKitStatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Kit Status update.`);
            return;
        }

        // Column N is the 14th column (A=1 ... M=13, N=14)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!N${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet Kit Status Update Failed: ${error.message}`);
    }
};
/**
 * Updates 'Kit Received' (Column O) with a status (e.g. RECEIVED).
 * @param {string} token - The token to search for.
 * @param {string} status - Status string
 */
export const updateKitReceivedByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Kit Received update.`);
            return;
        }

        // Column O is the 15th column
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!O${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet Kit Received Update Failed: ${error.message}`);
    }
};

/**
 * Updates 'New Email' (Column P) with a status (e.g. SENT).
 * @param {string} token - The token to search for.
 * @param {string} status - Status string
 */
export const updateJoiningLetterStatusByToken = async (token, status) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for New Email update.`);
            return;
        }

        // Column P is the 16th column
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!P${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[status]] }
        });

    } catch (error) {
        console.error(`Google Sheet New Email Update Failed: ${error.message}`);
    }
};
/**
 * Updates 'Joining Date' (Column Q) with the calculated date.
 * @param {string} token - The token to search for.
 * @param {string} dateString - The date string to save.
 */
export const updateJoiningDateByToken = async (token, dateString) => {
    try {
        const sheets = getSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        const readRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = readRes.data.values;
        if (!rows || rows.length === 0) return;

        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === token) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.warn(`Token ${token} not found in sheet for Joining Date update.`);
            return;
        }

        // Column Q is the 17th column
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!Q${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[dateString]] }
        });

    } catch (error) {
        console.error(`Google Sheet Joining Date Update Failed: ${error.message}`);
    }
};
