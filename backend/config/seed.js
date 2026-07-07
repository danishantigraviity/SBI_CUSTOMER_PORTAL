// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose   = require('mongoose');
const { AdminUser, Application, Lead, AuditLog, NotificationTemplate, Customer } = require('../models/schemas');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing data across all collections
  await Promise.all([
    AdminUser.deleteMany({}),
    Application.deleteMany({}),
    Lead.deleteMany({}),
    AuditLog.deleteMany({}),
    Customer.deleteMany({}),
    NotificationTemplate.deleteMany({})
  ]);
  console.log('🧹  Cleared all database collections');

  // ── New Admin Users ──────────────────────────────────────────────
  const admins = [
    { 
      staffId: 'ADMIN-001',  
      name: 'System Administrator', 
      email: 'admin@sbi.co.in',   
      password: 'Admin@123', 
      role: 'Manager',          
      branch: 'Chennai' 
    },
    {
      staffId: 'SBI-TL-001',
      name: 'Arun Singh',
      email: 'arun.singh@sbi.co.in',
      password: 'Admin@123',
      role: 'Team Leader',
      branch: 'Chennai'
    }
  ];

  const adminDocs = [];
  for (const a of admins) {
    const user = new AdminUser(a);
    await user.save();
    adminDocs.push(user);
    console.log(`👤  Created Admin: ${a.name} (${a.role}) — ${a.staffId}`);
  }

  // ── Mock Applications with Father's & Mother's Names ──────────────
  // Removed mock applications seeding to support clean production environment initialization.

  console.log('\n✅  Seed complete!');
  console.log('─'.repeat(50));
  console.log('Login credentials:');
  admins.forEach(a => console.log(`  ${a.staffId.padEnd(14)} | ${a.password} | ${a.role}`));
  console.log('─'.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
