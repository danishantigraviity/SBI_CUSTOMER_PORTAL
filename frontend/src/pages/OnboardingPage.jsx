import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, EyeOff, Search, Bell, LogOut, Compass, CreditCard, TrendingUp, 
  Briefcase, HelpCircle, AlertCircle, Globe, ChevronLeft, ChevronRight, RefreshCw, 
  Layers, Shield, PhoneCall, Settings, ArrowUpRight, ArrowDownLeft,
  User, Check, Info, FileText, Upload, Plus, Menu, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { Btn, Card, Grid, Input, Select, Textarea, Divider, SectionTitle,
         NotifBox, UploadZone, DatePicker, CreditCardVisual, ProgressBar } from '../components/shared/UI';
import { getMyDraft, createDraft, updateDraft, finalizeApplication, uploadKYCDocs, uploadEmploymentDocs, checkEligibility } from '../services/api';

// ── Constants ─────────────────────────────────────────────────────
const STEPS = ['Personal Info','KYC Upload','Employment','Eligibility','Review & Submit'];

const DASHBOARD_SLIDES = [
  {
    id: 'elite',
    cardName: 'SBI Elite Card',
    cardImg: '/sbi_elite.png',
    accountNo: '30489211054',
    accountType: 'Savings Account - SBI Privilege',
    balance: '₹3,59,200.65',
    availableLimit: '₹5,00,000.00',
    transactions: [
      { id: 1, type: 'debit', desc: 'Amazon Web Services Invoices', date: '19 May 2026', amount: 8490.50 },
      { id: 2, type: 'credit', desc: 'Salary NEFT Credit - SBI Corp', date: '01 May 2026', amount: 125000.00 },
      { id: 3, type: 'debit', desc: 'Starbucks Coffee Koramangala', date: '28 Apr 2026', amount: 480.00 }
    ],
    notifications: [
      { id: 1, text: 'Your monthly credit statement for April 2026 is ready.', linkText: 'Download PDF' },
      { id: 2, text: 'Enable international usage on your SBI Elite card for exclusive rewards.' }
    ],
    quickActions: [
      { label: 'Pay Bill', icon: '💸' },
      { label: 'Statements', icon: '📊' },
      { label: 'Block Card', icon: '🔒' }
    ]
  },
  {
    id: 'aurum',
    cardName: 'SBI Aurum Card',
    cardImg: '/sbi_aurum.png',
    accountNo: '30994827110',
    accountType: 'Current Account - SBI Wealth Signature',
    balance: '₹12,85,400.00',
    availableLimit: '₹10,00,000.00',
    transactions: [
      { id: 1, type: 'credit', desc: 'Dividend Payment - HDFC Mutual Fund', date: '18 May 2026', amount: 45000.00 },
      { id: 2, type: 'debit', desc: 'Taj Hotels Resorts Booking Mumbai', date: '15 May 2026', amount: 88500.00 },
      { id: 3, type: 'debit', desc: 'Uber India Premium Ride', date: '14 May 2026', amount: 2450.00 }
    ],
    notifications: [
      { id: 1, text: 'Complimentary Golf session booked at DLF Golf Club.', linkText: 'View Details' },
      { id: 2, text: 'Upgrade limit on your SBI Aurum card to ₹15,00,000 now.' }
    ],
    quickActions: [
      { label: 'Aurum Club', icon: '🥂' },
      { label: 'Golf Booking', icon: '⛳' },
      { label: 'Limit Upgrade', icon: '⚡' }
    ]
  },
  {
    id: 'miles',
    cardName: 'SBI Miles Elite Card',
    cardImg: '/sbi_miles.png',
    accountNo: '30784920115',
    accountType: 'Savings Account - SBI Premium Voyage',
    balance: '₹5,45,000.50',
    availableLimit: '₹3,50,000.00',
    transactions: [
      { id: 1, type: 'debit', desc: 'Air India Online Ticket Booking', date: '19 May 2026', amount: 24800.00 },
      { id: 2, type: 'credit', desc: 'Miles Conversion Credit - Air India', date: '10 May 2026', amount: 5000.00 },
      { id: 3, type: 'debit', desc: 'Duty Free Shop IGIA T3 Delhi', date: '08 May 2026', amount: 12400.00 }
    ],
    notifications: [
      { id: 1, text: 'Earn 10,000 bonus travel miles on your next international spend.', linkText: 'Activate Offer' },
      { id: 2, text: 'Complimentary airport lounge access voucher is ready.' }
    ],
    quickActions: [
      { label: 'Book Flight', icon: '✈️' },
      { label: 'Travel Insure', icon: '🛡️' },
      { label: 'Miles Balance', icon: '🪙' }
    ]
  },
  {
    id: 'apex',
    cardName: 'SBI Singapore Airlines KrisFlyer Apex',
    cardImg: '/sbi_apex.png',
    accountNo: '30114829302',
    accountType: 'Savings Account - SBI Global Privilege',
    balance: '₹8,12,350.25',
    availableLimit: '₹7,50,000.00',
    transactions: [
      { id: 1, type: 'debit', desc: 'Singapore Airlines Flight SG-12', date: '17 May 2026', amount: 62400.00 },
      { id: 2, type: 'debit', desc: 'Marina Bay Sands Singapore Stay', date: '16 May 2026', amount: 110500.00 },
      { id: 3, type: 'credit', desc: 'KrisFlyer Milestone Point Bonus', date: '12 May 2026', amount: 15000.00 }
    ],
    notifications: [
      { id: 1, text: 'Exclusive fast-track to KrisFlyer Gold status available.', linkText: 'Opt-in Now' },
      { id: 2, text: 'Enjoy double reward miles on all Singapore dining merchants.' }
    ],
    quickActions: [
      { label: 'KrisFlyer Shop', icon: '🛍️' },
      { label: 'Lounge Pass', icon: '🎫' },
      { label: 'Convert Points', icon: '🔄' }
    ]
  }
];

const CARDS_DB = [
  { id:'elite',    name:'SBI Elite',       icon:'👑', annual:'₹4,999', minSal:75000,  color:'#1a1a2e', color2:'#0f3460',
    features:['5X Rewards on Dining','Airport Lounge Access (8/yr)','Golf Privileges','Fuel Waiver','Welcome Benefit ₹5,000'] },
  { id:'prime',    name:'SBI Prime',       icon:'⭐', annual:'₹2,999', minSal:60000,  color:'#2d1b69', color2:'#11998e',
    features:['3X Reward Points','Movie Tickets (2/mo)','Milestone Bonus 20K pts','Complimentary Insurance','EMI on Purchases'] },
  { id:'cashback', name:'SBI Cashback',    icon:'💰', annual:'₹999',   minSal:40000,  color:'#134e5e', color2:'#71b280',
    features:['5% Cashback Online','1.5% on All Spends','No Joining Fee Year 1','Zero Lost Card Liability','Instant Cashback'] },
  { id:'irctc',    name:'IRCTC SBI Card',  icon:'🚂', annual:'₹1,499', minSal:35000,  color:'#1c3a5e', color2:'#0b6e4f',
    features:['10% Value Back IRCTC','Train Ticket Insurance','Railway Lounge Access','Fuel Waiver','350 Bonus Points'] },
  { id:'savecash', name:'SimplySAVE',      icon:'💳', annual:'₹499',   minSal:25000,  color:'#0f2027', color2:'#2c5364',
    features:['10X Points Dining/Movies','Grocery Rewards 1.25%','Fuel Surcharge Waiver','Annual Fee Reversal','Contactless Pay'] },
  { id:'business', name:'Business Credit', icon:'🏢', annual:'₹3,499', minSal:150000, color:'#2c2c54', color2:'#474787',
    features:['Dedicated RM','GST Invoice Management','Expense Dashboard','5 Employee Add-on Cards','Priority Support'] },
];

const TRANSACTIONS = [
  { id: 1, type: 'debit', desc: 'UPI/DR/328240908978/Bruhat Bangalore Mahanagara Palike', date: '12 Sep 2023', amount: 26770.00, balance: 332430.65 },
  { id: 2, type: 'credit', desc: 'UPI/CR/328089157847/PRAMIL SHARMA', date: '11 Sep 2023', amount: 4200.00, balance: 359200.65 },
  { id: 3, type: 'debit', desc: 'UPI/DR/326543484071/Zomato Online Delivery', date: '11 Sep 2023', amount: 670.33, balance: 355000.65 },
  { id: 4, type: 'debit', desc: 'ATM/WDL/41234908912/SBI ATM Koramangala', date: '09 Sep 2023', amount: 10000.00, balance: 355670.98 },
  { id: 5, type: 'credit', desc: 'INT/CR/SBI-SAVINGS-INTEREST-Q2', date: '05 Sep 2023', amount: 1850.50, balance: 365670.98 }
];

