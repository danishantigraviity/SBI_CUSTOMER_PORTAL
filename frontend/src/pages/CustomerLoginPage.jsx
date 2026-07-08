// ================================================================
//  CustomerLoginPage.jsx — Seamless Guest Auto-Login Page
// ================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CustomerLoginPage() {
  const { loginCustomer, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is already authenticated as customer, go to application onboarding directly
    if (user && user.role !== 'Manager' && user.role !== 'Team Leader') {
      navigate('/customer/application');
      return;
    }

    async function autoLogin() {
      try {
        const rand = Math.floor(100000000 + Math.random() * 900000000); // 9 random digits
        const guestName = "Guest Customer";
        const guestMobile = `9${rand}`;
        const guestEmail = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@sbi.co.in`;
        
        await loginCustomer(guestName, guestMobile, guestEmail);
        const savedTime = new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        localStorage.setItem('sbi_login_time', savedTime);
        navigate('/customer/application');
      } catch (err) {
        toast.error('Portal initialization failed. Please reload.');
      }
    }
    
    autoLogin();
  }, [user, loginCustomer, navigate]);

  return (
    <div className="login-portal-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
      {/* Ambient background mesh glow effects */}
      <div className="login-mesh-orb" style={{ left: '10%', top: '15%', width: '450px', height: '450px', background: 'rgba(0, 181, 239, 0.15)' }} />
      <div className="login-mesh-orb" style={{ right: '5%', bottom: '8%', width: '500px', height: '500px', background: 'rgba(26, 86, 219, 0.15)' }} />
      
      {/* Grid pattern overlay */}
      <div className="login-bg-grid" />

      <div style={{ textAlign: 'center', zIndex: 10 }}>
        <img src="/sbi-card-logo-light.svg" alt="SBI Card" style={{ height: 32, width: 'auto', marginBottom: 24 }} />
        <div className="spinner-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTop: '4px solid #0054A6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: '#0B1F45', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2px' }}>
            Preparing Onboarding Portal...
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
