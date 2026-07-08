// routes/applications.js
const express               = require('express');
const router                = express.Router();
const { Application }       = require('../models/schemas');
const { authenticate, isManagerOrTL, isStaff } = require('../middleware/auth');
const { runFraudChecks }    = require('../services/fraudDetection');
const { notifyAll }         = require('../services/notificationService');
const { syncToGoogleSheets } = require('../services/googleSheetsService');
const { parseDate }         = require('../utils/dateParser');

function validateApplicationData(data, isSubmit = false) {
  const errors = [];
  const { personal, kyc } = data;

  if (personal) {
    if (personal.name !== undefined) {
      if (!personal.name || personal.name.trim().length < 3) {
        errors.push("Name must be at least 3 characters.");
      } else if (!/^[A-Za-z\s]+$/.test(personal.name)) {
        errors.push("Name must contain only letters and spaces.");
      }
    }

    if (personal.mobile !== undefined) {
      const cleanMobile = personal.mobile.replace(/\s/g, '');
      if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
        errors.push("Mobile number must be a valid 10-digit Indian number.");
      }
    }

    if (personal.email !== undefined) {
      if (!personal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
        errors.push("Email address is invalid.");
      }
    }

    if (personal.dob !== undefined) {
      if (!personal.dob) {
        errors.push("Date of birth is required.");
      } else {
        const birthDate = parseDate(personal.dob);
        if (!birthDate) {
          errors.push("Invalid Date of Birth.");
        } else {
          const age = new Date().getFullYear() - birthDate.getFullYear();
          if (age < 21 || age > 60) {
            errors.push("Age must be between 21 and 60 years.");
          }
        }
      }
    }

    if (personal.pincode !== undefined) {
      if (!personal.pincode || !/^\d{6}$/.test(personal.pincode)) {
        errors.push("Pincode must be exactly 6 digits.");
      }
    }

    if (personal.fatherName !== undefined) {
      if (!personal.fatherName || personal.fatherName.trim().length < 3) {
        errors.push("Father's name must be at least 3 characters.");
      }
    }

    if (personal.motherName !== undefined) {
      if (!personal.motherName || personal.motherName.trim().length < 3) {
        errors.push("Mother's name must be at least 3 characters.");
      }
    }

    if (personal.address !== undefined) {
      if (!personal.address || personal.address.trim().length < 10) {
        errors.push("Address must be at least 10 characters.");
      }
    }
  }

  if (kyc) {
    if (kyc.panNumber !== undefined) {
      const cleanPan = kyc.panNumber.trim().toUpperCase();
      if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
        errors.push("Invalid PAN card number format.");
      }
    }

    if (kyc.aadhaarNumber !== undefined) {
      const cleanAadhaar = kyc.aadhaarNumber.replace(/\s/g, '');
      if (!cleanAadhaar || !/^\d{12}$/.test(cleanAadhaar)) {
        errors.push("Aadhaar number must be exactly 12 digits.");
      }
    }
  }

  // If submitting, all these fields are strictly required!
  if (isSubmit) {
    if (!personal?.name) errors.push("Personal details: Name is required.");
    if (!personal?.mobile) errors.push("Personal details: Mobile is required.");
    if (!personal?.email) errors.push("Personal details: Email is required.");
    if (!personal?.dob) errors.push("Personal details: Date of birth is required.");
    if (!personal?.pincode) errors.push("Personal details: Pincode is required.");
    if (!personal?.address) errors.push("Personal details: Address is required.");
    if (!kyc?.panNumber) errors.push("KYC details: PAN number is required.");
    if (!kyc?.aadhaarNumber) errors.push("KYC details: Aadhaar number is required.");
  }

  return errors;
}

