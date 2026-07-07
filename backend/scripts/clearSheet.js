// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

async function main() {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url) {
    console.error('❌ GOOGLE_SHEET_WEBAPP_URL is not configured in .env');
    process.exit(1);
  }

  console.log('🧹 Sending clear request to Google Sheets...');
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
