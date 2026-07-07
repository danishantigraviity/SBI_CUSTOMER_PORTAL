// ================================================================
//  Excel Export Service — ExcelJS
//  Generates professional Excel reports with formatting
// ================================================================

const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');

const HDR_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF0B1F45' } };
const HDR_FONT = { color:{ argb:'FFFFFFFF' }, bold:true, size:11, name:'Calibri' };
const BORDER   = { style:'thin', color:{ argb:'FFCBD5E1' } };
const ALL_BORDERS = { top:BORDER, left:BORDER, bottom:BORDER, right:BORDER };

function getColumnName(colIndex) {
  let colName = '';
  while (colIndex > 0) {
    let remainder = (colIndex - 1) % 26;
    colName = String.fromCharCode(65 + remainder) + colName;
    colIndex = Math.floor((colIndex - remainder) / 26);
  }
  return colName;
}

const STATUS_COLORS = {
  'Approved':          'FFD1FAE5',
  'Rejected':          'FFFEE2E2',
  'Under Verification':'FFDBEAFE',
  'Pending Review':    'FFFEF3C7',
  'New Lead':          'FFF8FAFC',
  'Conditionally Approved':'FFFEF3C7',
  'Card Printed':      'FFEDE9FE',
  'Dispatched':        'FFCCFBF1',
};

