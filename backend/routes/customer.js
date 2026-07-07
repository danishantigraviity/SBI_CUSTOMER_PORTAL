// routes/customer.js
const express         = require('express');
const router          = express.Router();
const { Customer }    = require('../models/schemas');
const { generateTokens } = require('../middleware/auth');

// POST /api/customer/start-application
router.post('/start-application', async (req, res) => {
  try {
    const { name, mobile, email } = req.body;
    if (!name || !mobile || !email)
      return res.status(400).json({ error: 'Name, mobile, and email are required.' });
    if (!/^\d{10}$/.test(mobile.replace(/\s/g,'')))
      return res.status(400).json({ error: 'Mobile must be 10 digits.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email address.' });

    const customer = await Customer.findOneAndUpdate(
      { mobile: mobile.trim() },
      { name: name.trim(), email: email.trim().toLowerCase(), lastLogin: new Date(), $inc: { sessionCount: 1 } },
      { new: true, upsert: true }
    );

    const { accessToken, refreshToken } = generateTokens(customer);
    res.json({ success: true, user: customer, accessToken, refreshToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
