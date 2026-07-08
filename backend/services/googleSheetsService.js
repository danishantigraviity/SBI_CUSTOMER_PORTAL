// ================================================================
//  googleSheetsService.js — Real-Time Google Sheets Sync Service
// ================================================================

require('dotenv').config();
const { Application } = require('../models/schemas');
const { google } = require('googleapis');

/**
 * Initializes and returns a Google Sheets API client if service account credentials are provided.
 * Supports credentials passed via environment variables or a path to a JSON file.
 * @returns {object|null} Google Sheets API client instance or null
 */
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
  } catch (err) {
    console.error('⚠️ Failed to initialize Google Sheets API Client:', err.message);
  }
  return null;
}

/**
 * Validates the Google Sheets Web App URL configurations.
 * @returns {boolean} True if a valid user-defined URL is present
 */
function isWebAppConfigured() {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'https://script.google.com/macros/s/your-webapp-url/exec') {
    return false;
  }
  return true;
}

/**
 * Synchronizes application details to a Google Sheet (either directly via Sheets API or Apps Script).
 * Updates the existing row index or appends a new row, then updates MongoDB.
 * @param {string} applicationId - Mongo _id of the application document
 */
async function syncToGoogleSheets(applicationId) {
  try {
    const app = await Application.findById(applicationId).populate('assignedTo', 'name');
    if (!app) {
      console.error(`❌ Sync aborted: Application with ID ${applicationId} not found in database.`);
      return;
    }

    // ── 1. Data Validation ───────────────────────────────────────────
    const appID = app.applicationId;
    const name = app.personal?.name;
    const mobile = app.personal?.mobile;
    const email = app.personal?.email;

    if (!appID || !name || !mobile || !email) {
      console.warn(`⚠️ Google Sheet Sync Skipped for App: "${appID || 'Unknown'}" — Essential customer data is missing.`);
      console.warn(`   Missing fields: ${[!appID && 'App ID', !name && 'Customer Name', !mobile && 'Mobile', !email && 'Email'].filter(Boolean).join(', ')}`);
      return;
    }

    const fatherName = app.personal?.fatherName || '—';
    const motherName = app.personal?.motherName || '—';
    const pan = app.kyc?.panNumber || '—';
    const aadhaar = app.kyc?.aadhaarNumber || '—';

    // ── 2. Detailed Console Logs for Every Field Value ────────────────
    console.log('📋 Validating Google Sheet Sync Data Fields:');
    console.log(`  ➔ App ID:           "${appID}"`);
    console.log(`  ➔ Customer Name:    "${name}"`);
    console.log(`  ➔ Father's Name:    "${fatherName}"`);
    console.log(`  ➔ Mother's Name:    "${motherName}"`);
    console.log(`  ➔ Mobile:           "${mobile}"`);
    console.log(`  ➔ Email:            "${email}"`);
    console.log(`  ➔ PAN Number:       "${pan}"`);
    console.log(`  ➔ Aadhaar Number:   "${aadhaar}"`);

    // Standardize monthly salary calculation matching excelService
    const sal = app.salaried?.monthlySalary || Math.round((app.selfEmployed?.annualTurnover || 0) / 12);

    // ── 3. Check for Direct Service Account API Client ────────────────
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

    if (sheets && spreadsheetId) {
      console.log(`📡 Syncing App ${appID} directly to Google Sheets via API...`);
      
      const rowValues = [
        appID,
        name,
        fatherName,
        motherName,
        mobile,
        email,
        pan,
        aadhaar
      ];

      const savedRow = app.googleSheetRow || app.excelRowNo || 0;
      let targetRowNumber = 0;

      if (savedRow > 1) {
        // Update existing row
        const range = `${sheetName}!A${savedRow}:H${savedRow}`;
        console.log(`   Updating Row ${savedRow} in range ${range}...`);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [rowValues] }
        });
        targetRowNumber = savedRow;
      } else {
        // Append a new row
        const range = `${sheetName}!A:H`;
        console.log(`   Appending new row to sheet ${sheetName}...`);
        const result = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: { values: [rowValues] }
        });

        const updatedRange = result.data.updates?.updatedRange;
        if (updatedRange) {
          const match = updatedRange.match(/A(\d+):H\d+/);
          if (match) {
            targetRowNumber = parseInt(match[1], 10);
          }
        }
      }

      if (targetRowNumber > 0) {
        console.log(`✅ Google Sheet sync successful. Stored row position: ${targetRowNumber}`);
        await Application.findByIdAndUpdate(app._id, { 
          $set: { 
            excelRowNo: targetRowNumber,
            googleSheetRow: targetRowNumber,
            googleSheetSynced: true
          } 
        });
        return targetRowNumber;
      } else {
        throw new Error('Could not parse appended row range from API response');
      }
    }

    // ── 4. Fallback: Google Sheets Web App Apps Script ─────────────────
    if (!isWebAppConfigured()) {
      console.log('ℹ️ Google Sheets sync is disabled (Neither direct API credentials nor Web App URL are configured). Skipping sync.');
      return;
    }

    const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
    
    // Robust payload with all potential variants of the key mapping to support any Apps Script column setup
    const payload = {
      excelRowNo:          app.googleSheetRow || app.excelRowNo || 0,
      googleSheetRow:      app.googleSheetRow || app.excelRowNo || 0,
      applicationId:       appID,
      "App ID":            appID,
      appId:               appID,
      name:                name,
      "Customer Name":     name,
      customerName:        name,
      fatherName:          fatherName,
      "Father's Name":     fatherName,
      motherName:          motherName,
      "Mother's Name":     motherName,
      mobile:              mobile,
      "Mobile":            mobile,
      email:               email,
      "Email":             email,
      pan:                 pan,
      "PAN Number":        pan,
      panNumber:           pan,
      aadhaar:             aadhaar,
      "Aadhaar (masked)":  aadhaar,
      aadhaarNumber:       aadhaar,

      // Compatibility & Other metadata
      dob:           app.personal?.dob ? new Date(app.personal.dob).toLocaleDateString('en-IN') : '—',
      gender:        app.personal?.gender || '—',
      city:          app.personal?.city   || '—',
      state:         app.personal?.state  || '—',
      pincode:       app.personal?.pincode|| '—',
      empType:       app.employmentType,
      company:       app.salaried?.companyName || app.selfEmployed?.businessName || '—',
      designation:   app.salaried?.designation || app.selfEmployed?.businessType || '—',
      salary:        sal,
      experience:    app.salaried?.workExpYears || app.selfEmployed?.businessYears || 0,
      avgBalance:    app.financial?.avgBankBalance || 0,
      eligScore:     app.eligibility?.score || 0,
      card:          app.eligibility?.recommendedCard || '—',
      creditLimit:   app.eligibility?.creditLimit || '—',
      status:        app.status,
      fraudFlag:     app.fraud?.flagged ? '⚠️ FLAGGED' : '✅ Clean',
      assignedTo:    app.assignedTo?.name || '—',
      source:        app.crm?.source || 'Online',
      submittedAt:   new Date(app.submittedAt || app.createdAt).toLocaleString('en-IN'),
    };

    console.log(`📡 Syncing App ${appID} to Google Sheets via Web App URL...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Sheets Web App responded with status: ${response.status}`);
    }

    const data = await response.json();
    const returnedRow = data.excelRowNo || data.googleSheetRow;
    
    if (data.success && returnedRow) {
      console.log(`✅ Google Sheet sync successful. Stored row position: ${returnedRow}`);
      await Application.findByIdAndUpdate(app._id, { 
        $set: { 
          excelRowNo: returnedRow,
          googleSheetRow: returnedRow,
          googleSheetSynced: true
        } 
      });
      return returnedRow;
    } else {
      console.error('❌ Google Sheet sync failed:', data.error || 'Unknown error response');
    }
  } catch (err) {
    console.error('❌ Error in syncToGoogleSheets:', err.message);
  }
}