const EXPENSE_DATA = [
  { name: 'Jan', amount: 24000 },
  { name: 'Feb', amount: 35000 },
  { name: 'Mar', amount: 46000 },
  { name: 'Apr', amount: 28000 },
  { name: 'May', amount: 34000 },
  { name: 'Jun', amount: 31000 },
  { name: 'Jul', amount: 27000 },
  { name: 'Aug', amount: 39000 },
  { name: 'Sep', amount: 25000 },
  { name: 'Oct', amount: 29000 }
];

// ── Eligibility engine (client-side preview) ─────────────────────
function computeEligibility(fd) {
  const sal = parseInt(fd.salary || 0);
  const age = fd.dob ? new Date().getFullYear() - new Date(fd.dob).getFullYear() : 30;
  const exp = parseInt(fd.experience || 0);
  const pin = fd.pincode || '';
  let score = 0; const reasons = [], positives = [];
  const serviced = ['110','400','500','600','560','302','380','700','411','226'].some(p => pin.startsWith(p));

  if (sal>=150000){score+=35;positives.push('Exceptional income (₹1.5L+/mo)');}
  else if (sal>=100000){score+=32;positives.push('Excellent income (₹1L+/mo)');}
  else if (sal>=75000) {score+=28;positives.push('Strong income (₹75K+/mo)');}
  else if (sal>=60000) {score+=23;positives.push('Good income (₹60K+/mo)');}
  else if (sal>=40000) {score+=17;}
  else if (sal>=25000) {score+=10;}
  else {reasons.push('Salary below minimum ₹25,000/month');}

  if (age>=25&&age<=45){score+=20;positives.push('Prime age bracket (25–45)');}
  else if (age>=21&&age<25) {score+=14;}
  else if (age>45&&age<=55) {score+=16;}
  else if (age>55&&age<=60) {score+=10;}
  else {reasons.push('Age not within eligible range (21–60)');}

  if (exp>=7){score+=15;positives.push('Strong work tenure (7+ yrs)');}
  else if (exp>=5){score+=13;}
  else if (exp>=3){score+=10;}
  else if (exp>=1){score+=6;}
  else {reasons.push('Less than 1 year experience');}

  if (serviced){score+=10;positives.push('Fully serviceable location');}
  else{score+=4;reasons.push('Limited serviceability in this pincode');}

  if (fd.empType==='Salaried'){score+=10;positives.push('Salaried — stable income');}
  else{score+=7;}

  let status = score>=80?'Approved':score>=65?'Conditionally Approved':score>=50?'Requires Review':'Rejected';
  let card;
  if (fd.empType==='Self-Employed'&&sal>=150000) card='Business Credit';
  else if (sal>=75000)  card='SBI Elite';
  else if (sal>=60000)  card='SBI Prime';
  else if (sal>=40000)  card='SBI Cashback';
  else if (sal>=35000)  card='IRCTC SBI Card';
  else                  card='SimplySAVE';

  const lo = Math.round(sal*2.5/10000)*10000;
  const hi = Math.round(sal*3.5/10000)*10000;
  const creditLimit = `₹${(lo/100000).toFixed(1)}L – ₹${(hi/100000).toFixed(1)}L`;
  return { score, status, card, creditLimit, age, exp, reasons, positives };
}

// ── Stepper ───────────────────────────────────────────────────────
function Stepper({ current }) {
  const totalSteps = STEPS.length;
  const p = current / (totalSteps - 1);
  const fillWidth = `calc(${p * 100}% - ${p * 40}px)`;

  return (
    <div className="sbi-stepper-track-wrapper">
      {/* Background and active connector tracks */}
      <div className="sbi-stepper-track-bg" />
      <div className="sbi-stepper-track-fill" style={{ width: fillWidth }} />

      <div className="sbi-stepper-container">
        {STEPS.map((s, i) => {
          const isCompleted = i < current;
          const isActive = i === current;

          let circleClass = 'sbi-step-circle ';
          let labelClass = 'sbi-step-label ';

          if (isCompleted) {
            circleClass += 'completed';
            labelClass += 'completed';
          } else if (isActive) {
            circleClass += 'active';
            labelClass += 'active';
          } else {
            circleClass += 'upcoming';
            labelClass += 'upcoming';
          }

          return (
            <div key={i} className="sbi-step-item">
              <div className={circleClass}>
                {isCompleted ? (
                  <Check size={16} strokeWidth={3.5} />
                ) : (
                  i + 1
                )}
              </div>
              <div className={labelClass}>{s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Local Card Visual ─────────────────────────────────────────────
const RupayCardLocal = ({ holderName, cardName }) => {
  return (
    <div className="sbi-rupay-card">
      <div className="sbi-rupay-card-mesh" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div className="sbi-logo-circle" style={{ width:18, height:18 }} />
          <div className="sbi-logo-text" style={{ fontSize:13, color:'#ffffff' }}>SBI</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', opacity:0.8 }}>
          <Compass size={14} style={{ color: '#ffffff' }} />
          <Shield size={14} style={{ color: '#ffffff' }} />
        </div>
      </div>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0 6px' }}>
        <div className="sbi-rupay-card-chip" />
        <div style={{ fontSize:10, fontWeight:700, color:'#93C5FD', textTransform:'uppercase' }}>{cardName || 'CREDIT CARD'}</div>
      </div>

      <div className="sbi-rupay-card-number">•••• •••• •••• 2658</div>
      
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:6 }}>
        <div>
          <div style={{ fontSize:8, opacity:0.6 }}>CARD HOLDER</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.5 }}>{(holderName || 'VISHAL G').toUpperCase()}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:8, opacity:0.6 }}>RuPay</div>
          <div style={{ fontSize:10, fontWeight:900, color:'#FFD700', letterSpacing:1 }}>SELECT</div>
        </div>
      </div>
    </div>
  );
};

// ── Render Premium SBI Credit Card Mockups ────────────────────────
const renderPremiumCard = (slideId, holderName) => {
  const name = (holderName || 'DANISH').toUpperCase();

  let cardBg = 'linear-gradient(135deg, #0A2240, #143D6D, #0054A6)';
  let textColor = '#ffffff';
  let logoCircleColor = '#00B3E3';
  let logoTextColor = '#ffffff';
  let isGoldChip = false;
  let cardNameDisplay = 'Elite';
  let cardNumberDisplay = '4591  8820  1053  2658';
  let cardNumberColor = '#E2E8F0';
  let labelColor = 'rgba(255,255,255,0.6)';
  let nameColor = '#ffffff';
  let borderStyle = '1px solid rgba(255,255,255,0.1)';
  let networkLogo = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: '#ffffff', fontStyle: 'italic' }}>VISA</span>
      <span style={{ fontSize: 7, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.5px', marginTop: 1 }}>SIGNATURE</span>
    </div>
  );

  if (slideId === 'aurum') {
    cardBg = 'linear-gradient(135deg, #111111, #222222, #111111)';
    textColor = '#D4AF37';
    logoCircleColor = '#D4AF37';
    logoTextColor = '#D4AF37';
    isGoldChip = true;
    cardNameDisplay = 'AURUM';
    cardNumberDisplay = '4292  1108  4927  8829';
    cardNumberColor = '#D4AF37';
    labelColor = 'rgba(212,175,55,0.6)';
    nameColor = '#D4AF37';
    borderStyle = '1px solid rgba(212,175,55,0.25)';
    networkLogo = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#D4AF37', fontStyle: 'italic' }}>VISA</span>
        <span style={{ fontSize: 7, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.5px', marginTop: 1 }}>INFINITE</span>
      </div>
    );
  } else if (slideId === 'miles') {
    cardBg = 'linear-gradient(135deg, #093028, #237A57)';
    textColor = '#ffffff';
    logoCircleColor = '#00B3E3';
    logoTextColor = '#ffffff';
    isGoldChip = true;
    cardNameDisplay = 'Miles Elite ✈️';
    cardNumberDisplay = '3568  9011  5248  2658';
    cardNumberColor = '#E2E8F0';
    labelColor = 'rgba(255,255,255,0.6)';
    nameColor = '#ffffff';
    borderStyle = '1px solid rgba(255,255,255,0.1)';
    networkLogo = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#FF7F00', fontStyle: 'italic', textShadow: '0 0 1px #fff' }}>RuPay</span>
        <span style={{ fontSize: 7, fontWeight: 800, color: '#0054A6', letterSpacing: '0.5px', marginTop: 1 }}>SELECT</span>
      </div>
    );
  } else if (slideId === 'apex') {
    cardBg = 'linear-gradient(135deg, #0D2040, #163666, #091D3B)';
    textColor = '#FFEFCF';
    logoCircleColor = '#00B3E3';
    logoTextColor = '#ffffff';
    isGoldChip = true;
    cardNameDisplay = 'KrisFlyer APEX';
    cardNumberDisplay = '4912  8830  1105  3042';
    cardNumberColor = '#FFEFCF';
    labelColor = 'rgba(255,239,207,0.6)';
    nameColor = '#FFEFCF';
    borderStyle = '1px solid rgba(255,239,207,0.15)';
    networkLogo = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: '#ffffff', fontStyle: 'italic' }}>VISA</span>
        <span style={{ fontSize: 7, fontWeight: 800, color: '#FFEFCF', letterSpacing: '0.5px', marginTop: 1 }}>SIGNATURE</span>
      </div>
    );
  }

  return (
    <div className="premium-card-hover" style={{
      width: '100%',
      height: 210,
      borderRadius: 16,
      background: cardBg,
      color: textColor,
      position: 'relative',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 24px',
      overflow: 'hidden',
      border: borderStyle,
      fontFamily: "'Sora', sans-serif"
    }}>
      {/* Sheen & Reflection */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(125deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
        zIndex: 3
      }} />

      {/* Row 1: SBI Logo & Contactless */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* SVG Keyhole Logo */}
          <svg width="18" height="18" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <defs>
              <mask id={`sbi-mask-${slideId}`}>
                <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                <circle cx="50" cy="50" r="18" fill="#000000" />
                <rect x="43" y="50" width="14" height="50" fill="#000000" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="50" fill={logoCircleColor} mask={`url(#sbi-mask-${slideId})`} />
          </svg>
          <span style={{ 
            fontSize: 13, 
            fontWeight: 900, 
            color: logoTextColor, 
            letterSpacing: '-0.3px', 
            fontStyle: 'italic'
          }}>
            SBI card
          </span>
        </div>
        {/* Contactless waves */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={logoTextColor} strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.8, transform: 'rotate(90deg)' }}>
          <path d="M5 8a4 4 0 0 1 0 8" />
          <path d="M9 6a7 7 0 0 1 0 12" />
          <path d="M13 4a10 10 0 0 1 0 16" />
        </svg>
      </div>

      {/* Row 2: Chip & Card Name */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, marginTop: 8 }}>
        {/* Chip */}
        <div style={{
          width: 40,
          height: 30,
          borderRadius: 6,
          background: isGoldChip ? 'linear-gradient(135deg, #F5D061, #C49A24)' : 'linear-gradient(135deg, #E2E8F0, #94A3B8)',
          position: 'relative',
          border: '1px solid rgba(0,0,0,0.15)',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '33%', width: '1px', height: '100%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', top: 0, left: '66%', width: '1px', height: '100%', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', height: '50%', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 2 }} />
        </div>

        {/* Card Name */}
        <div style={{ 
          fontSize: 16, 
          fontWeight: 900, 
          letterSpacing: '1px', 
          color: textColor === '#ffffff' ? '#ffffff' : textColor, 
          fontFamily: "'Sora', sans-serif",
          textTransform: 'uppercase',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)'
        }}>
          {cardNameDisplay}
        </div>
      </div>

      {/* Row 3: Card Number */}
      <div style={{ 
        fontFamily: "'Courier New', monospace", 
        fontSize: 20, 
        letterSpacing: '4px', 
        fontWeight: 'bold', 
        color: cardNumberColor, 
        textAlign: 'center', 
        zIndex: 2,
        margin: '12px 0 6px',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}>
        {cardNumberDisplay}
      </div>

      {/* Row 4: Cardholder & Expiry & Network */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
        <div>
          <div style={{ fontSize: 7, color: labelColor, fontWeight: 700, letterSpacing: '0.5px' }}>CARD HOLDER</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: nameColor, letterSpacing: '0.5px' }}>{name}</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 7, color: labelColor, fontWeight: 700, letterSpacing: '0.5px' }}>VALID THRU</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: nameColor }}>12/31</div>
        </div>

        <div>
          {networkLogo}
        </div>
      </div>
    </div>
  );
};

