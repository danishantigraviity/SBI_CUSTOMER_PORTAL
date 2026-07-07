// ================================================================
//  Upload Middleware — Multer + File Validation
// ================================================================

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const ALLOWED_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg':      '.jpg',
  'image/jpg':       '.jpg',
  'image/png':       '.png',
};
const MAX_MB = 5;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let docType = req.body.docType || 'misc';
    if (file.fieldname === 'pan' || file.fieldname === 'aadhaar') docType = 'kyc';
    else if (['payslip', 'bankStatement', 'gst', 'employeeId', 'itr', 'businessReg'].includes(file.fieldname)) docType = 'employment';
    
    const dateDir  = new Date().toISOString().slice(0, 7);
    const dir      = path.join(__dirname, '../uploads', docType, dateDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}_${hash}${ext}`);
  },
});

const fileFilter = (req, file, cb) =>
  ALLOWED_MIME[file.mimetype] ? cb(null, true) : cb(new Error(`Invalid type: ${file.mimetype}. PDF/JPG/PNG only.`), false);

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_MB * 1024 * 1024 } });

const uploadKYC = upload.fields([
  { name: 'pan',     maxCount: 1 },
  { name: 'aadhaar', maxCount: 2 },
]);

const uploadEmployment = upload.fields([
  { name: 'payslip',       maxCount: 3 },
  { name: 'bankStatement', maxCount: 6 },
  { name: 'employeeId',    maxCount: 1 },
  { name: 'itr',           maxCount: 2 },
  { name: 'gst',           maxCount: 1 },
  { name: 'businessReg',   maxCount: 1 },
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ error: `File too large. Max ${MAX_MB}MB allowed.` });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

module.exports = { upload, uploadKYC, uploadEmployment, handleUploadError };
