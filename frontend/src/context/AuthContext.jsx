// ================================================================
//  Auth Context — Global authentication state
// ================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, adminLogin as apiAdminLogin, customerLogin as apiCustomerLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sbi_token');
    if (token) {
      getMe().then(({ data }) => {
        const u = data.user;
        const isCust = u.role === 'Customer';
        setUser(u);
        setRole(u.role || '');
        setIsAdmin(!isCust);
      }).catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const loginAdmin = async (staffId, password) => {
    const { data } = await apiAdminLogin({ staffId, password });
    localStorage.setItem('sbi_token',   data.accessToken);
    localStorage.setItem('sbi_refresh', data.refreshToken);
    setUser(data.admin); setRole(data.admin.role); setIsAdmin(true);
    return data;
  };

  const loginCustomer = async (name, mobile, email) => {
    const { data } = await apiCustomerLogin({ name, mobile, email });
    localStorage.setItem('sbi_token',   data.accessToken);
    localStorage.setItem('sbi_refresh', data.refreshToken);
    setUser(data.user); setRole('Customer'); setIsAdmin(false);
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null); setRole(''); setIsAdmin(false);
  };

  const hasPermission = (...roles) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, loading, loginAdmin, loginCustomer, logout, hasPermission }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
