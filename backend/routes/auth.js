// routes/auth.js
const express         = require('express');
const router          = express.Router();
const { AdminUser }   = require('../models/schemas');
const { generateTokens, authenticate } = require('../middleware/auth');
const jwt             = require('jsonwebtoken');

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

    const admin = await AdminUser.findOne({ staffId: staffId.toUpperCase() }).select('+password');
    if (!admin || !admin.isActive)
      return res.status(401).json({ error: 'Invalid credentials or account inactive.' });

    const valid = await admin.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    await AdminUser.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
    const { accessToken, refreshToken } = generateTokens(admin);
    const safeAdmin = admin.toObject(); delete safeAdmin.password;
    res.json({ success: true, admin: safeAdmin, accessToken, refreshToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
