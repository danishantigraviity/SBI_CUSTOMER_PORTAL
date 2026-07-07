// ================================================================
//  App.jsx — Root component with routing
// ================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import CustomerLoginPage from './pages/CustomerLoginPage';
import AdminLoginPage    from './pages/AdminLoginPage';
import OnboardingPage    from './pages/OnboardingPage';
import AdminPage         from './pages/AdminPage';
import './index.css';

function ProtectedAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user)    return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/customer/application" replace />;
  return children;
}

function ProtectedCustomer({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user)    return <Navigate to="/" replace />;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/" element={!user ? <CustomerLoginPage /> : (isAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/customer/application" />)} />
      <Route path="/customer/application" element={<ProtectedCustomer><OnboardingPage /></ProtectedCustomer>} />
      <Route path="/customer/dashboard" element={<Navigate to="/customer/application" replace />} />
      <Route path="/admin/login" element={!user ? <AdminLoginPage /> : (isAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/customer/application" />)} />
      <Route path="/admin/dashboard" element={<ProtectedAdmin><AdminPage /></ProtectedAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ 
      v7_startTransition: true, 
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }}>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000,
          style: { fontFamily:'Inter,sans-serif', fontSize:13, borderRadius:8 } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
