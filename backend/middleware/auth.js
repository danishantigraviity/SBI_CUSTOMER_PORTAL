// ================================================================
//  Auth Middleware — JWT Verification + Role-Based Access Control
// ================================================================

const jwt           = require('jsonwebtoken');
const { AdminUser } = require('../models/schemas');
const { AuditLog }  = require('../models/schemas');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided.' });

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'Customer') {
      const { Customer } = require('../models/schemas');
      const customer = await Customer.findById(decoded.id);
      if (!customer) return res.status(401).json({ error: 'Customer not found.' });
      req.user = customer;
      req.isCustomer = true;
      return next();
    }

    const user    = await AdminUser.findById(decoded.id);
    if (!user || !user.isActive)
      return res.status(401).json({ error: 'User not found or deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ error: msg });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated.' });
  if (req.isCustomer) return res.status(403).json({ error: 'Access denied. Customers not allowed.' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Access denied. Required: ${roles.join(' or ')}` });
  next();
};

const generateTokens = (user) => {
  const role = user.role || 'Customer';
  const payload = { id: user._id, role: role, staffId: user.staffId || null };
  return {
    accessToken:  jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: '8h'  }),
    refreshToken: jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'  }),
  };
};

const auditLog = (action) => async (req, res, next) => {
  try {
    await AuditLog.create({
      user: req.user?._id, action,
      resource: req.baseUrl, resourceId: req.params.id,
      details: { method: req.method, body: req.body },
      ipAddress: req.ip, userAgent: req.get('user-agent'),
    });
  } catch (_) {}
  next();
};

module.exports = {
  authenticate,
  authorize,
  generateTokens,
  auditLog,
  isManager:     authorize('Manager'),
  isManagerOrTL: authorize('Manager','Team Leader'),
  isStaff:       authorize('Manager','Team Leader','Sales Executive','Telecaller','Risk Analyst'),
};
