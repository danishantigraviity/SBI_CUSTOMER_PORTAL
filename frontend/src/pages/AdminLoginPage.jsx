// ================================================================
//  AdminLoginPage.jsx — Professional & Minimal Admin Login Page
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

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({ staffId: '', password: '' });
  const [errors, setErrors] = useState({});
  
  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  function validate() {
    const errs = {};
    if (!form.staffId || form.staffId.trim().length === 0) {
      errs.staffId = 'Staff ID is required.';
    }
    if (!form.password || form.password.trim().length === 0) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      toast.error('Please enter both Staff ID and Password.');
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(form.staffId, form.password);
      toast.success(`Welcome back, ${form.staffId}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials or account inactive.');
    } finally { setLoading(false); }
  }

  return (
    <div className="login-portal-wrapper">
      {/* Ambient background mesh glow effects - deep, dark theme colors */}
      <div className="login-mesh-orb" style={{ left: '10%', top: '15%', width: '450px', height: '450px', background: 'rgba(15, 23, 42, 0.12)', animationDelay: '0s' }} />
      <div className="login-mesh-orb" style={{ right: '5%', bottom: '8%', width: '500px', height: '500px', background: 'rgba(0, 84, 166, 0.15)', animationDelay: '-4s' }} />

      {/* Grid pattern overlay */}
      <div className="login-bg-grid" />

      {/* Hero Layout Container */}
      <div className="login-hero-container">
        {/* Column 1: Left Content Column */}
        <div className="login-hero-left">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(15, 23, 42, 0.05)', border: '1px solid rgba(15, 23, 42, 0.1)', padding: '6px 12px', borderRadius: 20, width: 'fit-content' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#0F172A', textTransform: 'uppercase' }}>INTERNAL ACCESS PORTAL</span>
          </div>

          <div style={{ fontSize: 11.5, letterSpacing: 3, color: '#556987', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
            State Bank of India
          </div>
          
          <h1 className="premium-font-sora" style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.8px', color: '#0B1F45', margin: 0 }}>
            Internal Staff <br />
            <span style={{ background: 'linear-gradient(135deg, #0B1F45 40%, #0F172A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Management</span> <br />
            <span style={{ background: 'linear-gradient(135deg, #0054A6, #0F172A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gateway</span>
          </h1>
          
          <p className="login-hero-desc" style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.65, maxWidth: 330, marginTop: 8, marginBottom: 0 }}>
            Access SBI's credit card review queue, kyc registry details, and eligibility engine metrics.
          </p>
        </div>

        {/* Column 2: Center Illustration Column */}
        <div className="login-hero-center">
          <div className="login-illustration-card">
            <div className="login-illustration-glow" style={{ background: 'radial-gradient(circle, rgba(15, 23, 42, 0.15) 0%, transparent 70%)' }} />
            <img 
              src="/sbi-cards-fan.png" 
              alt="SBI Credit Cards Showcase" 
              className="login-illustration-image login-illustration-float"
            />
          </div>
        </div>

        {/* Column 3: Glassmorphic Admin Card */}
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
                Secure Staff Management Portal
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ marginBottom: 16 }}>
              <CustomInput 
                label="Staff ID" 
                value={form.staffId} 
                onChange={set('staffId')} 
                placeholder="ADMIN-001 or SBI-TL-001" 
                error={errors.staffId} 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="13" y2="16" />
                  </svg>
                }
              />
              
              <CustomInput 
                label="Password" 
                value={form.password} 
                onChange={set('password')} 
                placeholder="••••••••" 
                type="password" 
                error={errors.password} 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
            </div>

            {/* Action CTA Button */}
            <button 
              className="login-btn" 
              onClick={handleLogin} 
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', marginBottom: 12 }}
            >
              {loading ? (
                <>
                  <Spinner size={16} />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* Secure Trust Badge Footer inside Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#64748B', fontWeight: 500, marginBottom: 12 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#0F172A' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Encrypted Banking Session • IRDAI Compliant</span>
            </div>

            {/* Back link to customer site */}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 12, textAlign: 'center' }}>
              <Link to="/" style={{ fontSize: 11.5, color: '#475569', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Customer Portal</span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
