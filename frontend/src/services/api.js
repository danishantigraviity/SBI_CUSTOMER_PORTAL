// ================================================================
//  API Service — Axios instance + all API calls
// ================================================================

import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

// Request interceptor — attach JWT
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sbi_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('sbi_refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem('sbi_token',   data.accessToken);
          localStorage.setItem('sbi_refresh', data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(err.config);
        } catch (_) { localStorage.clear(); window.location.href = '/'; }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const customerLogin = (data) => api.post('/customer/start-application', data);
export const adminLogin    = (data) => api.post('/auth/admin/login', data);
export const getMe         = ()     => api.get('/auth/me');
export const createStaff   = (data) => api.post('/auth/admin/create', data);

// ── Applications ──────────────────────────────────────────────────
export const submitApplication   = (data)         => api.post('/applications', data);
export const getApplications     = (params)        => api.get('/applications', { params });
export const getApplication      = (id)            => api.get(`/applications/${id}`);
export const updateAppStatus     = (id, data)      => api.patch(`/applications/${id}/status`, data);
export const addCRMNote          = (id, data)      => api.post(`/applications/${id}/notes`, data);
export const assignApplication   = (id, data)      => api.patch(`/applications/${id}/assign`, data);
export const deleteApplication   = (id)            => api.delete(`/applications/${id}`);
export const getMyDraft          = ()             => api.get('/applications/my-draft');
export const createDraft         = ()             => api.post('/applications/draft');
export const updateDraft         = (id, data)      => api.patch(`/applications/draft/${id}`, data);
export const finalizeApplication  = (id)            => api.post(`/applications/submit/${id}`);

// ── KYC / OCR ─────────────────────────────────────────────────────
export const uploadKYCDocs         = (appId, form, config = {}) => api.post(`/kyc/${appId}/kyc-docs`, form, { headers:{ 'Content-Type':'multipart/form-data' }, ...config });
export const uploadEmploymentDocs  = (appId, form, config = {}) => api.post(`/kyc/${appId}/employment-docs`, form, { headers:{ 'Content-Type':'multipart/form-data' }, ...config });
export const downloadDocument      = (filename) => api.get(`/kyc/document/${filename}`, { responseType: 'blob' });

// ── Eligibility ───────────────────────────────────────────────────
export const checkEligibility = (data) => api.post('/eligibility/check', data);

// ── Reports ───────────────────────────────────────────────────────
export const getDashboardStats  = ()    => api.get('/admin/dashboard');
export const getQDProfile       = (id)  => api.get(`/reports/qd/${id}`);
export const downloadQDPDF      = (id)  => api.get(`/reports/qd/${id}/pdf`, { responseType: 'blob' });
export const downloadQDExcel    = (id)  => api.get(`/reports/qd/${id}/excel`, { responseType: 'blob' });
export const downloadExcel      = ()    => api.get('/reports/excel', { responseType:'blob' });
export const syncAllSheets      = ()    => api.post('/reports/sync-all-sheets');

// ── Team / Admin ──────────────────────────────────────────────────
export const getStaff         = ()          => api.get('/admin/staff');
export const updateStaffStatus = (id, data) => api.patch(`/admin/staff/${id}/status`, data);

// ── Notifications ─────────────────────────────────────────────────
export const sendNotification = (data) => api.post('/notifications/send', data);

// ── Leads ─────────────────────────────────────────────────────────
export const createLead  = (data) => api.post('/leads', data);
export const getLeads    = ()     => api.get('/leads');
export const updateLead  = (id, data) => api.patch(`/leads/${id}/status`, data);
export const addLeadNote = (id, data) => api.post(`/leads/${id}/notes`, data);

// ── Health ────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

export default api;
