// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const { google } = require('googleapis');

// Helper to initialize Sheets API Client
async function getSheetsClient() {
  try {
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
      ? process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n')
      : null;
    const clientEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
    const credsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;

    if (privateKey && clientEmail) {
      const auth = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      );
      return google.sheets({ version: 'v4', auth });
    } else if (credsPath) {
      const fs = require('fs');
      if (fs.existsSync(credsPath)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: credsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return google.sheets({ version: 'v4', auth });
      }
    }
  } catch (_) {}
  return null;
}

async function main() {
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  // 1. Clear via Direct Google Sheets API
  if (sheets && spreadsheetId) {
    console.log(`🧹 Direct API: Clearing data rows in sheet ${sheetName}...`);
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A2:Z10000`
      });
      console.log('✅ Google Sheet data cleared successfully!');
      return;
    } catch (err) {
      console.error('❌ Error clearing Google Sheet via Direct API:', err.message);
      process.exit(1);
    }
  }

  // 2. Clear via Web App Fallback
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url || url.trim() === '' || url.includes('your-webapp-url')) {
    console.error('❌ Google Sheets sync credentials or Web App URL is not configured in .env');
    process.exit(1);
  }

  console.log('🧹 Web App: Sending clear request to Google Sheets...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets Web App responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.cleared) {
      console.log('✅ Google Sheet data cleared successfully!');
    } else if (data.success && data.excelRowNo) {
      console.error('❌ Failed to clear Google Sheet: The Web App is still running the old Apps Script code.');
      console.warn('\n💡 To fix this, please follow these steps in Google Apps Script:');
      console.warn('   1. In the top right, click "Deploy" ➔ "Manage deployments".');
      console.warn('   2. Click the pencil icon (Edit) next to the deployment.');
      console.warn('   3. Change "Version" to "New Version".');
      console.warn('   4. Click "Deploy".');
    } else {
      console.error('❌ Failed to clear Google Sheet:', data.error || 'Unknown error');
    }
  } catch (err) {
    console.error('❌ Error clearing Google Sheet:', err.message);
  }
}

main().catch(err => {
  console.error('❌ Critical Error during clear-sheet:', err);
  process.exit(1);
});