async function generateApplicationReport(applications, options = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'SBI Credit Card System';
  wb.created  = new Date();
  wb.modified = new Date();
  wb.company  = 'State Bank of India';

  // ── Sheet 1: Applications ────────────────────────────────────
  const ws = wb.addWorksheet('Applications', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    headerFooter: { firstHeader: 'SBI Credit Card Applications Report', firstFooter: '&P of &N' },
  });

  const columns = [
    { key:'applicationId',   header:'App ID',             width:18 },
    { key:'name',            header:'Customer Name',       width:22 },
    { key:'fatherName',      header:"Father's Name",       width:22 },
    { key:'motherName',      header:"Mother's Name",       width:22 },
    { key:'mobile',          header:'Mobile',              width:14 },
    { key:'email',           header:'Email',               width:28 },
    { key:'pan',             header:'PAN Number',          width:14 },
    { key:'aadhaar',         header:'Aadhaar (Masked)',    width:18 },
    { key:'dob',             header:'Date of Birth',       width:14 },
    { key:'gender',          header:'Gender',              width:10 },
    { key:'city',            header:'City',                width:14 },
    { key:'state',           header:'State',               width:16 },
    { key:'pincode',         header:'Pincode',             width:10 },
    { key:'empType',         header:'Employment Type',     width:16 },
    { key:'company',         header:'Company / Business',  width:26 },
    { key:'designation',     header:'Designation',         width:20 },
    { key:'salary',          header:'Monthly Income (₹)',  width:18 },
    { key:'experience',      header:'Experience (Yrs)',    width:16 },
    { key:'avgBalance',      header:'Avg Bank Balance (₹)',width:20 },
    { key:'eligScore',       header:'Elig. Score',         width:13 },
    { key:'card',            header:'Recommended Card',    width:22 },
    { key:'creditLimit',     header:'Credit Limit',        width:18 },
    { key:'status',          header:'Application Status',  width:22 },
    { key:'fraudFlag',       header:'Fraud Flag',          width:12 },
    { key:'assignedTo',      header:'Assigned To',         width:18 },
    { key:'source',          header:'Lead Source',         width:14 },
    { key:'submittedAt',     header:'Submitted At',        width:20 },
  ];
  ws.columns = columns;

  // Style header
  const hRow = ws.getRow(1);
  hRow.eachCell(cell => {
    cell.fill      = HDR_FILL;
    cell.font      = HDR_FONT;
    cell.border    = ALL_BORDERS;
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
  });
  hRow.height = 32;

  // Data rows
  applications.forEach((app, idx) => {
    const sal = app.salaried?.monthlySalary || Math.round((app.selfEmployed?.annualTurnover || 0) / 12);
    const row = ws.addRow({
      applicationId: app.applicationId,
      name:          app.personal?.name,
      fatherName:    app.personal?.fatherName || '—',
      motherName:    app.personal?.motherName || '—',
      mobile:        app.personal?.mobile,
      email:         app.personal?.email,
      pan:           app.kyc?.panNumber || '—',
      aadhaar:       app.kyc?.aadhaarNumber || '—',
      dob:           app.personal?.dob ? new Date(app.personal.dob).toLocaleDateString('en-IN') : '—',
      gender:        app.personal?.gender || '—',
      city:          app.personal?.city   || '—',
      state:         app.personal?.state  || '—',
      pincode:       app.personal?.pincode|| '—',
      empType:       app.employmentType,
      company:       app.salaried?.companyName || app.selfEmployed?.businessName || '—',
      designation:   app.salaried?.designation || app.selfEmployed?.businessType || '—',
      salary:        sal,
      experience:    app.salaried?.workExpYears || app.selfEmployed?.businessYears || 0,
      avgBalance:    app.financial?.avgBankBalance || 0,
      eligScore:     app.eligibility?.score || 0,
      card:          app.eligibility?.recommendedCard || '—',
      creditLimit:   app.eligibility?.creditLimit || '—',
      status:        app.status,
      fraudFlag:     app.fraud?.flagged ? '⚠️ FLAGGED' : '✅ Clean',
      assignedTo:    app.assignedTo?.name || '—',
      source:        app.crm?.source || 'Online',
      submittedAt:   new Date(app.submittedAt || app.createdAt).toLocaleString('en-IN'),
    });

    const bg = STATUS_COLORS[app.status] || (idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');
    row.eachCell(cell => {
      cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb: bg } };
      cell.border    = ALL_BORDERS;
      cell.alignment = { vertical:'middle' };
    });
    row.height = 20;

    // Score cell colour
    const scoreCell = row.getCell('eligScore');
    const s = app.eligibility?.score || 0;
    scoreCell.font = { bold:true, color:{ argb: s >= 80 ? 'FF059669' : s >= 65 ? 'FFCA8A04' : 'FFDC2626' } };

    // Fraud cell
    if (app.fraud?.flagged) {
      row.getCell('fraudFlag').font = { bold:true, color:{ argb:'FFDC2626' } };
    }
  });

  ws.autoFilter = { from:'A1', to:`${getColumnName(columns.length)}1` };
  ws.views = [{ state:'frozen', ySplit:1 }];

  // ── Sheet 2: Summary ─────────────────────────────────────────
  const ws2 = wb.addWorksheet('Summary Dashboard');
  const total    = applications.length;
  const approved = applications.filter(a => a.status === 'Approved').length;
  const rejected = applications.filter(a => a.status === 'Rejected').length;
  const pending  = applications.filter(a => ['Pending Review','Under Verification','KYC Pending'].includes(a.status)).length;
  const fraud    = applications.filter(a => a.fraud?.flagged).length;
  const salaried = applications.filter(a => a.employmentType === 'Salaried').length;
  const avgScore = total ? Math.round(applications.reduce((s,a) => s+(a.eligibility?.score||0),0)/total) : 0;
  const avgSal   = total ? Math.round(applications.reduce((s,a) => s+(a.salaried?.monthlySalary||Math.round((a.selfEmployed?.annualTurnover||0)/12)),0)/total) : 0;

  const summaryRows = [
    ['SBI Credit Card Application Report', '', ''],
    ['Generated On:', new Date().toLocaleString('en-IN'), ''],
    ['', '', ''],
    ['METRIC', 'COUNT', 'PERCENTAGE'],
    ['Total Applications',      total,    '100%'],
    ['Approved',                approved, `${total ? ((approved/total)*100).toFixed(1) : 0}%`],
    ['Rejected',                rejected, `${total ? ((rejected/total)*100).toFixed(1) : 0}%`],
    ['Pending / Under Review',  pending,  `${total ? ((pending/total)*100).toFixed(1)  : 0}%`],
    ['Fraud Flagged',           fraud,    `${total ? ((fraud/total)*100).toFixed(1)    : 0}%`],
    ['Salaried Applicants',     salaried, `${total ? ((salaried/total)*100).toFixed(1) : 0}%`],
    ['Self-Employed Applicants',total - salaried, `${total ? (((total-salaried)/total)*100).toFixed(1) : 0}%`],
    ['Average Eligibility Score', avgScore, '/ 100'],
    ['Average Monthly Income',  `₹${avgSal.toLocaleString('en-IN')}`, ''],
  ];

  summaryRows.forEach((row, i) => {
    const r = ws2.addRow(row);
    if (i === 0) { r.font = { bold:true, size:14, color:{ argb:'FF0B1F45' } }; r.height = 26; }
    if (i === 3) { r.eachCell(c => { c.fill = HDR_FILL; c.font = HDR_FONT; c.border = ALL_BORDERS; }); r.height = 24; }
    if (i > 3)   { r.eachCell(c => { c.border = ALL_BORDERS; c.alignment = { vertical:'middle' }; }); }
  });
  ws2.getColumn(1).width = 30;
  ws2.getColumn(2).width = 18;
  ws2.getColumn(3).width = 14;

  // ── Sheet 3: Card Distribution ───────────────────────────────
  const ws3 = wb.addWorksheet('Card Distribution');
  ws3.addRow(['Card Name', 'Applications', 'Percentage']).eachCell(c => { c.fill=HDR_FILL; c.font=HDR_FONT; c.border=ALL_BORDERS; });
  const cardMap = {};
  applications.forEach(a => {
    const c = a.eligibility?.recommendedCard || 'Unknown';
    cardMap[c] = (cardMap[c] || 0) + 1;
  });
  Object.entries(cardMap).sort((a,b) => b[1]-a[1]).forEach(([card, count]) => {
    ws3.addRow([card, count, `${((count/total)*100).toFixed(1)}%`])
      .eachCell(c => { c.border=ALL_BORDERS; });
  });
  ws3.getColumn(1).width = 24; ws3.getColumn(2).width = 16; ws3.getColumn(3).width = 14;

  // ── Save ──────────────────────────────────────────────────────
  const dir  = path.join(__dirname, '../../reports');
  fs.mkdirSync(dir, { recursive:true });
  const filename = `SBI_Applications_${new Date().toISOString().slice(0,10)}_${Date.now()}.xlsx`;
  const filepath = path.join(dir, filename);
  await wb.xlsx.writeFile(filepath);
  return { filepath, filename };
}

module.exports = { generateApplicationReport };
