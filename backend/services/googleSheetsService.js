// ================================================================
//  googleSheetsService.js — Real-Time Google Sheets Sync Service
// ================================================================

require('dotenv').config();
const { Application } = require('../models/schemas');

/**
 * Validates the Google Sheets Web App URL configurations.
 * @returns {boolean} True if a valid user-defined URL is present
 */
function isSyncConfigured() {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'https://script.google.com/macros/s/your-webapp-url/exec') {
    return false;
  }
  return true;
}

/**
 * Synchronizes application details to a Google Sheet via published Apps Script Web App.
 * Updates the existing row index (excelRowNo) or appends a new row, then updates Mongoose database.
 * @param {string} applicationId - Mongo _id of the application document
 */
async function syncToGoogleSheets(applicationId) {
  if (!isSyncConfigured()) {
    // Graceful fallback: log configuration info instead of warning or erroring out
    console.log('ℹ️ Google Sheets sync is disabled (URL is not configured or is placeholder). Skipping sync.');
    return;
  }

  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;

  try {
    const app = await Application.findById(applicationId).populate('assignedTo', 'name');
    if (!app) return;

    // Standardize monthly salary calculation matching excelService
    const sal = app.salaried?.monthlySalary || Math.round((app.selfEmployed?.annualTurnover || 0) / 12);

    const payload = {
      excelRowNo:    app.excelRowNo || 0,
      applicationId: app.applicationId,
      name:          app.personal?.name,
      fatherName:    app.personal?.fatherName || '—',
      motherName:    app.personal?.motherName || '—',
      mobile:        app.personal?.mobile,
      email:         app.personal?.email,
      pan:           app.kyc?.panNumber || '—',
      aadhaar:       app.kyc?.aadhaarNumber || '—',
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

    console.log(`📡 Syncing App ${app.applicationId} to Google Sheets...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Sheets Web App responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.excelRowNo) {
      console.log(`✅ Google Sheet sync successful. Stored row position: ${data.excelRowNo}`);
      // Save the returned row number back to the database
      // Using findByIdAndUpdate directly avoids calling pre-save middleware hooks in Mongo schema (preventing infinite loops)
      await Application.findByIdAndUpdate(app._id, { $set: { excelRowNo: data.excelRowNo } });
    } else {
      console.error('❌ Google Sheet sync failed:', data.error || 'Unknown error response');
    }
  } catch (err) {
    console.error('❌ Error in syncToGoogleSheets:', err.message);
  }
}

module.exports = { syncToGoogleSheets };