// ── Main Page Redesign ────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Custom navigation tabs
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [showNotificationCount, setShowNotificationCount] = useState(2);

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const activeSlide = DASHBOARD_SLIDES[activeSlideIdx] || DASHBOARD_SLIDES[0];
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(true);

  useEffect(() => {
    if (!isPlayingSlideshow) return;
    const timer = setInterval(() => {
      setActiveSlideIdx(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlayingSlideshow]);

  // Application stepper states
  const [step, setStep]       = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId]     = useState('');
  const [customNotifs, setCustomNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState({ pan:false, aadhaar:false, payslip:false, bank:false, gst:false, empid:false });
  const [elig, setElig]       = useState(null);
  const [selCard, setSelCard] = useState(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors]   = useState({});
  const [uploading, setUploading] = useState({ pan: false, aadhaar: false, payslip: false, bank: false, gst: false, empid: false });
  const [uploadProgress, setUploadProgress] = useState({ pan: 0, aadhaar: 0, payslip: 0, bank: 0, gst: 0, empid: 0 });

  const [fd, setFd] = useState({
    name: user?.name||'', mobile: user?.mobile||'', email: user?.email||'',
    dob:'', gender:'Male', pincode:'', state:'', city:'', address:'',
    fatherName: '', motherName: '',
    panNumber: '', aadhaarNumber: '',
    empType:'Salaried', company:'', designation:'', salary:'', experience:'',
    businessName:'', gstNo:'', turnover:'', businessType:'Proprietorship',
  });

  const set = k => e => {
    setFd(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  // Fetch active draft or application
  const fetchDraft = useCallback(async () => {
    try {
      const { data } = await getMyDraft();
      if (data.data) {
        const app = data.data;
        setAppId(app._id || app.applicationId);
        setFd({
          name: app.personal?.name || user?.name || '',
          mobile: app.personal?.mobile || user?.mobile || '',
          email: app.personal?.email || user?.email || '',
          dob: app.personal?.dob ? new Date(app.personal.dob).toISOString().split('T')[0] : '',
          gender: app.personal?.gender || 'Male',
          fatherName: app.personal?.fatherName || '',
          motherName: app.personal?.motherName || '',
          pincode: app.personal?.pincode || '',
          state: app.personal?.state || '',
          city: app.personal?.city || '',
          address: app.personal?.address || '',
          empType: app.employmentType || 'Salaried',
          company: app.salaried?.companyName || '',
          designation: app.salaried?.designation || '',
          salary: app.salaried?.monthlySalary || app.selfEmployed?.monthlyIncomeEstimate || '',
          experience: app.salaried?.workExpYears || app.selfEmployed?.businessYears || '',
          businessName: app.selfEmployed?.businessName || '',
          gstNo: app.selfEmployed?.gstNumber || '',
          turnover: app.selfEmployed?.annualTurnover || '',
          businessType: app.selfEmployed?.businessType || 'Proprietorship',
          panNumber: app.kyc?.panNumber || '',
          aadhaarNumber: app.kyc?.aadhaarNumber || ''
        });

        // Check if application is already finalized
        if (app.status && app.status !== 'Draft' && app.status !== 'New Lead') {
          setSubmitted(true);
        } else {
          const savedStep = localStorage.getItem('sbi_draft_step');
          if (savedStep) setStep(parseInt(savedStep));
        }

        // Document states
        if (app.documents) {
          const uploadedDoc = { pan: false, aadhaar: false, payslip: false, bank: false, gst: false, empid: false };
          app.documents.forEach(d => {
            if (d.docType === 'pan') uploadedDoc.pan = true;
            if (d.docType === 'aadhaar') uploadedDoc.aadhaar = true;
            if (d.docType === 'payslip') uploadedDoc.payslip = true;
            if (d.docType === 'bankStatement') uploadedDoc.bank = true;
            if (d.docType === 'gstCertificate') uploadedDoc.gst = true;
            if (d.docType === 'empid' || d.docType === 'employeeId' || d.docType === 'businessReg') uploadedDoc.empid = true;
          });
          setUploaded(uploadedDoc);
        }
        
        if (app.eligibility) {
          setElig(app.eligibility);
          const found = CARDS_DB.find(c => c.name === app.eligibility.recommendedCard || c.name === app.eligibility.card) || CARDS_DB.find(c => c.minSal <= parseInt(app.salaried?.monthlySalary || app.selfEmployed?.monthlyIncomeEstimate || 0)) || CARDS_DB[4];
          setSelCard(found);
        }
      }
    } catch (err) {
      console.warn('Failed to load draft:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchDraft();
  }, [user, fetchDraft]);

  // Socket.io for Real-time Status Notifications
  useEffect(() => {
    if (!appId) return;

    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Customer connected to WebSocket');
    });

    socket.on('application_status_updated', (data) => {
      if (data.id === appId) {
        const isApproved = data.status === 'Approved';
        const isRejected = data.status === 'Rejected';

        // Trigger real-time visual Toast alert
        if (isApproved) {
          toast.success(`🎉 Congratulations! Your SBI Credit Card application ${data.applicationId} has been APPROVED!`, {
            duration: 8000,
            position: 'top-right'
          });
        } else if (isRejected) {
          toast.error(`Update: Your application ${data.applicationId} status has been updated to Rejected. Reason: ${data.rejectionReason || 'Criteria not met.'}`, {
            duration: 8000,
            position: 'top-right'
          });
        } else {
          toast.loading(`Application Status Update: Your application ${data.applicationId} is now "${data.status}".`, {
            duration: 5000,
            position: 'top-right'
          });
        }

        // Prepend real-time custom notification to local dashboard panel
        setCustomNotifs(prev => [
          {
            id: Date.now(),
            text: `SBI Credit Card Status Update: Your application ${data.applicationId} is now "${data.status}".`,
            linkText: isApproved ? 'View Card Details' : isRejected ? 'Contact Help' : 'Track Application',
            action: () => {
              if (isApproved) {
                toast.success('Your card dispatch process is underway.');
              } else {
                toast.info('Please visit the Help section for support.');
              }
            }
          },
          ...prev
        ]);

        // Re-sync customer state
        fetchDraft();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [appId, fetchDraft]);

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!fd.name || fd.name.trim().length < 3) errs.name = 'Full name must be at least 3 letters.';
      const cleanMobile = fd.mobile.replace(/\s/g,'');
      if (!fd.mobile || !/^[6-9]\d{9}$/.test(cleanMobile)) errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
      if (!fd.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) errs.email = 'Enter a valid email address.';
      if (!fd.dob) {
        errs.dob = 'Date of birth is required.';
      } else {
        const dobDate = new Date(fd.dob);
        const age = new Date().getFullYear() - dobDate.getFullYear();
        if (age < 21 || age > 60) errs.dob = 'Age must be between 21 and 60 years.';
      }
      if (!fd.pincode || !/^\d{6}$/.test(fd.pincode)) errs.pincode = 'Enter a valid 6-digit pincode.';
      if (!fd.fatherName || fd.fatherName.trim().length < 3) errs.fatherName = "Father's name must be at least 3 characters.";
      if (!fd.motherName || fd.motherName.trim().length < 3) errs.motherName = "Mother's name must be at least 3 characters.";
      if (!fd.address || fd.address.trim().length < 10) errs.address = 'Enter a detailed address (min 10 characters).';
    } else if (s === 1) {
      const cleanPan = (fd.panNumber || '').trim().toUpperCase();
      if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) errs.panNumber = 'Invalid PAN format. E.g. ABCDE1234F';
      if (!uploaded.pan) errs.panUpload = 'PAN card document must be uploaded.';
      const cleanAadhaar = (fd.aadhaarNumber || '').replace(/\s/g, '');
      if (!cleanAadhaar || !/^\d{12}$/.test(cleanAadhaar)) errs.aadhaarNumber = 'Aadhaar must be exactly 12 digits.';
      if (!uploaded.aadhaar) errs.aadhaarUpload = 'Aadhaar card document must be uploaded.';
    } else if (s === 2) {
      if (fd.empType === 'Salaried') {
        if (!fd.company) errs.company = 'Company name is required.';
        if (!fd.designation) errs.designation = 'Designation is required.';
        if (!fd.salary || +fd.salary < 15000) errs.salary = 'Minimum monthly salary requirement is ₹15,000.';
        if (!fd.experience || +fd.experience < 0) errs.experience = 'Experience cannot be negative.';
      } else {
        if (!fd.businessName) errs.businessName = 'Business name is required.';
        if (!fd.turnover || +fd.turnover < 50000) errs.turnover = 'Minimum turnover is ₹50,000.';
        if (!fd.experience || +fd.experience < 0) errs.experience = 'Experience cannot be negative.';
        if (!fd.salary || +fd.salary < 15000) errs.salary = 'Minimum average income is ₹15,000.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function performFileUpload(file, docType, uploadServiceCall) {
    if (!file) return null;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    if (!allowed.includes(ext)) { toast.error('PDF, JPG, or PNG only.'); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB allowed.'); return null; }

    const stateKey = (docType === 'employeeId' || docType === 'businessReg') ? 'empid' : docType;
    setUploading(u => ({ ...u, [stateKey]: true }));
    setUploadProgress(p => ({ ...p, [stateKey]: 0 }));

    try {
      let activeId = appId;
      if (!activeId) {
        const { data } = await createDraft();
        activeId = data.data._id;
        setAppId(activeId);
      }

      const form = new FormData();
      const fieldName = docType === 'bank' ? 'bankStatement' : docType === 'gst' ? 'gst' : docType;
      form.append(fieldName, file);
      form.append('docType', docType);

      const config = {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(p => ({ ...p, [stateKey]: percent }));
        }
      };

      const { data } = await uploadServiceCall(activeId, form, config);
      setUploaded(prev => ({ ...prev, [stateKey]: true }));
      toast.success(`${file.name} uploaded successfully.`);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed.');
      throw err;
    } finally {
      setUploading(u => ({ ...u, [stateKey]: false }));
    }
  }

  async function goNext() {
    if (!validateStep(step)) { toast.error('Please fix validation errors first.'); return; }
    setLoading(true);
    try {
      if (step === 0) {
        let activeId = appId;
        if (!activeId) {
          const { data } = await createDraft();
          activeId = data.data._id;
          setAppId(activeId);
        }
        await updateDraft(activeId, {
          personal: {
            name: fd.name, mobile: fd.mobile, email: fd.email, dob: fd.dob,
            gender: fd.gender, fatherName: fd.fatherName, motherName: fd.motherName,
            pincode: fd.pincode, state: fd.state, city: fd.city, address: fd.address,
          }
        });
        localStorage.setItem('sbi_draft_step', '1');
        setStep(1);
      } else if (step === 1) {
        await updateDraft(appId, {
          kyc: {
            panNumber: (fd.panNumber || '').toUpperCase(),
            aadhaarNumber: (fd.aadhaarNumber || '').replace(/\s/g, ''),
            panVerified: true,
            aadhaarVerified: true
          },
          personal: {
            name: fd.name, dob: fd.dob, gender: fd.gender, pincode: fd.pincode,
            state: fd.state, city: fd.city, address: fd.address, fatherName: fd.fatherName,
            motherName: fd.motherName, mobile: fd.mobile, email: fd.email
          }
        });
        localStorage.setItem('sbi_draft_step', '2');
        setStep(2);
      } else if (step === 2) {
        const payload = {
          employmentType: fd.empType,
          salaried: fd.empType === 'Salaried' ? {
            companyName: fd.company, designation: fd.designation, monthlySalary: +fd.salary, workExpYears: +fd.experience
          } : undefined,
          selfEmployed: fd.empType === 'Self-Employed' ? {
            businessName: fd.businessName, annualTurnover: +fd.turnover, businessType: fd.businessType,
            businessYears: +fd.experience, gstNumber: fd.gstNo, monthlyIncomeEstimate: +fd.salary
          } : undefined
        };
        await updateDraft(appId, payload);
        
        const { data } = await checkEligibility({
          appId, salary: +fd.salary, dob: fd.dob, empType: fd.empType, experience: +fd.experience, pincode: fd.pincode
        });
        setElig(data.result);
        const found = CARDS_DB.find(c => c.name === data.result.card || c.name === data.result.recommendedCard) || CARDS_DB[4];
        setSelCard(found);
        localStorage.setItem('sbi_draft_step', '3');
        setStep(3);
      } else if (step === 3) {
        const cardName = selCard?.name || (elig?.recommendedCard || elig?.card || 'SimplySAVE');
        await updateDraft(appId, {
          eligibility: {
            score: elig?.score || 0,
            status: elig?.status || 'Requires Review',
            recommendedCard: cardName,
            creditLimit: elig?.creditLimit || '₹50K – ₹1.5L',
            reasons: elig?.reasons || [],
            positives: elig?.positives || [],
            age: elig?.age || (fd.dob ? new Date().getFullYear() - new Date(fd.dob).getFullYear() : 30),
            exp: elig?.exp || parseInt(fd.experience || 0),
            checkedAt: elig?.checkedAt || new Date()
          }
        });
        localStorage.setItem('sbi_draft_step', '4');
        setStep(4);
      }
    } catch (err) {
      console.error('Onboarding step save error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to save progress.');
    } finally {
      setLoading(false);
    }
  }

  async function submitApp() {
    if (!consent) { toast.error('Please agree to Terms & Conditions'); return; }
    setLoading(true);
    try {
      const { data } = await finalizeApplication(appId);
      setAppId(data.applicationId);
      setSubmitted(true);
      setActiveMenu('dashboard'); // Redirect to dashboard tab
      localStorage.removeItem('sbi_draft_step');
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fintech-admin-layout">
      {/* Dynamic styles injected directly in the document */}
      <style>{`
        /* Deep premium banking palette variables */
        :root {
          --sbi-navy-deep: #06122C;
          --sbi-navy: #0B1F45;
          --sbi-blue-accent: #1A56DB;
          --sbi-blue-light: rgba(26, 86, 219, 0.08);
          --sbi-slate-50: #F8FAFC;
          --sbi-slate-100: #F1F5F9;
          --sbi-slate-200: #E2E8F0;
          --sbi-text-dark: #0F172A;
          --sbi-text-muted: #64748B;
          --sbi-border-color: rgba(226, 232, 240, 0.8);
        }

        /* Base styles & layout transitions */
        .fintech-admin-layout {
          display: flex;
          flex-direction: row;
          height: 100vh;
          max-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1E293B;
          overflow: hidden;
          width: 100vw;
        }

        .sbi-welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sbi-dashboard-content {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sbi-dashboard-right-col {
          width: 360px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sbi-onboarding-status-banner {
          background: #1A56DB;
          border-radius: 16px;
          padding: 24px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(26, 86, 219, 0.12);
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .sbi-welcome-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .sbi-welcome-banner h1 {
            font-size: 22px !important;
          }
          .sbi-dashboard-content {
            padding: 16px !important;
            gap: 16px !important;
          }
          .sbi-dashboard-right-col {
            width: 100% !important;
            min-width: 0 !important;
          }
          .sbi-onboarding-status-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 20px !important;
          }
        }

        /* Sticky Blurred Top Navbar */
        .fintech-navbar {
          background: #ffffff !important;
          border-bottom: 1.5px solid #E4EBF6 !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          flex-shrink: 0;
          z-index: 100;
          position: sticky;
          top: 0;
          box-shadow: 0 2px 10px rgba(11, 31, 69, 0.01);
        }

        .sbi-brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0054A6 !important;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          font-size: 17px;
          letter-spacing: -0.5px;
        }

        .sbi-badge {
          background: linear-gradient(135deg, #00A5EC, #0054A6);
          color: #fff;
          font-weight: 900;
          font-size: 11px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 84, 166, 0.4);
        }

        /* Collapsible Stripe-style Sidebar */
        .fintech-sidebar {
          background: #ffffff !important;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          border-right: 1.5px solid #E4EBF6;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          position: relative;
          height: 100%;
        }

        .fintech-sidebar.collapsed {
          width: 72px;
        }

        .fintech-sidebar.expanded {
          width: 240px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          padding: 14px 20px;
          color: #64748B;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sidebar-item:hover {
          background: #EDF2FA;
          color: #0054A6;
        }

        .sidebar-item.active {
          background: #EDF2FA;
          color: #0054A6;
        }

        .sidebar-item.logout {
          color: #EF4444;
        }

        .sidebar-item.logout:hover {
          background: #FEE2E2;
          color: #EF4444;
        }

        .sidebar-item-icon {
          font-size: 18px;
          width: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 12px;
          transition: all 0.2s ease;
        }

        .fintech-sidebar.collapsed .sidebar-item-icon {
          margin-right: 0;
          width: 100%;
        }

        .fintech-sidebar.collapsed .sidebar-item-label {
          display: none;
        }

        /* Targets Card widget */
        .sidebar-target-card {
          margin: auto 16px 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .fintech-sidebar.collapsed .sidebar-target-card {
          display: none;
        }

        /* Premium Glassmorphic Stats Cards */
        .banking-glass-card {
          background: #ffffff;
          border: 1px solid var(--sbi-border-color);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(11, 31, 69, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .banking-glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11, 31, 69, 0.06);
        }

        /* Filter chips */
        .filter-chip {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 30px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          outline: none;
        }

        .filter-chip:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
          color: #334155;
        }

        .filter-chip.active {
          background: #0054A6;
          border-color: #0054A6;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 84, 166, 0.2);
        }

        .filter-chip-count {
          font-size: 10px;
          font-weight: 800;
          background: #F1F5F9;
          color: #64748B;
          padding: 2px 6px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .filter-chip.active .filter-chip-count {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .sbi-hamburger-btn {
          display: none !important;
        }

        /* Mobile overlays */
        @media (max-width: 768px) {
          .sbi-hamburger-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .fintech-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            z-index: 1000 !important;
            height: 100vh !important;
            width: 260px !important;
            transform: translateX(-100%) !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2) !important;
            border-right: none !important;
          }
          .fintech-sidebar.open {
            transform: translateX(0) !important;
          }
          .sbi-sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 999;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease-out;
          }
        }

        /* Smooth slideshow transitions and card hovers */
        .premium-card-hover {
          transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease;
        }
        .premium-card-hover:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(6, 26, 64, 0.35) !important;
        }

        .slide-fade-in {
          animation: slideFadeIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }

        @keyframes slideFadeIn {
          from {
            opacity: 0;
            transform: translateX(15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .carousel-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #CBD5E1;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .carousel-indicator-dot.active {
          width: 24px;
          border-radius: 4px;
          background: #0054A6;
          box-shadow: 0 0 8px rgba(0, 84, 166, 0.4);
        }

        .carousel-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1.5px solid #E4EBF6;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          color: #0054A6;
          font-weight: bold;
        }
        .carousel-btn:hover {
          background: #0054A6;
          color: #ffffff;
          border-color: #0054A6;
          box-shadow: 0 4px 10px rgba(0, 84, 166, 0.2);
        }
      `}</style>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div className="sbi-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar Navigation ── */}
      <aside className={`fintech-sidebar fintech-sidebar-premium expanded ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Logo */}
          <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center' }}>
            <img src="/sbi-card-logo-light.svg" alt="SBI Card" style={{ height: 24, width: 'auto' }} />
          </div>

          {/* Menu header label */}
          <div style={{ padding: '24px 24px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            MENU
          </div>

          {/* Navigation Items */}
          <div style={{ padding: '4px 0' }}>
            <div className={`sidebar-item sidebar-glow-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveMenu('dashboard'); setSidebarOpen(false); }}>
              <Layers size={18} className="sidebar-item-icon" />
              <span className="sidebar-item-label" style={{ fontWeight: 800 }}>My Dashboard</span>
            </div>
            
            <div className={`sidebar-item sidebar-glow-item ${activeMenu === 'apply' ? 'active' : ''}`} onClick={() => { setActiveMenu('apply'); setSidebarOpen(false); }}>
              <CreditCard size={18} className="sidebar-item-icon" />
              <span className="sidebar-item-label" style={{ fontWeight: 800 }}>
                {submitted ? 'My Credit Card' : 'Apply Credit Card'}
              </span>
            </div>
          </div>
        </div>

        {/* Exit / Log out */}
        <div style={{ marginTop: 'auto', paddingBottom: 20 }}>
          <div className="sidebar-item logout" onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={18} className="sidebar-item-icon" />
            <span className="sidebar-item-label" style={{ fontWeight: 800 }}>Log Out</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="sbi-main-area">
        
        {/* Top Navbar */}
        <div className="fintech-navbar nav-glass-sticky">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="sbi-hamburger-btn" onClick={() => setSidebarOpen(true)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu size={22} />
            </button>
            
            {/* Search bar */}
            <div className="sbi-search-bar" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 10, height: 40, width: 320 }}>
              <Search size={16} style={{ color: '#94A3B8' }} />
              <input type="text" placeholder="Search for Account statements" className="sbi-search-input" style={{ color: '#1E293B', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, width: '100%', fontWeight: 500 }} />
            </div>
          </div>

          {/* Top Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {/* Profile */}
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ width:38,height:38,borderRadius:'50%',border:'2px solid #0054A6',display:'flex',alignItems:'center',justifyContent:'center',color:'#0054A6', background: '#ffffff' }}>
                <User size={18} strokeWidth={2.5} />
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#0054A6' }}>{fd.name || 'azalgu'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Pane */}
        <div className="sbi-scrollable-content">
          {activeMenu === 'dashboard' ? (
          <div className="sbi-dashboard-content">
            
            {/* Welcome banner */}
            <div className="sbi-welcome-banner">
              <div>
                <h1 className="premium-font-sora" style={{ fontSize: 28, fontWeight: 900, color: '#0054A6', margin: 0 }}>Hello, {fd.name || 'azalgu'}</h1>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 600 }}>Last logged on 19 May 2026, 12:45 PM</div>
              </div>
              <div>
                <button className="btn-premium-outline" onClick={() => toast.success('Account data refreshed!')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: '24px', fontSize: 13, background: 'transparent', color: '#0054A6', border: '1.5px solid #0054A6', fontWeight: 700, cursor: 'pointer' }}>
                  <RefreshCw size={14} /> Refresh Data
                </button>
              </div>
            </div>

            {/* Slideshow Control and Carousel Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              padding: '16px 24px',
              borderRadius: 16,
              border: '1.5px solid #E4EBF6',
              boxShadow: '0 4px 20px rgba(11, 31, 69, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ACTIVE PRODUCT VIEW:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0054A6', fontFamily: "'Sora', sans-serif" }}>
                  {activeSlide.cardName}
                </span>
                
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                

                {/* Left Arrow */}
                <button
                  className="carousel-btn"
                  onClick={() => {
                    setActiveSlideIdx(prev => (prev - 1 + DASHBOARD_SLIDES.length) % DASHBOARD_SLIDES.length);
                    setIsPlayingSlideshow(false); // pause on interaction
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Dots indicator */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {DASHBOARD_SLIDES.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={`carousel-indicator-dot ${activeSlideIdx === idx ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSlideIdx(idx);
                        setIsPlayingSlideshow(false); // pause on interaction
                      }}
                    />
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  className="carousel-btn"
                  onClick={() => {
                    setActiveSlideIdx(prev => (prev + 1) % DASHBOARD_SLIDES.length);
                    setIsPlayingSlideshow(false); // pause on interaction
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Dynamic Dashboard Page view (with fade transition on activeSlideIdx) */}
            <div key={activeSlideIdx} className="slide-fade-in" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              
              {/* Left Column: Account Summary, Quick actions, Transactions */}
              <div style={{ flex: 1.5, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* 1. Onboarding Status Banner */}
                <div className="sbi-onboarding-status-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Real-time Credit Card Image */}
                    <img 
                      src={activeSlide.cardImg} 
                      alt={activeSlide.cardName} 
                      style={{
                        width: 52,
                        height: 33,
                        borderRadius: 4,
                        objectFit: 'contain',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                        flexShrink: 0
                      }}
                    />

                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'Sora', sans-serif", color: '#ffffff' }}>
                        {submitted ? 'SBI Credit Card Application Under Review' : 'SBI Credit Card Application'}
                      </h3>
                      <p style={{ margin: '6px 0 0', fontSize: 12, opacity: 0.95, fontWeight: 600 }}>
                        {submitted 
                          ? 'Your onboarding application is currently being verified. Track your application status.'
                          : 'You have an active draft. Continue applying and get up to ₹1,50,000 credit limit instantly.'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <button className="btn-premium-bank" onClick={() => setActiveMenu('apply')} style={{ background: '#F59E0B', color: '#061A40', border: 'none', padding: '12px 24px', borderRadius: 24, fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {submitted ? 'Track Application →' : 'Resume Application →'}
                    </button>
                  </div>
                </div>

                {/* 4. Scrolling Quick Services & Banners Marquee */}
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #E4EBF6',
                  borderRadius: 16,
                  padding: '20px 24px',
                  boxShadow: '0 4px 20px rgba(11, 31, 69, 0.01)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: "'Sora', sans-serif" }}>
                      Offers & Digital Services
                    </span>
                    <span style={{ background: '#E6F0FA', color: '#0054A6', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8 }}>
                      YONO Offers
                    </span>
                  </div>

                  {/* Stylesheet injection for keyframes and animation */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes marquee-scroll {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .marquee-container:hover .marquee-content {
                      animation-play-state: paused;
                    }
                  `}} />

                  {/* Marquee Wrapper */}
                  <div className="marquee-container" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* Left Gradient Edge Overlay */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 50,
                      background: 'linear-gradient(to right, #ffffff 20%, rgba(255,255,255,0))',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }} />

                    {/* Right Gradient Edge Overlay */}
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 50,
                      background: 'linear-gradient(to left, #ffffff 20%, rgba(255,255,255,0))',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }} />

                    {/* Scrolling Content (repeated twice for infinite seamless scroll) */}
                    <div className="marquee-content" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      animation: 'marquee-scroll 18s linear infinite',
                      width: 'max-content'
                    }}>
                      {[
                        '/sbi1.png', '/sbi2.png', '/sbi3.png',
                        '/sbi1.png', '/sbi2.png', '/sbi3.png'
                      ].map((imgSrc, idx) => (
                        <div 
                          key={idx} 
                          className="premium-card-hover" 
                          style={{ 
                            width: 120,
                            height: 190, 
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent'
                          }}
                          onClick={() => toast.success(`YONO Partner Offer activated!`)}
                        >
                          <img 
                            src={imgSrc} 
                            alt="SBI Digital Card Offer" 
                            style={{ 
                              width: '100%',
                              height: '100%', 
                              objectFit: 'contain' 
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Premium Credit Card Preview & Card Specific Notifications */}
              <div className="sbi-dashboard-right-col">
                {/* Credit Card section */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    MY CREDIT CARD
                  </div>
                  
                  {/* Custom Rendered Premium Card */}
                  {renderPremiumCard(activeSlide.id, fd.name)}
                </div>

                {/* Notifications section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notifications</span>
                      <span style={{ background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 10 }}>
                        {activeSlide.notifications.length + customNotifs.length}
                      </span>
                    </div>
                    <Bell size={16} style={{ color: '#64748B' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Render dynamic real-time notifications */}
                    {customNotifs.map(notif => (
                      <div key={notif.id} style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 2px 8px rgba(0, 84, 166, 0.04)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0369A1', lineHeight: 1.5 }}>
                          {notif.text}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          {notif.linkText && (
                            <span style={{ fontSize: 11, color: '#0284C7', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => notif.action ? notif.action() : toast.success(`${notif.linkText} triggered!`)}>
                              {notif.linkText}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: '#0EA5E9', fontWeight: 500, marginLeft: 'auto' }}>Just now</span>
                        </div>
                      </div>
                    ))}

                    {/* Render static notifications */}
                    {activeSlide.notifications.map(notif => (
                      <div key={notif.id} style={{ background: '#ffffff', border: '1.5px solid #E4EBF6', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 2px 8px rgba(11, 31, 69, 0.01)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                          {notif.text}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          {notif.linkText && (
                            <span style={{ fontSize: 11, color: '#0054A6', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => toast.success(`${notif.linkText} triggered!`)}>
                              {notif.linkText}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginLeft: 'auto' }}>22 May 2026</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* ── STEPS OR APPLICATION MODE ── */
          <div style={{ padding:28, background:'#F3F6FC', flex:1 }}>
            
            {/* Header info */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <button className="btn btn-ghost" onClick={() => setActiveMenu('dashboard')} style={{ padding:'6px 12px', fontSize:11, borderRadius:16 }}>
                  ← Back to Dashboard
                </button>
              </div>
              <div>
                <span style={{ fontSize:11, color:'#64748B', fontWeight:700 }}>
                  Application Reference ID: {appId || 'New Draft'}
                </span>
              </div>
            </div>

            {submitted ? (
              /* If application is already submitted */
              <div style={{ maxWidth:680, margin:'0 auto' }} className="fade-in">
                <Card p={36} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
                  <h2 style={{ color:'#10B981', marginBottom:8, fontWeight:900 }}>Application Submitted!</h2>
                  <p style={{ color:'#64748B', fontSize:13, lineHeight:1.8, marginBottom:20 }}>
                    Your SBI Credit Card application has been successfully submitted and is under review.
                  </p>
                  <div style={{ background:'#F0FFF4', border:'1px solid #A7F3D0', borderRadius:12, padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:11, color:'#64748B' }}>Reference Number</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'#0054A6', marginTop:4 }}>{appId}</div>
                    <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>Save this number to track your application status</div>
                  </div>
                  <div style={{ background:'#F8FAFC', borderRadius:10, padding:16, marginBottom:24, fontSize:12, color:'#64748B', lineHeight:1.9, textAlign:'left' }}>
                    📧 Confirmation sent to: **{fd.email}**<br/>
                    📱 Updates sent to: **{fd.mobile}**<br/>
                    🕐 Processing time: **2–3 business days**
                  </div>
                  <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                    <Btn variant="primary" onClick={() => setActiveMenu('dashboard')} style={{ padding:'10px 24px', borderRadius:20 }}>
                      Go to Dashboard
                    </Btn>
                  </div>
                </Card>
              </div>
            ) : (
              /* Stepper Form */
              <div style={{ maxWidth:700, margin:'0 auto' }} className="fade-in onboarding-content-container">
                {/* Stepper progress */}
                <div className="sbi-stepper-card">
                  <Stepper current={step} />
                  <div style={{ fontSize:10, color:'#64748B', textAlign:'center', marginTop:14, fontWeight:700, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8 }}>
                    Step {step+1} of {STEPS.length} • {Math.round((step/STEPS.length)*100)}% complete
                  </div>
                </div>

                {/* Form fields based on active step */}
                {step===0 && (
                  <Card p={24}>
                    <SectionTitle sub="Basic details for your SBI Credit Card application">Personal Information</SectionTitle>
                    <Grid cols={2} gap={20}>
                      <Input label="Full Name *" value={fd.name} onChange={set('name')} error={errors.name} />
                      <Input label="Mobile Number *" value={fd.mobile} onChange={set('mobile')} maxLength={10} error={errors.mobile} />
                      <Input label="Email Address *" value={fd.email} onChange={set('email')} type="email" error={errors.email} />
                      <DatePicker label="Date of Birth *" value={fd.dob} onChange={set('dob')} error={errors.dob} />
                      <Select label="Gender *" value={fd.gender} onChange={set('gender')} options={['Male','Female','Other']}/>
                      <Input label="Father's Name *" value={fd.fatherName} onChange={set('fatherName')} error={errors.fatherName} />
                      <Input label="Mother's Name *" value={fd.motherName} onChange={set('motherName')} error={errors.motherName} />
                      <Input label="Residential Pincode *" value={fd.pincode} onChange={e => {
                        const pin = e.target.value.replace(/\D/g,'');
                        setFd(p => ({ ...p, pincode: pin }));
                        if (errors.pincode) setErrors(p => ({ ...p, pincode: '' }));
                        if (pin.length === 6) {
                          if (pin.startsWith('11')) setFd(p => ({ ...p, pincode: pin, state: 'Delhi', city: 'New Delhi' }));
                          else if (pin.startsWith('40')) setFd(p => ({ ...p, pincode: pin, state: 'Maharashtra', city: 'Mumbai' }));
                          else if (pin.startsWith('56')) setFd(p => ({ ...p, pincode: pin, state: 'Karnataka', city: 'Bengaluru' }));
                          else if (pin.startsWith('60')) setFd(p => ({ ...p, pincode: pin, state: 'Tamil Nadu', city: 'Chennai' }));
                          else if (pin.startsWith('70')) setFd(p => ({ ...p, pincode: pin, state: 'West Bengal', city: 'Kolkata' }));
                          else if (pin.startsWith('50')) setFd(p => ({ ...p, pincode: pin, state: 'Telangana', city: 'Hyderabad' }));
                          else setFd(p => ({ ...p, pincode: pin, state: 'Other', city: 'Local Town' }));
                        }
                      }} maxLength={6} error={errors.pincode} />
                      <Input label="State" value={fd.state} onChange={set('state')} />
                      <Input label="City" value={fd.city} onChange={set('city')} />
                    </Grid>
                    <Textarea label="Residential Address *" value={fd.address} onChange={set('address')} rows={2} error={errors.address} />
                    <NotifBox type="info">Your details are encrypted with AES-256 and stored securely in compliance with RBI guidelines.</NotifBox>
                    <div className="sbi-form-actions-footer">
                      <div />
                      <Btn variant="primary" onClick={goNext} disabled={loading}>{loading ? 'Saving...' : 'Next: KYC Upload →'}</Btn>
                    </div>
                  </Card>
                )}

                {step===1 && (() => {
                  const cleanPan = (fd.panNumber || '').trim().toUpperCase();
                  const cleanAadhaar = (fd.aadhaarNumber || '').replace(/\s/g, '');

                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <Card p={20}>
                        <SectionTitle sub="Manually enter your PAN details and upload the document for verification">PAN Card Details</SectionTitle>
                        <Grid cols={2} gap={10} style={{ marginBottom: 16 }}>
                          <Input label="PAN Number *" value={fd.panNumber || ''} onChange={e => {
                            setFd(p => ({ ...p, panNumber: e.target.value.toUpperCase() }));
                            if (errors.panNumber) setErrors(p => ({ ...p, panNumber: '' }));
                          }} placeholder="ABCDE1234F" error={errors.panNumber} />
                        </Grid>
                        <UploadZone label="Upload PAN Card Image/PDF" icon="📄" done={uploaded.pan} onChange={(file) => performFileUpload(file, 'pan', uploadKYCDocs)} accept=".pdf,.png,.jpg,.jpeg" loading={uploading.pan} progress={uploadProgress.pan}/>
                      </Card>

                      <Card p={20}>
                        <SectionTitle sub="Manually enter your Aadhaar details and upload the document for verification">Aadhaar Card Details</SectionTitle>
                        <Grid cols={2} gap={10} style={{ marginBottom: 16 }}>
                          <Input label="Aadhaar Number *" value={fd.aadhaarNumber || ''} onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setFd(p => ({ ...p, aadhaarNumber: raw.substring(0, 12) }));
                            if (errors.aadhaarNumber) setErrors(p => ({ ...p, aadhaarNumber: '' }));
                          }} placeholder="123456789012" maxLength={12} error={errors.aadhaarNumber} />
                        </Grid>
                        <UploadZone label="Upload Aadhaar Card (Front + Back)" icon="🪪" done={uploaded.aadhaar} onChange={(file) => performFileUpload(file, 'aadhaar', uploadKYCDocs)} accept=".pdf,.png,.jpg,.jpeg" loading={uploading.aadhaar} progress={uploadProgress.aadhaar}/>
                      </Card>

                      <div className="sbi-form-actions-footer">
                        <Btn variant="ghost" onClick={() => setStep(0)}>← Back</Btn>
                        <Btn variant="primary" onClick={goNext} disabled={loading}>{loading ? 'Saving...' : 'Next: Employment →'}</Btn>
                      </div>
                    </div>
                  );
                })()}

                {step===2 && (
                  <Card p={24}>
                    <SectionTitle sub="Income and employment details for eligibility assessment">Employment Details</SectionTitle>
                    <div style={{ marginBottom:16 }}>
                      <label>Employment Type *</label>
                      <Grid cols={2} gap={10} style={{ marginTop:6 }}>
                        {['Salaried','Self-Employed'].map(et => (
                          <div 
                            key={et} 
                            onClick={() => setFd(p=>({...p,empType:et}))} 
                            className={`sbi-emp-card ${fd.empType===et ? 'active' : ''}`}
                          >
                            <span className="sbi-emp-card-icon">{et==='Salaried'?'🏢':'🏪'}</span>
                            <div>
                              <div className="sbi-emp-card-title">{et}</div>
                              <div className="sbi-emp-card-subtitle">{et==='Salaried'?'Company employee':'Business owner/freelancer'}</div>
                            </div>
                          </div>
                        ))}
                      </Grid>
                    </div>

                    {fd.empType==='Salaried' ? (
                      <>
                        <Grid cols={2} gap={12}>
                          <Input label="Company Name *" value={fd.company} onChange={set('company')} placeholder="Employer name" error={errors.company} />
                          <Input label="Designation *" value={fd.designation} onChange={set('designation')} placeholder="Job title" error={errors.designation} />
                          <Input label="Monthly Gross Salary (₹) *" type="number" value={fd.salary} onChange={set('salary')} placeholder="e.g. 75000" error={errors.salary} />
                          <Input label="Work Experience (Years) *" type="number" value={fd.experience} onChange={set('experience')} placeholder="Total years" error={errors.experience} />
                        </Grid>
                        <Divider/>
                        <div style={{ fontSize:13, fontWeight:800, color:'#0B1F45', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'#0054A6' }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                          </svg>
                          <span>Required Documents</span>
                        </div>
                        <Grid cols={2} gap={10}>
                          <UploadZone label="3-Month Payslips" icon="💵" done={uploaded.payslip} onChange={(file) => performFileUpload(file, 'payslip', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.payslip} progress={uploadProgress.payslip}/>
                          <UploadZone label="3-Month Bank Statement" icon="🏦" done={uploaded.bank} onChange={(file) => performFileUpload(file, 'bank', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.bank} progress={uploadProgress.bank}/>
                          <UploadZone label="Employee ID Card" icon="🪪" done={uploaded.empid} onChange={(file) => performFileUpload(file, 'employeeId', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.empid} progress={uploadProgress.empid}/>
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid cols={2} gap={12}>
                          <Input label="Business Name *" value={fd.businessName} onChange={set('businessName')} placeholder="Registered business name" error={errors.businessName} />
                          <Input label="GST Number" value={fd.gstNo} onChange={set('gstNo')} placeholder="15-digit GST number" />
                          <Input label="Annual Turnover (₹) *" type="number" value={fd.turnover} onChange={set('turnover')} placeholder="Annual business turnover" error={errors.turnover} />
                          <Select label="Business Type *" value={fd.businessType} onChange={set('businessType')}
                            options={['Proprietorship','Partnership','Private Limited','LLP','OPC','Other']}/>
                          <Input label="Years in Business" type="number" value={fd.experience} onChange={set('experience')} placeholder="Years operating" error={errors.experience} />
                          <Input label="Monthly Income Estimate (₹)" type="number" value={fd.salary} onChange={set('salary')} placeholder="Average monthly income" error={errors.salary} />
                        </Grid>
                        <Divider/>
                        <div style={{ fontSize:13, fontWeight:800, color:'#0B1F45', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'#0054A6' }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                          </svg>
                          <span>Required Documents</span>
                        </div>
                        <Grid cols={2} gap={10}>
                          <UploadZone label="ITR (Last 2 Years)" icon="📑" done={uploaded.payslip} onChange={(file) => performFileUpload(file, 'payslip', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.payslip} progress={uploadProgress.payslip}/>
                          <UploadZone label="GST Certificate" icon="📊" done={uploaded.gst} onChange={(file) => performFileUpload(file, 'gst', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.gst} progress={uploadProgress.gst}/>
                          <UploadZone label="Bank Statement (6 Months)" icon="🏦" done={uploaded.bank} onChange={(file) => performFileUpload(file, 'bank', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.bank} progress={uploadProgress.bank}/>
                          <UploadZone label="Business Registration" icon="📋" done={uploaded.empid} onChange={(file) => performFileUpload(file, 'businessReg', uploadEmploymentDocs)} small accept=".pdf,.png,.jpg,.jpeg" loading={uploading.empid} progress={uploadProgress.empid}/>
                        </Grid>
                      </>
                    )}

                    <div className="sbi-form-actions-footer">
                      <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
                      <Btn variant="gold" onClick={goNext} style={{ fontSize:14, padding:'10px 24px', display:'inline-flex', alignItems:'center', gap:6 }} disabled={loading}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        <span>{loading ? 'Saving...' : 'Check Eligibility →'}</span>
                      </Btn>
                    </div>
                  </Card>
                )}

                {step===3 && elig && (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* Score card */}
                    <Card p={24} style={{ textAlign:'center' }}>
                      <div style={{ width:80,height:80,borderRadius:'50%',margin:'0 auto 14px',display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',border:'5px solid',
                        borderColor:elig.score>=75?'#10B981':elig.score>=55?'#F59E0B':'#EF4444',
                        background:elig.score>=75?'#D1FAE5':elig.score>=55?'#FEF3C7':'#FEE2E2' }}>
                        <div style={{ fontSize:24,fontWeight:900,fontFamily:"'Sora',sans-serif",
                          color:elig.score>=75?'#10B981':elig.score>=55?'#D97706':'#EF4444' }}>{elig.score}</div>
                        <div style={{ fontSize:9,fontWeight:700,color:'#64748B' }}>/ 100</div>
                      </div>
                      <h3 style={{ fontFamily:"'Sora',sans-serif",
                        color:elig.score>=75?'#10B981':elig.score>=55?'#D97706':'#EF4444', marginBottom:4 }}>{elig.status}</h3>
                      <p style={{ fontSize:13,color:'#64748B',marginBottom:14 }}>Eligibility Score: {elig.score}/100 • Indicative Limit: {elig.creditLimit}</p>
                      <Grid cols={3} gap={10}>
                        {[['Income',`₹${parseInt(fd.salary||0).toLocaleString()}/mo`],['Age',`${elig?.age || (fd.dob ? new Date().getFullYear() - new Date(fd.dob).getFullYear() : 30)} years`],['Experience',`${elig?.exp || parseInt(fd.experience || 0)} years`]].map(([k,v])=>(
                          <div key={k} style={{ background:'#F8FAFC',borderRadius:8,padding:10 }}>
                            <div style={{ fontSize:11,color:'#64748B' }}>{k}</div>
                            <div style={{ fontSize:13,fontWeight:800 }}>{v}</div>
                          </div>
                        ))}
                      </Grid>
                    </Card>

                    {/* Recommended card */}
                    {elig.score>=50 && selCard && (
                      <>
                        <div style={{ fontSize:14,fontWeight:800,color:'#0054A6' }}>🏆 Recommended Credit Card</div>
                        <Card p={16} style={{ border:'2.5px solid #0054A6' }}>
                          <Grid cols={2} gap={16}>
                            <RupayCardLocal holderName={fd.name} cardName={selCard.name} />
                            <div>
                              <div style={{ fontSize:16,fontWeight:900,color:'#0054A6',marginBottom:4 }}>{selCard.name}</div>
                              <div style={{ fontSize:12,color:'#64748B',marginBottom:10 }}>Annual Fee: {selCard.annual} • Limit: {elig.creditLimit}</div>
                              {selCard.features.map(f=><div key={f} style={{ fontSize:11,color:'#334155',padding:'2px 0' }}>✅ {f}</div>)}
                            </div>
                          </Grid>
                        </Card>
                        
                        <div style={{ fontSize:13,fontWeight:800,color:'#0054A6',marginTop:6 }}>Other Cards You May Qualify For</div>
                        <Grid cols={3} gap={10}>
                          {CARDS_DB.filter(c=>c.name!==selCard.name&&c.minSal<=parseInt(fd.salary||0)).slice(0,3).map(c=>(
                            <Card key={c.id} p={12} style={{ textAlign:'center',cursor:'pointer',border:selCard.id===c.id?'2px solid #0054A6':'1px solid #E2E8F0' }}
                              onClick={()=>setSelCard(c)}>
                              <div style={{ fontSize:22 }}>{c.icon}</div>
                              <div style={{ fontSize:12,fontWeight:800,marginTop:4 }}>{c.name}</div>
                              <div style={{ fontSize:10,color:'#94A3B8' }}>{c.annual}/yr</div>
                            </Card>
                          ))}
                        </Grid>
                      </>
                    )}

                    {elig.positives && elig.positives.length>0 && <NotifBox type="success"><div><b>Positive Indicators:</b>{elig.positives.map((p,i)=><div key={i}>• {p}</div>)}</div></NotifBox>}
                    {elig.reasons && elig.reasons.length>0   && <NotifBox type="warning"><div><b>Advisory Notes:</b>{elig.reasons.map((r,i)=><div key={i}>• {r}</div>)}</div></NotifBox>}

                    <div className="sbi-form-actions-footer">
                      <Btn variant="ghost" onClick={() => setStep(2)}>← Back</Btn>
                      {elig.score>=50
                        ? <Btn variant="primary" onClick={goNext} disabled={loading}>{loading ? 'Saving...' : 'Review & Submit →'}</Btn>
                        : <Btn variant="ghost" onClick={() => setActiveMenu('dashboard')}>Return to Dashboard</Btn>}
                    </div>
                  </div>
                )}

                {step===4 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <NotifBox type="success">🎉 Almost done! Please review all your details before submitting.</NotifBox>
                    <Card p={20}>
                      <SectionTitle>Application Summary</SectionTitle>
                      <div style={{ background:'#EEF2FF',borderRadius:8,padding:14,marginBottom:14 }}>
                        <div style={{ fontSize:11,color:'#64748B' }}>Your application will receive this reference ID</div>
                        <div style={{ fontSize:22,fontWeight:900,color:'#0054A6' }}>SBI-{new Date().getFullYear()}-XXXX</div>
                      </div>
                      <Grid cols={2} gap={8}>
                        {[['Full Name',fd.name],['Father\'s Name',fd.fatherName || '—'],['Mother\'s Name',fd.motherName || '—'],
                          ['Mobile',fd.mobile],['Email',fd.email],['Date of Birth',fd.dob],['Gender',fd.gender],
                          ['PAN',fd.panNumber || '—'],['Aadhaar',fd.aadhaarNumber || '—'],['Employment',fd.empType],
                          ['Monthly Income',`₹${parseInt(fd.salary||0).toLocaleString()}`],['City / State',`${fd.city}, ${fd.state}`],
                          ['Recommended Card',selCard?.name||'—'],['Eligibility Score',`${elig?.score||0}/100`]].map(([k,v])=>(
                          <div key={k} style={{ padding:'8px 0',borderBottom:'1px solid #F1F5F9' }}>
                            <div style={{ fontSize:10,color:'#94A3B8',fontWeight:700,marginBottom:1 }}>{k}</div>
                            <div style={{ fontSize:13,fontWeight:700,color:'#1E293B' }}>{v||'—'}</div>
                          </div>
                        ))}
                      </Grid>
                    </Card>
                    
                    <Card p={16}>
                      <p style={{ fontSize:12,color:'#64748B',lineHeight:1.8 }}>
                        By submitting this application, I confirm that all information provided is accurate and complete.
                        I consent to SBI verifying my documents, conducting KYC checks, and performing a soft credit
                        bureau inquiry in compliance with RBI guidelines.
                      </p>
                      <label 
                        className={`consent-checkbox-label ${consent ? 'checked' : ''}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={consent} 
                          onChange={e => setConsent(e.target.checked)} 
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: consent ? '2.5px solid #0054A6' : '2.5px solid #94A3B8',
                          background: consent ? '#0054A6' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          flexShrink: 0
                        }}>
                          {consent && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: 13, 
                          fontWeight: 700, 
                          color: consent ? '#0054A6' : '#475569',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                          lineHeight: 1.4
                        }}>
                          I agree to the Terms & Conditions, Privacy Policy, and consent to credit bureau check
                        </span>
                      </label>
                    </Card>
                    
                    <div className="sbi-form-actions-footer">
                      <Btn variant="ghost" onClick={() => setStep(3)}>← Back</Btn>
                      <Btn variant="gold" style={{ padding:'12px 28px',fontSize:15 }} onClick={submitApp} disabled={loading}>
                        {loading ? 'Submitting...' : '🚀 Submit Application'}
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