module.exports = { syncToGoogleSheets };

/* 
  ================================================================
  💡 REFERENCE: RECOMMENDED GOOGLE APPS SCRIPT CODE (Code.gs)
  ================================================================
  Copy this robust code and paste it into your Google Sheets Extensions ➔ Apps Script:

  function doPost(e) {
    try {
      var data = JSON.parse(e.postData.contents);
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      }
      
      // Target Columns Setup
      var headers = ["App ID", "Customer Name", "Father's Name", "Mother's Name", "Mobile", "Email", "PAN Number", "Aadhaar (masked)"];
      
      // Create headers if sheet is brand new and empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
      }
      
      // Helper function to extract fields with fallbacks
      function getValue(keys) {
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (data[k] !== undefined && data[k] !== null && data[k] !== "") {
            return data[k];
          }
        }
        return "—";
      }
      
      var rowData = [
        getValue(["App ID", "appId", "applicationId"]),
        getValue(["Customer Name", "customerName", "name"]),
        getValue(["Father's Name", "fatherName"]),
        getValue(["Mother's Name", "motherName"]),
        getValue(["Mobile", "mobile"]),
        getValue(["Email", "email"]),
        getValue(["PAN Number", "panNumber", "pan"]),
        getValue(["Aadhaar (masked)", "aadhaarNumber", "aadhaar", "Aadhaar"])
      ];
      
      // Prevent completely blank rows
      var hasData = rowData.some(function(val) { return val !== "—" && val !== ""; });
      if (!hasData) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Validation failed: Empty row data." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var row = data.googleSheetRow || data.excelRowNo || 0;
      if (row > 1 && row <= sheet.getLastRow()) {
        sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
        row = sheet.getLastRow();
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, excelRowNo: row, googleSheetRow: row }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
*/
