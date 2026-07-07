// ================================================================
//  CustomerLoginPage.jsx — Simple & Clean Customer Login Page
// ================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/shared/UI';

// Custom Input with left inline SVG icons and premium error badges
const CustomInput = ({ label, icon, error, ...props }) => (
  <div className="login-field-group">
    {label && <label className="login-field-label">{label}</label>}
    <div className="login-input-wrapper">
      <span className="login-input-icon">
        {icon}
      </span>
      <input className={`login-input ${error ? 'error-border' : ''}`} {...props} />
    </div>
    {error && (
      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{error}</span>
      </div>
    )}
  </div>
);

export default function CustomerLoginPage() {
  const { loginCustomer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({ name: '', mobile: '', email: '' });
  const [errors, setErrors] = useState({});
  
  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  function validate() {
    const errs = {};
    if (!form.name || form.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters.';
    }
    const cleanMobile = form.mobile.replace(/\s/g,'');
    if (!form.mobile) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errs.mobile = 'Mobile must be a valid 10-digit Indian number.';
    }
    if (!form.email) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      toast.error('Please fix validation errors first.');
      return;
    }
    setLoading(true);
    try {
      await loginCustomer(form.name, form.mobile, form.email);
      toast.success('Authentication successful!');
      navigate('/customer/application');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="login-portal-wrapper">
      {/* Ambient background mesh glow effects */}
      <div className="login-mesh-orb" style={{ left: '5%', top: '10%', width: '450px', height: '450px', background: 'rgba(0, 181, 239, 0.22)', animationDelay: '0s' }} />
      <div className="login-mesh-orb" style={{ right: '10%', bottom: '5%', width: '500px', height: '500px', background: 'rgba(26, 86, 219, 0.2)', animationDelay: '-6s' }} />
      <div className="login-mesh-orb" style={{ left: '40%', top: '45%', width: '380px', height: '380px', background: 'rgba(13, 148, 136, 0.12)', animationDelay: '-12s' }} />

      {/* Grid pattern overlay */}
      <div className="login-bg-grid" />

      {/* Hero Layout Container */}
      <div className="login-hero-container">
        {/* Column 1: Left Content Column */}
        <div className="login-hero-left">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0, 84, 166, 0.06)', border: '1px solid rgba(0, 84, 166, 0.12)', padding: '6px 12px', borderRadius: 20, width: 'fit-content' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0054A6" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#0054A6', textTransform: 'uppercase' }}>SECURE CARD GATEWAY</span>
          </div>

          <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#556987', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
            State Bank of India
          </div>
          
          <h1 className="premium-font-sora" style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.8px', color: '#0B1F45', margin: 0 }}>
            Credit Card <br />
            <span style={{ background: 'linear-gradient(135deg, #0B1F45 40%, #0072BC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Onboarding</span> <br />
            <span style={{ background: 'linear-gradient(135deg, #0054A6, #00A5EC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Portal</span>
          </h1>
          
          <p className="login-hero-desc" style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, maxWidth: 330, marginTop: 8, marginBottom: 0 }}>
            Experience an enterprise-grade digital onboarding, instant KYC processing, and powerful real-time eligibility evaluation.
          </p>
        </div>

        {/* Column 2: Center Illustration Column */}
        <div className="login-hero-center">
          <div className="login-illustration-card">
            <div className="login-illustration-glow" />
            <img 
              src="/sbi-cards-fan.png" 
              alt="SBI Credit Cards Showcase" 
              className="login-illustration-image login-illustration-float"
            />
          </div>
        </div>

        {/* Column 3: Glassmorphic Customer Card */}
        <div className="login-hero-right">
          <div className="login-glass-card">
            {/* Logo Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 12 }}>
                <img src="/sbi-card-logo-light.svg" alt="SBI Card" style={{ height: 26, width: 'auto' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0B1F45', margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.3px' }}>
                Welcome Back
              </h2>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3, fontWeight: 500, letterSpacing: '0.1px' }}>
                Secure Banking Portal Gateway
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ marginBottom: 16 }}>
              <CustomInput 
                label="Full Name" 
                value={form.name} 
                onChange={set('name')} 
                placeholder="As per PAN card" 
                error={errors.name} 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />
              
              <CustomInput 
                label="Mobile Number" 
                value={form.mobile} 
                onChange={set('mobile')} 
                placeholder="10-digit mobile" 
                maxLength={10} 
                error={errors.mobile} 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              
              <CustomInput 
                label="Email Address" 
                value={form.email} 
                onChange={set('email')} 
                placeholder="you@email.com" 
                type="email" 
                error={errors.email} 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
            </div>

            {/* Action CTA Button */}
            <button 
              className="login-btn" 
              onClick={handleLogin} 
              disabled={loading}
              style={{ marginBottom: 12 }}
            >
              {loading ? (
                <>
                  <Spinner size={16} />
                  <span>Verifying Gateway...</span>
                </>
              ) : (
                <>
                  <span>Start Application</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* Secure Trust Badge Footer inside Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#64748B', fontWeight: 500, marginBottom: 12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#0054A6' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>SecureConnect™ • IRDAI Compliant</span>
            </div>

            {/* Optional Small Footer Link for Staff login */}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 12, textAlign: 'center' }}>
              <Link to="/admin/login" style={{ fontSize: 11.5, color: '#0054A6', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>Staff Login</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
