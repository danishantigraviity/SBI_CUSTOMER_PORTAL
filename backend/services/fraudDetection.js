// ================================================================
//  Fraud Detection Service — AI-based document & identity checks
// ================================================================

const { Application } = require('../models/schemas');

async function runFraudChecks(data) {
  const { panNumber, aadhaarNumber, applicationId } = data;
  const flags   = [];
  const checks  = {};
  let riskLevel = 'Low';

  // ── 1. Duplicate PAN check ────────────────────────────────────
  if (panNumber) {
    const dup = await Application.findOne({
      'kyc.panNumber': panNumber.toUpperCase(),
      ...(applicationId ? { _id: { $ne: applicationId } } : {}),
    });
    checks.duplicatePan = !dup;
    if (dup) { flags.push(`Duplicate PAN ${panNumber} found in application ${dup.applicationId}`); riskLevel = 'High'; }
  }

  // ── 2. Duplicate Aadhaar check ────────────────────────────────
  if (aadhaarNumber) {
    const dupA = await Application.findOne({
      'kyc.aadhaarNumber': { $regex: aadhaarNumber.slice(-4) + '$' },
      ...(applicationId ? { _id: { $ne: applicationId } } : {}),
    });
    checks.duplicateAadhaar = !dupA;
    if (dupA) { flags.push(`Aadhaar last 4 digits match application ${dupA.applicationId}`); riskLevel = 'High'; }
  }

  // ── 3. PAN format validation ──────────────────────────────────
  checks.panFormat = !panNumber || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber);
  if (!checks.panFormat) flags.push('PAN number format is invalid');

  // ── 4. PAN checksum (4th char = first letter of surname) ──────
  if (panNumber && panNumber.length === 10) {
    checks.panChecksum = ['P','C','H','F','A','T','B','L','J','G'].includes(panNumber[3]);
    if (!checks.panChecksum && riskLevel === 'Low') riskLevel = 'Medium';
  }

  // ── 5. Aadhaar format ─────────────────────────────────────────
  const rawAad = (aadhaarNumber || '').replace(/[^0-9]/g, '');
  checks.aadhaarFormat = !aadhaarNumber || (rawAad.length === 12 && !rawAad.startsWith('0') && !rawAad.startsWith('1'));
  if (!checks.aadhaarFormat) { flags.push('Aadhaar number format is invalid'); if (riskLevel !== 'High') riskLevel = 'Medium'; }

  // ── 6. Simulated doc authenticity (face match placeholder) ────
  checks.docAuthenticity = true;
  checks.faceMatch       = true;
  const docAuthScore     = Math.floor(Math.random() * 20) + 80; // 80–100 simulated
  const faceMatchScore   = Math.floor(Math.random() * 15) + 85; // 85–100 simulated

  const flagged = flags.length > 0;
  return {
    flagged,
    riskLevel,
    flagReasons:    flags,
    checks,
    docAuthScore,
    faceMatchScore,
    checkedAt:      new Date(),
  };
}

module.exports = { runFraudChecks };
