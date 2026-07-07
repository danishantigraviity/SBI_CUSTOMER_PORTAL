// ================================================================
//  App.jsx — Root component with routing
// ================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage      from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import AdminPage      from './pages/AdminPage';
import './index.css';

function ProtectedAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user)    return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/apply" replace />;
  return children;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/"      element={!user ? <LoginPage /> : isAdmin ? <Navigate to="/admin" /> : <Navigate to="/apply" />} />
      <Route path="/apply" element={user && !isAdmin ? <OnboardingPage /> : <Navigate to="/" />} />
      <Route path="/admin" element={<ProtectedAdmin><AdminPage /></ProtectedAdmin>} />
      <Route path="*"      element={<Navigate to="/" replace />} />
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
