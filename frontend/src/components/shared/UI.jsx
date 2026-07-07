// ================================================================
//  Shared UI Components — Reusable across the application
// ================================================================

import React, { useState, useEffect } from 'react';

// ── Button ────────────────────────────────────────────────────────
export const Btn = ({ children, variant='primary', size='md', full, style={}, ...props }) => {
  const v = { primary:'btn-primary', gold:'btn-gold', outline:'btn-outline', ghost:'btn-ghost', success:'btn-success', danger:'btn-danger' };
  const s = { sm:'btn-sm', lg:'btn-lg' };
  return (
    <button className={`btn ${v[variant]||''} ${s[size]||''} ${full?'btn-full':''}`} style={style} {...props}>
      {children}
    </button>
  );
};

// ── Card ──────────────────────────────────────────────────────────
export const Card = ({ children, style={}, p=16, className='' }) => (
  <div className={`card ${className}`} style={{ padding:p, ...style }}>{children}</div>
);

// ── Badge ─────────────────────────────────────────────────────────
export const Badge = ({ children, color='gray' }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

// ── Status Badge ──────────────────────────────────────────────────
const STATUS_MAP = {
  'Approved':          { color:'green', dot:'#059669' },
  'Rejected':          { color:'red',   dot:'#DC2626' },
  'Under Verification':{ color:'blue',  dot:'#1D4ED8' },
  'Pending Review':    { color:'gold',  dot:'#F59E0B' },
  'New Lead':          { color:'gray',  dot:'#9CA3AF' },
  'Dispatched':        { color:'teal',  dot:'#0D9488' },
  'Card Printed':      { color:'purple',dot:'#7C3AED' },
  'KYC Pending':       { color:'orange',dot:'#F97316' },
  'Conditionally Approved':{ color:'gold', dot:'#F59E0B' },
  'Documents Uploaded':{ color:'blue',  dot:'#1D4ED8' },
};
export const StatusBadge = ({ status }) => {
  const m = STATUS_MAP[status] || { color:'gray', dot:'#9CA3AF' };
  return (
    <span className={`badge badge-${m.color}`}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot, display:'inline-block' }} />
      {status}
    </span>
  );
};