// GET /api/applications/my-draft — Get logged-in customer's active draft
router.get('/my-draft', authenticate, async (req, res) => {
  try {
    if (!req.isCustomer) return res.status(403).json({ error: 'Admins cannot have drafts.' });
    if (!req.user.currentApplicationId) return res.json({ success: true, data: null });

    const app = await Application.findById(req.user.currentApplicationId);
    res.json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications/draft — Create draft
router.post('/draft', authenticate, async (req, res) => {
  try {
    if (!req.isCustomer) return res.status(403).json({ error: 'Admins cannot create drafts.' });
    
    let app;
    if (req.user.currentApplicationId) {
      app = await Application.findById(req.user.currentApplicationId);
    }

    if (!app) {
      app = new Application({
        personal: {
          name: req.user.name,
          mobile: req.user.mobile,
          email: req.user.email
        },
        status: 'New Lead',
        stage: 'Draft Created'
      });
      await app.save();
      req.user.currentApplicationId = app._id;
      await req.user.save();
    }

    res.status(201).json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/applications/draft/:id — Save/update progress of draft
router.patch('/draft/:id', authenticate, async (req, res) => {
  try {
    if (!req.isCustomer) return res.status(403).json({ error: 'Admins cannot update drafts.' });
    
    // Call validation helper on draft updates
    const validationErrors = validateApplicationData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    const { personal, kyc, employmentType, salaried, selfEmployed, financial, eligibility, consentGiven, stage } = req.body;

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    if (personal) {
      app.personal = { ...app.personal?.toObject(), ...personal };
    }
    if (kyc) {
      app.kyc = { ...app.kyc?.toObject(), ...kyc };
    }
    if (employmentType) app.employmentType = employmentType;
    if (salaried) {
      app.salaried = { ...app.salaried?.toObject(), ...salaried };
    }
    if (selfEmployed) {
      app.selfEmployed = { ...app.selfEmployed?.toObject(), ...selfEmployed };
    }
    if (financial) {
      app.financial = { ...app.financial?.toObject(), ...financial };
    }
    if (eligibility) {
      app.eligibility = { ...app.eligibility?.toObject(), ...eligibility };
    }
    if (stage) app.stage = stage;
    if (consentGiven !== undefined) {
      app.consentGiven = consentGiven;
      if (consentGiven) app.consentAt = new Date();
    }

    await app.save();
    res.json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications/submit/:id — Submit draft application (final step)
router.post('/submit/:id', authenticate, async (req, res) => {
  try {
    if (!req.isCustomer) return res.status(403).json({ error: 'Admins cannot submit apps this way.' });
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    // Validate the entire draft application before finalizing submission
    const validationErrors = validateApplicationData(app.toObject(), true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: `Validation failed: ${validationErrors.join(' ')}` });
    }

    // Ensure documents are uploaded
    const panUploaded = app.documents.some(d => d.docType === 'pan');
    const aadhaarUploaded = app.documents.some(d => d.docType === 'aadhaar');
    if (!panUploaded || !aadhaarUploaded) {
      return res.status(400).json({ error: 'Both PAN and Aadhaar documents must be uploaded.' });
    }

    // Run fraud check
    const fraud = await runFraudChecks({ 
      panNumber: app.kyc?.panNumber, 
      aadhaarNumber: app.kyc?.aadhaarNumber,
      applicationId: app._id
    });

    app.fraud = { 
      ...app.fraud?.toObject(),
      ...fraud, 
      duplicatePan: !fraud.checks?.duplicatePan, 
      duplicateAadhaar: !fraud.checks?.duplicateAadhaar 
    };
    app.status = 'Submitted';
    app.stage = 'Submitted';
    app.ipAddress = req.ip;
    app.userAgent = req.get('user-agent');
    
    if (!app.timeline) app.timeline = [];
    app.timeline.push({ event: 'Application Submitted', description: 'Customer submitted via web portal' });
    
    await app.save();
    syncToGoogleSheets(app._id).catch(console.warn);

    // Clear currentApplicationId so they can submit a new one in the future if they want
    req.user.currentApplicationId = undefined;
    await req.user.save();

    // Emit real-time WebSocket event for new submission
    const io = req.app.get('io');
    if (io) {
      io.emit('application_submitted', {
        applicationId: app.applicationId,
        _id: app._id,
        personal: app.personal,
        eligibility: app.eligibility,
        status: app.status,
        submittedAt: app.createdAt
      });
    }

    // Notify non-blocking
    notifyAll(app, 'APPLICATION_RECEIVED').catch(console.warn);

    res.json({ success: true, applicationId: app.applicationId, _id: app._id, fraudWarning: fraud.flagged });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications — Submit new application
router.post('/', async (req, res) => {
  try {
    const { personal, kyc, employmentType, salaried, selfEmployed, financial, consentGiven } = req.body;
    if (!personal?.name || !personal?.mobile || !personal?.email)
      return res.status(400).json({ error: 'Name, mobile, and email are required.' });

    // Fraud pre-check
    const fraud = await runFraudChecks({ panNumber: kyc?.panNumber, aadhaarNumber: kyc?.aadhaarNumber });

    const app = new Application({
      personal, kyc, employmentType,
      salaried:     employmentType === 'Salaried'      ? salaried    : undefined,
      selfEmployed: employmentType === 'Self-Employed' ? selfEmployed : undefined,
      financial,
      fraud:        { ...fraud, duplicatePan: !fraud.checks?.duplicatePan, duplicateAadhaar: !fraud.checks?.duplicateAadhaar },
      consentGiven, consentAt: consentGiven ? new Date() : undefined,
      status:       'Submitted',
      stage:        'Submitted',
      ipAddress:    req.ip,
      userAgent:    req.get('user-agent'),
      timeline:     [{ event: 'Application Submitted', description: 'Customer submitted via web portal' }],
    });
    await app.save();
    syncToGoogleSheets(app._id).catch(console.warn);

    // Emit real-time WebSocket event for new submission
    const io = req.app.get('io');
    if (io) {
      io.emit('application_submitted', {
        applicationId: app.applicationId,
        _id: app._id,
        personal: app.personal,
        eligibility: app.eligibility,
        status: app.status,
        submittedAt: app.createdAt
      });
    }

    // Non-blocking notifications
    notifyAll(app, 'APPLICATION_RECEIVED').catch(console.warn);

    res.status(201).json({ success: true, applicationId: app.applicationId, _id: app._id, fraudWarning: fraud.flagged });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications
router.get('/', authenticate, isStaff, async (req, res) => {
  try {
    const { status, empType, search, fraudFlag, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    if (status)             query.status = status;
    if (empType)            query.employmentType = empType;
    if (fraudFlag === 'true') query['fraud.flagged'] = true;
    if (search) {
      query.$or = [
        { 'personal.name':   { $regex: search, $options: 'i' } },
        { 'personal.mobile': { $regex: search } },
        { 'kyc.panNumber':   { $regex: search.toUpperCase() } },
        { applicationId:     { $regex: search, $options: 'i' } },
      ];
    }
    // Role-based filter: Sales Exec & Telecaller only see their assigned apps
    if (['Sales Executive','Telecaller'].includes(req.user.role)) {
      query.assignedTo = req.user._id;
    }

    const [total, data] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('assignedTo', 'name role staffId')
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
    ]);
    res.json({ success: true, total, page: +page, pages: Math.ceil(total / limit), data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/applications/:id
router.get('/:id', authenticate, isStaff, async (req, res) => {
  try {
    const app = await Application.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-f]{24}$/) ? req.params.id : null }, { applicationId: req.params.id }]
    }).populate('assignedTo','name role').populate('timeline.performedBy','name');
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    res.json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', authenticate, isManagerOrTL, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    // Supported enums for status
    const valid = [
      'Submitted', 'Under Review', 'KYC Verified', 'Approved', 'Rejected', 'Card Assigned',
      'New Lead', 'Documents Uploaded', 'KYC Pending', 'Under Verification', 'Pending Review',
      'Card Printed', 'Dispatched', 'Conditionally Approved'
    ];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status value.' });

    // Validate lifecycle transitions
    const appToCheck = await Application.findById(req.params.id);
    if (!appToCheck) return res.status(404).json({ error: 'Application not found.' });

    const current = appToCheck.status;
    const allowedTransitions = {
      'New Lead': ['Submitted', 'Under Review'],
      'Submitted': ['Under Review', 'Rejected'],
      'Under Review': ['KYC Verified', 'Rejected'],
      'KYC Verified': ['Approved', 'Rejected'],
      'Approved': ['Card Assigned'],
      'Rejected': ['Under Review'],
      'Card Assigned': []
    };

    if (allowedTransitions[current] && !allowedTransitions[current].includes(status) && current !== status) {
      return res.status(400).json({
        error: `Workflow Error: Transition from '${current}' to '${status}' is not allowed in standard banking lifecycle. Expected sequence: Submitted ➔ Under Review ➔ KYC Verified ➔ Approved/Rejected ➔ Card Assigned.`
      });
    }

    const app = await Application.findByIdAndUpdate(req.params.id, {
      status, rejectionReason, lastUpdatedBy: req.user._id,
      $push: { timeline: { event: `Status → ${status}`, description: rejectionReason, performedBy: req.user._id } },
    }, { new: true }).populate('assignedTo');

    if (!app) return res.status(404).json({ error: 'Application not found.' });

    syncToGoogleSheets(app._id).catch(console.warn);

    // Emit real-time status update to all connected dashboard users
    const io = req.app.get('io');
    if (io) {
      io.emit('application_status_updated', {
        id: app._id,
        applicationId: app.applicationId,
        status: app.status,
        rejectionReason: app.rejectionReason,
        lastUpdatedBy: req.user.name
      });
    }

    if (['Approved','Rejected'].includes(status)) {
      notifyAll({ ...app.toObject(), rejectionReason }, `APPLICATION_${status.toUpperCase()}`).catch(console.warn);
    }
    res.json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/applications/:id/notes
router.post('/:id/notes', authenticate, isStaff, async (req, res) => {
  try {
    const { note, followUpAt, followUpType, priority } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, {
      $push: { 'crm.notes': { note, addedBy: req.user._id } },
      'crm.followUpAt':   followUpAt,
      'crm.followUpType': followUpType,
      'crm.priority':     priority,
    }, { new: true });
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    syncToGoogleSheets(app._id).catch(console.warn);
    res.json({ success: true, crm: app.crm });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/applications/:id/assign
router.patch('/:id/assign', authenticate, isManagerOrTL, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const app = await Application.findByIdAndUpdate(req.params.id, {
      assignedTo, assignedAt: new Date(),
      $push: { timeline: { event: 'Assigned to team member', performedBy: req.user._id } },
    }, { new: true }).populate('assignedTo','name role');
    if (!app) return res.status(404).json({ error: 'Application not found.' });
    syncToGoogleSheets(app._id).catch(console.warn);
    res.json({ success: true, data: app });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/applications/:id  (Manager only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Manager') return res.status(403).json({ error: 'Only Managers can delete applications.' });
    await Application.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Application deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
