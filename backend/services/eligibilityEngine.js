// ================================================================
//  Eligibility Engine — SBI Credit Card Smart Scoring
// ================================================================

const { parseDate } = require('../utils/dateParser');

const CARD_CATALOGUE = [
  { id:'elite',    name:'SBI Elite',       minSalary:75000,  annual:4999,  category:'Premium',  limit:[500000,1000000] },
  { id:'prime',    name:'SBI Prime',       minSalary:60000,  annual:2999,  category:'Premium',  limit:[300000,700000]  },
  { id:'cashback', name:'SBI Cashback',    minSalary:40000,  annual:999,   category:'Cashback', limit:[200000,500000]  },
  { id:'irctc',    name:'IRCTC SBI Card',  minSalary:35000,  annual:1499,  category:'Co-brand', limit:[150000,400000]  },
  { id:'savecash', name:'SimplySAVE',      minSalary:25000,  annual:499,   category:'Entry',    limit:[50000,200000]   },
  { id:'business', name:'Business Credit', minSalary:150000, annual:3499,  category:'Business', limit:[1000000,2500000]},
];

const SERVICEABLE = ['110','400','500','600','560','302','380','700','411','226','440','641','682','160','800','462','521','530','695','201'];

function runEligibility({ salary = 0, dob, empType = 'Salaried', experience = 0, pincode = '', financial = {} }) {
  let score = 0;
  const reasons = [], positives = [];

  // ── Income (35 pts) ─────────────────────────────────────────
  if      (salary >= 150000) { score += 35; positives.push('Exceptional income (₹1.5L+/mo)'); }
  else if (salary >= 100000) { score += 32; positives.push('Excellent income (₹1L+/mo)'); }
  else if (salary >= 75000)  { score += 28; positives.push('Strong income (₹75K+/mo)'); }
  else if (salary >= 60000)  { score += 23; positives.push('Good income (₹60K+/mo)'); }
  else if (salary >= 40000)  { score += 17; }
  else if (salary >= 25000)  { score += 10; }
  else { reasons.push('Salary below minimum ₹25,000/month'); }

  // ── Age (20 pts) ─────────────────────────────────────────────
  const parsedDob = parseDate(dob);
  const age = parsedDob ? new Date().getFullYear() - parsedDob.getFullYear() : 32;
  if      (age >= 25 && age <= 45) { score += 20; positives.push('Prime age bracket (25–45)'); }
  else if (age >= 21 && age <  25) { score += 14; }
  else if (age >  45 && age <= 55) { score += 16; }
  else if (age >  55 && age <= 60) { score += 10; }
  else if (age <  21) { reasons.push('Age below 21 — not eligible'); }
  else                { reasons.push('Age above 60 — requires manual approval'); }

  // ── Experience (15 pts) ──────────────────────────────────────
  const exp = parseInt(experience) || 0;
  if      (exp >= 7) { score += 15; positives.push('Strong tenure (7+ yrs)'); }
  else if (exp >= 5) { score += 13; positives.push('Good experience (5+ yrs)'); }
  else if (exp >= 3) { score += 10; }
  else if (exp >= 1) { score += 6; }
  else { reasons.push('Under 1 year experience — higher risk category'); }

  // ── Location (10 pts) ────────────────────────────────────────
  if (SERVICEABLE.some(p => pincode.startsWith(p))) { score += 10; positives.push('Fully serviceable pincode'); }
  else { score += 4; reasons.push('Limited card delivery serviceability'); }

  // ── Employment (10 pts) ──────────────────────────────────────
  if (empType === 'Salaried') { score += 10; positives.push('Salaried — stable income profile'); }
  else { score += 7; }

  // ── Bank Balance Bonus (10 pts) ──────────────────────────────
  const bal = financial.avgBankBalance || 0;
  if      (bal >= 100000) { score += 10; positives.push('Strong bank balance (₹1L+)'); }
  else if (bal >= 50000)  { score += 7; }
  else if (bal >= 20000)  { score += 4; }

  // ── Decision ─────────────────────────────────────────────────
  let status;
  if      (score >= 80) status = 'Approved';
  else if (score >= 65) status = 'Conditionally Approved';
  else if (score >= 50) status = 'Requires Review';
  else                { status = 'Rejected'; reasons.push('Score below minimum threshold (50)'); }

  // ── Card recommendation ──────────────────────────────────────
  let card;
  if (status === 'Requires Review') {
    card = 'SimplySAVE'; // Force entry-level card for moderate profiles
  } else if (empType === 'Self-Employed' && salary >= 150000) {
    card = 'Business Credit';
  } else {
    const eligible = CARD_CATALOGUE
      .filter(c => c.id !== 'business' && c.minSalary <= salary)
      .sort((a, b) => b.minSalary - a.minSalary);
    card = eligible[0]?.name || 'SimplySAVE';
  }

  // ── Credit limit ─────────────────────────────────────────────
  let creditLimit;
  if (status === 'Requires Review') {
    creditLimit = '₹20,000';
  } else {
    const base     = Math.min(salary * 3, 2500000);
    const limitLow = Math.round(base * 0.8 / 10000) * 10000;
    const limitHigh= Math.round(base * 1.2 / 10000) * 10000;
    creditLimit = `₹${(limitLow/100000).toFixed(1)}L – ₹${(limitHigh/100000).toFixed(1)}L`;
  }

  return { score, status, card, creditLimit, age, exp, reasons, positives, checkedAt: new Date() };
}

module.exports = { runEligibility, CARD_CATALOGUE };