// ── Input ─────────────────────────────────────────────────────────
export const Input = ({ label, error, ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <input className={error ? 'error-border' : ''} {...props} />
    {error && (
      <div className="sbi-form-error animate-fade-in">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    )}
  </div>
);

// ── Select ────────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options = [], error, placeholder = "Select...", ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  // Find selected label
  const selectedOption = options.find(o => {
    const oVal = typeof o === 'object' ? o.value : o;
    return oVal === value;
  });
  
  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  return (
    <div className="form-group sbi-select-container" ref={containerRef}>
      {label && <label>{label}</label>}
      
      <div 
        className={`sbi-select-trigger ${isOpen ? 'active' : ''} ${error ? 'error-border' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sbi-select-value">{displayLabel}</span>
        <span className="sbi-select-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
      
      {error && (
        <div className="sbi-form-error animate-fade-in">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {isOpen && (
        <ul className="sbi-select-dropdown fade-in">
          {options.map((o, idx) => {
            const oVal = typeof o === 'object' ? o.value : o;
            const oLabel = typeof o === 'object' ? o.label : o;
            const isSelected = oVal === value;
            
            return (
              <li 
                key={idx}
                className={`sbi-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(oVal)}
              >
                {oLabel}
                {isSelected && (
                  <span className="sbi-select-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const Textarea = ({ label, error, rows=3, ...props }) => (
  <div className="form-group">
    {label && <label>{label}</label>}
    <textarea className={error ? 'error-border' : ''} rows={rows} {...props} />
    {error && (
      <div className="sbi-form-error animate-fade-in">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    )}
  </div>
);// ── DatePicker ────────────────────────────────────────────────────
export const DatePicker = ({ label, value, onChange, error, minYear = 1940, maxYear = new Date().getFullYear() }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  
  // Parse incoming value YYYY-MM-DD
  const parsedDate = value ? new Date(value) : null;
  const [currentDate, setCurrentDate] = useState(() => {
    return parsedDate || new Date(1990, 4, 15);
  });
  
  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const containerRef = React.useRef(null);
  const monthSelectRef = React.useRef(null);
  const yearSelectRef = React.useRef(null);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowMonthSelect(false);
        setShowYearSelect(false);
      }
    }
    function handleClickOutsideSelectors(event) {
      if (monthSelectRef.current && !monthSelectRef.current.contains(event.target)) {
        setShowMonthSelect(false);
      }
      if (yearSelectRef.current && !yearSelectRef.current.contains(event.target)) {
        setShowYearSelect(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutsideSelectors);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideSelectors);
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Years array from minYear to maxYear
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleDateSelect = (day) => {
    const selectedDate = new Date(year, month, day);
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange({ target: { value: formatted } });
    setIsOpen(false);
  };
  
  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    setCurrentDate(today);
    onChange({ target: { value: formatted } });
    setIsOpen(false);
  };
  
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '' } });
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  const prevDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDays.push(prevDaysInMonth - i);
  }
  
  const currentDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push(i);
  }
  
  const totalCells = 42;
  const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
  const nextDays = [];
  for (let i = 1; i <= nextDaysCount; i++) {
    nextDays.push(i);
  }

  // Display value formatting (DD/MM/YYYY)
  const displayValue = parsedDate 
    ? `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`
    : '';

  return (
    <div className="form-group sbi-datepicker-container" ref={containerRef}>
      {label && <label>{label}</label>}
      
      <div className="sbi-datepicker-input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input 
          type="text" 
          readOnly 
          placeholder="DD/MM/YYYY" 
          value={displayValue}
          className={`sbi-datepicker-input ${error ? 'error-border' : ''}`}
        />
        <span className="sbi-datepicker-icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
      </div>
      
      {error && (
        <div className="sbi-form-error animate-fade-in">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {isOpen && (
        <div className="sbi-datepicker-calendar-popover fade-in">
          {/* Header */}
          <div className="sbi-calendar-header">
            <button type="button" className="sbi-calendar-nav-btn" onClick={handlePrevMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="sbi-calendar-selectors">
              {/* Month Selector */}
              <div className="sbi-mini-select-container" ref={monthSelectRef}>
                <button 
                  type="button" 
                  className={`sbi-mini-select-trigger ${showMonthSelect ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthSelect(!showMonthSelect);
                    setShowYearSelect(false);
                  }}
                >
                  <span>{monthNames[month].substring(0, 3)}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showMonthSelect ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {showMonthSelect && (
                  <ul className="sbi-mini-select-dropdown month-dropdown fade-in">
                    {monthNames.map((mName, idx) => (
                      <li 
                        key={idx} 
                        className={`sbi-mini-select-option ${idx === month ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(year, idx, 1));
                          setShowMonthSelect(false);
                        }}
                      >
                        {mName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Year Selector */}
              <div className="sbi-mini-select-container" ref={yearSelectRef}>
                <button 
                  type="button" 
                  className={`sbi-mini-select-trigger ${showYearSelect ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowYearSelect(!showYearSelect);
                    setShowMonthSelect(false);
                  }}
                >
                  <span>{year}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showYearSelect ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {showYearSelect && (
                  <ul className="sbi-mini-select-dropdown year-dropdown fade-in">
                    {years.map(yVal => (
                      <li 
                        key={yVal} 
                        className={`sbi-mini-select-option ${yVal === year ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(yVal, month, 1));
                          setShowYearSelect(false);
                        }}
                      >
                        {yVal}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <button type="button" className="sbi-calendar-nav-btn" onClick={handleNextMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          
          {/* Week Days */}
          <div className="sbi-calendar-weekdays">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(wDay => (
              <span key={wDay} className="sbi-calendar-weekday">{wDay}</span>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="sbi-calendar-days-grid">
            {/* Previous Month Days */}
            {prevDays.map((dVal, idx) => (
              <span key={`prev-${idx}`} className="sbi-calendar-day sibling-month">{dVal}</span>
            ))}
            
            {/* Current Month Days */}
            {currentDays.map(dVal => {
              const isSelected = parsedDate && 
                                 parsedDate.getDate() === dVal && 
                                 parsedDate.getMonth() === month && 
                                 parsedDate.getFullYear() === year;
              const isToday = new Date().getDate() === dVal && 
                              new Date().getMonth() === month && 
                              new Date().getFullYear() === year;
              return (
                <button 
                  key={`day-${dVal}`} 
                  type="button" 
                  onClick={() => handleDateSelect(dVal)}
                  className={`sbi-calendar-day current-month ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                >
                  {dVal}
                </button>
              );
            })}
            
            {/* Next Month Days */}
            {nextDays.map((dVal, idx) => (
              <span key={`next-${idx}`} className="sbi-calendar-day sibling-month">{dVal}</span>
            ))}
          </div>
          
          {/* Footer */}
          <div className="sbi-calendar-footer">
            <button type="button" className="sbi-calendar-footer-btn clear" onClick={handleClear}>Clear</button>
            <button type="button" className="sbi-calendar-footer-btn today" onClick={handleToday}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
};


// ── Grid ──────────────────────────────────────────────────────────
export const Grid = ({ cols=2, gap=14, children, className='', style={} }) => (
  <div className={`sbi-grid sbi-grid-${cols} ${className}`} style={{ gap, ...style }}>
    {children}
  </div>
);

// ── Flex ──────────────────────────────────────────────────────────
export const Flex = ({ children, between, center=true, gap=10, wrap, style={} }) => (
  <div style={{ display:'flex', alignItems:center?'center':'flex-start', justifyContent:between?'space-between':'flex-start', gap, flexWrap:wrap?'wrap':'nowrap', ...style }}>
    {children}
  </div>
);

// ── Divider ───────────────────────────────────────────────────────
export const Divider = ({ my=16 }) => (
  <div style={{ height:1, background:'#E2E8F0', margin:`${my}px 0` }} />
);

// ── Section Title ─────────────────────────────────────────────────
export const SectionTitle = ({ children, sub, style={} }) => (
  <div style={{ marginBottom:14, ...style }}>
    <div style={{ fontSize:16, fontWeight:800, color:'#0B1F45', fontFamily:"'Sora',sans-serif" }}>{children}</div>
    {sub && <div style={{ fontSize:12, color:'#6B7280', marginTop:3 }}>{sub}</div>}
  </div>
);

// ── Progress Bar ──────────────────────────────────────────────────
export const ProgressBar = ({ value, color='#1A56DB', height=6 }) => (
  <div className="progress-bar" style={{ height }}>
    <div className="progress-fill" style={{ width:`${Math.min(value,100)}%`, background:color }} />
  </div>
);

// ── Spinner ───────────────────────────────────────────────────────
export const Spinner = ({ size=20 }) => (
  <div className="spinner" style={{ width:size, height:size }} />
);

// ── Notification Box ──────────────────────────────────────────────
export const NotifBox = ({ type='info', children }) => (
  <div className={`notif notif-${type}`}>
    <span>{type==='success'?'✅':type==='warning'?'⚠️':type==='error'?'❌':'ℹ️'}</span>
    <div>{children}</div>
  </div>
);

// ── Fraud Badge ───────────────────────────────────────────────────
export const FraudBadge = ({ flag }) => flag
  ? <span className="badge badge-red">🚨 FLAGGED</span>
  : <span className="badge badge-green">✅ Clean</span>;

// ── Mini Stat Card ────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, color='blue' }) => {
  const colors = { blue:'#DBEAFE', green:'#D1FAE5', gold:'#FEF3C7', red:'#FEE2E2', purple:'#EDE9FE' };
  const texts  = { blue:'#1D4ED8', green:'#065F46', gold:'#92400E', red:'#991B1B', purple:'#5B21B6' };
  return (
    <Card p={16}>
      <Flex between style={{ marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:colors[color]||colors.blue, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        <span style={{ fontSize:10, color:'#9CA3AF' }}>This week</span>
      </Flex>
      <div style={{ fontSize:24, fontWeight:900, fontFamily:"'Sora',sans-serif", color:'#0B1F45' }}>{value}</div>
      <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:texts[color]||texts.blue, marginTop:4, fontWeight:700 }}>{sub}</div>}
    </Card>
  );
};

// ── Mini Bar Chart (pure CSS/SVG) ─────────────────────────────────
export const MiniBarChart = ({ data=[], labels=[], color='#1A56DB', height=130 }) => {
  const max = Math.max(...data, 1);
  const barH = height - 24;
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height, paddingBottom:22 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
          <div title={`${labels[i]}: ${v}`} style={{ width:'100%', height:`${(v/max)*barH}px`, background:color, borderRadius:'3px 3px 0 0', opacity: i===9?1:0.6, transition:'height .3s' }} />
          <div style={{ fontSize:9, color:'#9CA3AF', whiteSpace:'nowrap', transform:'rotate(-30deg)', transformOrigin:'center' }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
};

// ── Donut Chart (SVG) ─────────────────────────────────────────────
export const DonutChart = ({ data=[], colors=[], size=90, label }) => {
  const total = data.reduce((a,b)=>a+b, 0) || 1;
  const r=30, circ=2*Math.PI*r;
  let offset=0;
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      {data.map((v,i) => {
        const pct  = v/total;
        const dash = pct*circ;
        const seg = (
          <circle key={i} cx="35" cy="35" r={r} fill="none" stroke={colors[i]} strokeWidth="10"
            strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={-offset*circ}
            style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%' }}
          />
        );
        offset += pct;
        return seg;
      })}
      {label && <text x="35" y="39" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0B1F45">{label}</text>}
    </svg>
  );
};

// ── Credit Card Visual ────────────────────────────────────────────
export const CreditCardVisual = ({ card, holderName='YOUR NAME', compact=false }) => {
  const h = compact ? 95 : 135;
  return (
    <div style={{ width:'100%', height:h, borderRadius:14, padding:compact?12:18,
      background:`linear-gradient(135deg,${card.color},${card.color2})`,
      color:'#fff', position:'relative', overflow:'hidden', cursor:'pointer' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.07)' }} />
      <Flex between style={{ marginBottom:compact?6:12 }}>
        <div style={{ fontSize:compact?10:12, fontWeight:800, opacity:.9 }}>{card.name}</div>
        <div style={{ fontSize:compact?14:20 }}>{card.icon}</div>
      </Flex>
      {!compact && <div style={{ width:28, height:20, background:'#F5A623', borderRadius:3, marginBottom:10 }} />}
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:compact?10:12, letterSpacing:2, opacity:.75, marginBottom:compact?4:8 }}>
        •••• •••• •••• 7142
      </div>
      <Flex between>
        <div>
          <div style={{ fontSize:9, opacity:.55 }}>CARD HOLDER</div>
          <div style={{ fontSize:compact?10:12, fontWeight:700 }}>{holderName.toUpperCase().slice(0,18)}</div>
        </div>
        <div style={{ fontSize:9, opacity:.55 }}>12/29</div>
      </Flex>
    </div>
  );
};

// ── Upload Zone ───────────────────────────────────────────────────
export const UploadZone = ({ label, icon, done, onChange, onSimulate, note, small, accept, loading, progress }) => {
  const fileRef = React.useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleClick = () => {
    if (loading) return;
    if (fileRef.current) fileRef.current.click();
    else if (onSimulate) onSimulate();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      if (onChange) onChange(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      if (onChange) onChange(file);
    }
  };

  if (loading) return (
    <div className="sbi-upload-zone loading">
      <div className="sbi-upload-loading-container">
        <Spinner size={32} />
        <div className="sbi-upload-progress-title">Uploading document...</div>
        <div className="sbi-upload-progress-wrapper">
          <ProgressBar value={progress || 0} color="#0054A6" height={6} />
          <div className="sbi-upload-progress-percent">{progress || 0}% completed</div>
        </div>
      </div>
    </div>
  );

  if (done) return (
    <div className="sbi-upload-success-card fade-in">
      <div className="sbi-upload-success-left">
        <span className="sbi-upload-success-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <div className="sbi-upload-success-meta">
          <div className="sbi-upload-success-label">{label}</div>
          <div className="sbi-upload-success-filename">{selectedFileName || 'document_uploaded.pdf'}</div>
        </div>
      </div>
      <div className="sbi-upload-success-actions">
        <button type="button" className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '16px' }} onClick={handleClick}>Re-upload</button>
      </div>
      <input type="file" ref={fileRef} onChange={handleFileChange} style={{ display:'none' }} accept={accept} />
    </div>
  );

  return (
    <div 
      className={`sbi-upload-zone ${isDragActive ? 'drag-active' : ''} ${small ? 'small' : ''}`}
      onClick={handleClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <div className="sbi-upload-icon-circle">
        {icon === '📄' || icon === '📑' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        ) : icon === '🪪' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
            <circle cx="9" cy="12" r="2"></circle>
            <line x1="14" y1="10" x2="18" y2="10"></line>
            <line x1="14" y1="14" x2="18" y2="14"></line>
          </svg>
        ) : icon === '🏦' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <rect x="3" y="10" width="18" height="9" rx="2"></rect>
            <path d="M12 2L2 7h20L12 2z"></path>
            <path d="M6 22h12"></path>
          </svg>
        ) : icon === '💵' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        ) : icon === '📊' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        ) : icon === '📋' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sbi-upload-svg-icon">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
        ) : (
          <span className="sbi-upload-emoji-icon" style={{ fontSize: '20px' }}>{icon}</span>
        )}
      </div>
      <div className="sbi-upload-title">{label}</div>
      <div className="sbi-upload-subtitle">Drag & drop files here, or <span style={{ color: '#0054A6', fontWeight: 700 }}>Browse</span></div>
      <div className="sbi-upload-meta">PDF, JPG, PNG • Max 5MB</div>
      <input type="file" ref={fileRef} onChange={handleFileChange} style={{ display:'none' }} accept={accept} />
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────────
export const Modal = ({ children, onClose, width=560 }) => (
  <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&onClose()} style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:10 }}>
    <div className="modal-box" style={{ width, maxWidth:'95vw', maxHeight:'92vh', overflowY:'auto', padding:0, borderRadius:16, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  </div>
);

// ── Table ──────────────────────────────────────────────────────────
export const Table = ({ headers=[], rows=[], emptyMsg='No data found' }) => (
  <div style={{ overflowX:'auto' }}>
    <table>
      <thead>
        <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={headers.length} style={{ textAlign:'center', padding:30, color:'#9CA3AF' }}>{emptyMsg}</td></tr>
          : rows}
      </tbody>
    </table>
  </div>
);
