// routes/auth.js
const express         = require('express');
const router          = express.Router();
const { AdminUser }   = require('../models/schemas');
const { generateTokens, authenticate } = require('../middleware/auth');
const jwt             = require('jsonwebtoken');
const { BRANCH_NAME } = require('../config/branchConfig');

// POST /api/auth/customer/login
router.post('/customer/login', async (req, res) => {
  try {
    const { name, mobile, email } = req.body;
    if (!name || !mobile || !email)
      return res.status(400).json({ error: 'Name, mobile, and email are required.' });
    if (!/^\d{10}$/.test(mobile.replace(/\s/g,'')))
      return res.status(400).json({ error: 'Mobile must be 10 digits.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email address.' });

    const { Customer } = require('../models/schemas');
    const customer = await Customer.findOneAndUpdate(
      { mobile: mobile.trim() },
      { name: name.trim(), email: email.trim().toLowerCase(), lastLogin: new Date(), $inc: { sessionCount: 1 } },
      { new: true, upsert: true }
    );

    const { accessToken, refreshToken } = generateTokens(customer);
    res.json({ success: true, user: customer, accessToken, refreshToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { staffId, password } = req.body;
    if (!staffId || !password)
      return res.status(400).json({ error: 'Staff ID and password required.' });

    const cleanStaffId = staffId.trim().toUpperCase();
    console.log(`[Login Attempt] staffId received: "${staffId}" -> normalized: "${cleanStaffId}"`);

    // Ensure ADMIN-001 exists in the database
    const admin001 = await AdminUser.findOne({ staffId: 'ADMIN-001' });
    if (!admin001) {
      console.log('[Auto-seed] ADMIN-001 not found. Auto-seeding ADMIN-001...');
      const seededAdmin = new AdminUser({
        staffId: 'ADMIN-001',
        name: 'System Administrator',
        email: 'admin@sbi.co.in',
        password: 'Admin@123',
        role: 'Manager',
        branch: BRANCH_NAME,
        isActive: true
      });
      await seededAdmin.save();
      console.log('[Auto-seed] Seeded ADMIN-001 successfully.');
    }

    const admin = await AdminUser.findOne({ staffId: cleanStaffId }).select('+password');
    if (!admin) {
      console.log(`[Login Failed] staffId "${cleanStaffId}" not found in database.`);
      return res.status(401).json({ error: 'Invalid credentials or account inactive.' });
    }

    console.log(`[Login Progress] User found: "${admin.name}" (Role: ${admin.role}), isActive: ${admin.isActive}`);
    if (!admin.isActive) {
      console.log(`[Login Failed] Account for staffId "${cleanStaffId}" is inactive.`);
      return res.status(401).json({ error: 'Invalid credentials or account inactive.' });
    }

    const valid = await admin.comparePassword(password);
    console.log(`[Login Progress] Password match status: ${valid}`);
    if (!valid) {
      console.log(`[Login Failed] Invalid password for staffId "${cleanStaffId}".`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await AdminUser.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
    const { accessToken, refreshToken } = generateTokens(admin);
    const safeAdmin = admin.toObject(); delete safeAdmin.password;
    console.log(`[Login Success] staffId "${cleanStaffId}" authenticated successfully.`);
    res.json({ success: true, admin: safeAdmin, accessToken, refreshToken });
  } catch (err) { 
    console.error('[Login Error] Unexpected error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { AdminUser, Customer } = require('../models/schemas');
    let user = await AdminUser.findById(decoded.id);
    if (!user || !user.isActive) {
      user = await Customer.findById(decoded.id);
    }
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });
    res.json(generateTokens(user));
  } catch (err) { res.status(401).json({ error: 'Invalid or expired refresh token.' }); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const u = req.user.toObject(); delete u.password;
  if (req.isCustomer) u.role = 'Customer';
  res.json({ success: true, user: u });
});

// POST /api/auth/admin/create  (Manager only — create staff)
router.post('/admin/create', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Manager')
      return res.status(403).json({ error: 'Only Managers can create staff accounts.' });
    const { staffId, name, email, password, role, branch } = req.body;
    const existing = await AdminUser.findOne({ $or: [{ staffId: staffId?.toUpperCase() }, { email }] });
    if (existing) return res.status(409).json({ error: 'Staff ID or email already exists.' });
    const admin = await AdminUser.create({ staffId, name, email, password, role, branch, createdBy: req.user._id });
    const safe  = admin.toObject(); delete safe.password;
    res.status(201).json({ success: true, admin: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
