// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const { Application } = require('../models/schemas');
const { syncToGoogleSheets } = require('../services/googleSheetsService');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  const apps = await Application.find({}, '_id');
  console.log(`📦 Found ${apps.length} applications in the database.`);

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    console.log(`[${i + 1}/${apps.length}] Syncing application ID: ${app._id}...`);
    try {
      await syncToGoogleSheets(app._id);
    } catch (err) {
      console.warn(`⚠️ Failed to sync app ${app._id}:`, err.message);
    }
  }

  console.log('🎉 Bulk sync completed successfully!');
  await mongoose.connection.close();
}

main().catch(err => {
  console.error('❌ Critical Error during bulk sync:', err);
  process.exit(1);
});
