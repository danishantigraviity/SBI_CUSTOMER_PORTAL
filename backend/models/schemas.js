// ================================================================
//  MongoDB Schemas — SBI Credit Card Onboarding System
// ================================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Schema } = mongoose;

// ── 1. Admin / Staff User ────────────────────────────────────────
const AdminUserSchema = new Schema({
  staffId:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 8, select: false },
  role:        { type: String, enum: ['Manager','Team Leader','Sales Executive','Telecaller','Risk Analyst'], required: true },
  branch:      { type: String, default: 'HO' },
  mobile:      { type: String },
  isActive:    { type: Boolean, default: true },
  lastLogin:   { type: Date },
  permissions: [String],
  createdBy:   { type: Schema.Types.ObjectId, ref: 'AdminUser' },
}, { timestamps: true });

AdminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
AdminUserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

// ── 2. Document Sub-Schema ───────────────────────────────────────
const DocumentSchema = new Schema({
  docType:      { type: String, enum: ['pan','aadhaar','payslip','bankStatement','employeeId','itr','gstCertificate','businessReg','businessRegistration','photo'] },
  fileName:     String,
  originalName: String,
  filePath:     String,
  fileSize:     Number,
  mimeType:     String,
  uploadedAt:   { type: Date, default: Date.now },
  driveLink:    String,
  ocrExtracted: Schema.Types.Mixed,
  isVerified:   { type: Boolean, default: false },
  verifiedBy:   { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  verifiedAt:   Date,
  verifyNote:   String,
});

// ── 3. Timeline Sub-Schema ───────────────────────────────────────
const TimelineSchema = new Schema({
  event:       { type: String, required: true },
  description: String,
  performedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  timestamp:   { type: Date, default: Date.now },
  metadata:    Schema.Types.Mixed,
});

// ── 4. Application Schema ────────────────────────────────────────
const ApplicationSchema = new Schema({
  applicationId: { type: String, unique: true },

  // Personal
  personal: {
    name:    { type: String, required: true, trim: true },
    mobile:  { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true },
    dob:     Date,
    age:     Number,
    gender:  { type: String, enum: ['Male','Female','Other'] },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    address: String,
    pincode: String,
    city:    String,
    state:   String,
    country: { type: String, default: 'India' },
  },

  // KYC
  kyc: {
    panNumber:       { type: String, uppercase: true },
    aadhaarNumber:   String,
    panVerified:     { type: Boolean, default: false },
    aadhaarVerified: { type: Boolean, default: false },
    nameMatchScore:  Number,
    nameMismatch:    { type: Boolean, default: false },
    faceImagePath:   String,
  },

  // Employment
  employmentType: { type: String, enum: ['Salaried','Self-Employed'], default: 'Salaried' },
  salaried: {
    companyName:  String,
    designation:  String,
    employeeId:   String,
    monthlySalary:Number,
    workExpYears: Number,
    officePincode:String,
    hrEmail:      String,
  },
  selfEmployed: {
    businessName:   String,
    businessType:   { type: String, enum: ['Proprietorship','Partnership','Private Limited','LLP','OPC','Other'] },
    gstNumber:      String,
    annualTurnover: Number,
    businessYears:  Number,
    udyamNumber:    String,
  },

  // Financial (OCR extracted)
  financial: {
    avgBankBalance:      Number,
    monthlyCredits:      Number,
    monthlyDebits:       Number,
    bankName:            String,
    ifscCode:            String,
    accountType:         String,
    salaryFromStatement: Number,
    gstTurnover:         Number,
  },

  // Eligibility
  eligibility: {
    score:          Number,
    status:         { type: String, enum: ['Approved','Conditionally Approved','Requires Review','Rejected'] },
    recommendedCard:String,
    creditLimit:    String,
    reasons:        [String],
    positives:      [String],
    age:            Number,
    exp:            Number,
    checkedAt:      Date,
  },

  // Application Status
  status: {
    type: String,
    enum: [
      'New Lead',
      'Submitted',
      'Under Review',
      'KYC Verified',
      'Approved',
      'Rejected',
      'Card Assigned',
      'Documents Uploaded',
      'KYC Pending',
      'Under Verification',
      'Pending Review',
      'Card Printed',
      'Dispatched',
      'Conditionally Approved'
    ],
    default: 'New Lead',
  },
  stage:           String,
  rejectionReason: String,

  // Assignment
  assignedTo: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  assignedAt: Date,

  // Documents
  documents: [DocumentSchema],

  // Fraud
  fraud: {
    flagged:          { type: Boolean, default: false },
    duplicatePan:     { type: Boolean, default: false },
    duplicateAadhaar: { type: Boolean, default: false },
    faceMatchScore:   Number,
    docAuthScore:     Number,
    riskLevel:        { type: String, enum: ['Low','Medium','High'], default: 'Low' },
    flagReasons:      [String],
    reviewedBy:       { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    reviewedAt:       Date,
  },

  // QD Profile
  qd: {
    generated:   { type: Boolean, default: false },
    generatedAt: Date,
    pdfPath:     String,
    summary:     String,
  },

  // CRM
  crm: {
    notes:       [{ note: String, addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }, addedAt: { type: Date, default: Date.now } }],
    followUpAt:  Date,
    followUpType:{ type: String, enum: ['Call','WhatsApp','Email','Meeting','SMS'] },
    priority:    { type: String, enum: ['High','Medium','Low'], default: 'Medium' },
    source:      { type: String, enum: ['Walk-in','Online','Telecall','Referral','WhatsApp','Email','Agent','Branch'], default: 'Online' },
  },

  // Notifications
  notifications: [{
    type:     { type: String, enum: ['WhatsApp','Email','SMS','Push'] },
    template: String,
    sentAt:   { type: Date, default: Date.now },
    status:   { type: String, enum: ['sent','failed','pending'], default: 'pending' },
  }],

  // Timeline
  timeline: [TimelineSchema],

  // Consent & Audit
  consentGiven: { type: Boolean, default: false },
  consentAt:    Date,
  ipAddress:    String,
  userAgent:    String,
  submittedAt:  { type: Date, default: Date.now },
  lastUpdatedBy:{ type: Schema.Types.ObjectId, ref: 'AdminUser' },
  excelRowNo:   Number,
  googleSheetSynced: { type: Boolean, default: false },
  googleSheetRow:   Number,
}, { timestamps: true });

// Auto-generate applicationId
ApplicationSchema.pre('save', async function(next) {
  if (!this.applicationId) {
    const year  = new Date().getFullYear();
    const count = await mongoose.model('Application').countDocuments();
    this.applicationId = `SBI-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.personal?.dob) {
    this.personal.age = new Date().getFullYear() - new Date(this.personal.dob).getFullYear();
  }
  next();
});

// ── 5. Customer Schema ───────────────────────────────────────────
const CustomerSchema = new Schema({
  name:                 { type: String, required: true, trim: true },
  mobile:               { type: String, required: true, unique: true, trim: true },
  email:                { type: String, lowercase: true, trim: true },
  currentApplicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  sessionCount:         { type: Number, default: 0 },
  lastLogin:            Date,
}, { timestamps: true });

// ── 6. Lead Schema ───────────────────────────────────────────────
const LeadSchema = new Schema({
  name:        { type: String, required: true },
  mobile:      { type: String, required: true },
  email:       String,
  source:      { type: String, enum: ['Walk-in','Online','Telecall','Referral','WhatsApp','Email','Agent','Branch'], default: 'Online' },
  status:      { type: String, enum: ['New','Contacted','Interested','Not Interested','Converted','Lost'], default: 'New' },
  priority:    { type: String, enum: ['High','Medium','Low'], default: 'Medium' },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  followUpAt:  Date,
  notes:       [{ text: String, addedAt: { type: Date, default: Date.now } }],
  convertedTo: { type: Schema.Types.ObjectId, ref: 'Application' },
}, { timestamps: true });

// ── 6. Audit Log Schema ──────────────────────────────────────────
const AuditLogSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  action:    { type: String, required: true },
  resource:  String,
  resourceId:String,
  details:   Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

// ── 7. Notification Template ─────────────────────────────────────
const NotificationTemplateSchema = new Schema({
  name:      { type: String, required: true, unique: true },
  type:      { type: String, enum: ['WhatsApp','Email','SMS'] },
  subject:   String,
  body:      { type: String, required: true },
  variables: [String],
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = {
  AdminUser:             mongoose.model('AdminUser',            AdminUserSchema),
  Application:           mongoose.model('Application',          ApplicationSchema),
  Lead:                  mongoose.model('Lead',                 LeadSchema),
  AuditLog:              mongoose.model('AuditLog',             AuditLogSchema),
  NotificationTemplate:  mongoose.model('NotificationTemplate', NotificationTemplateSchema),
  Customer:              mongoose.model('Customer',             CustomerSchema),
};
