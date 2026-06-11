import { google } from 'googleapis';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Google Auth Client
const getAuthClient = () => {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Google Service Account credentials are not set in .env.local');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
};

export const getDriveService = () => {
  const auth = getAuthClient();
  return google.drive({ version: 'v3', auth });
};

export const getSheetsService = () => {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
};

// Example function skeleton to upload file
export const uploadToDrive = async (fileName: string, mimeType: string, fileBuffer: Buffer) => {
  const drive = getDriveService();
  
  // Create stream from buffer
  const stream = require('stream');
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID!],
    },
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: 'id, webViewLink, webContentLink',
  });

  return response.data;
};

// Example function skeleton to append row to sheets
export const appendToSheet = async (values: any[]) => {
  const sheets = getSheetsService();
  
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:Z', // Modify based on your sheet name
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });

  return response.data;
};
