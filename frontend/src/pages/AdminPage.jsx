// ================================================================
//  AdminPage.jsx — Full Admin Dashboard (10 Modules)
// ================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Layers, FileText, Search, Bell, LogOut, Menu, X, AlertTriangle, Fingerprint, CreditCard, Briefcase, Calendar, DollarSign, ShieldAlert, ShieldCheck, Eye, Download, User, Mail, Phone, ArrowRight, Clock, CheckCircle2, MessageSquare, Plus, TrendingUp, Cpu, MapPin, FileSpreadsheet } from 'lucide-react';
import { Btn, Card, Grid, Flex, Badge, StatusBadge, FraudBadge, SectionTitle,
         StatCard, MiniBarChart, DonutChart, ProgressBar, CreditCardVisual,
         Modal, Input, Select, Textarea, Divider, NotifBox, Spinner } from '../components/shared/UI';
import { getApplications, getApplication, updateAppStatus, addCRMNote, assignApplication, deleteApplication, getStaff, updateStaffStatus, sendNotification, getDashboardStats, getQDProfile, downloadQDPDF, downloadQDExcel, downloadExcel, syncAllSheets, getLeads, createLead, updateLead, addLeadNote, downloadDocument } from '../services/api';

// ── Product Cards Catalog Database ───────────────────────────────
const CARDS_DB = [
  { id:'elite',    name:'SBI Elite',       annual:'₹4,999', color:'#1a1a2e', color2:'#0f3460', minSal:75000, category:'Premium',  features:['5X Rewards Dining','Airport Lounge (8/yr)','Golf Privileges','Fuel Waiver'] },
  { id:'prime',    name:'SBI Prime',       annual:'₹2,999', color:'#2d1b69', color2:'#11998e', minSal:60000, category:'Premium',  features:['3X Reward Points','Movie Tickets (2/mo)','Milestone Bonus','Insurance'] },
  { id:'cashback', name:'SBI Cashback',    annual:'₹999',   color:'#134e5e', color2:'#71b280', minSal:40000, category:'Cashback', features:['5% Cashback Online','1.5% All Spends','No Joining Fee Y1','Zero Liability'] },
  { id:'irctc',    name:'IRCTC SBI Card',  annual:'₹1,499', color:'#1c3a5e', color2:'#0b6e4f', minSal:35000, category:'Co-brand', features:['10% IRCTC Value','Train Insurance','Railway Lounge','350 Bonus Pts'] },
  { id:'savecash', name:'SimplySAVE',      annual:'₹499',   color:'#0f2027', color2:'#2c5364', minSal:25000, category:'Entry',    features:['10X Dining/Movies','Grocery 1.25%','Fuel Waiver','Annual Fee Reversal'] },
  { id:'business', name:'Business Credit', annual:'₹3,499', color:'#2c2c54', color2:'#474787', minSal:150000,category:'Business', features:['Dedicated RM','GST Invoice Mgmt','Expense Dashboard','5 Employee Cards'] },
];

// ── Sidebar config ────────────────────────────────────────────────
const SIDEBAR = [
  { id:'dashboard',     label:'Dashboard', icon: <Layers size={18} /> },
  { id:'applications',  label:'Applications', icon: <FileText size={18} /> },
];

// ================================================================
export default function AdminPage() {
  const { user, role, logout } = useAuth();
  const navigate  = useNavigate();
  const [page,    setPage]    = useState('dashboard');
  const [apps,    setApps]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('All');
  const [showNotif, setShowNotif] = useState(false);
  const [qdApp,   setQdApp]   = useState(null);
  const [qdProfile, setQdProfile] = useState(null);
  const [detailApp, setDetailApp] = useState(null);
  const [crmApp,  setCrmApp]  = useState(null);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState(null);
  const [crmNote, setCrmNote] = useState('');
  const [crmFollowUpType, setCrmFollowUpType] = useState('Call Scheduled');
  const [crmFollowUpDate, setCrmFollowUpDate] = useState('');
  const [crmPriority, setCrmPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  // Live Database States
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, fraud: 0, avgScore: 0 });
  const [cardDist, setCardDist] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [notifsList, setNotifsList] = useState([]);

  // Secure PII Documents Preview & Download States
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState('');
  const [previewDocFilename, setPreviewDocFilename] = useState('');

  const handleDownloadDoc = async (filename, originalName) => {
    try {
      toast.loading('Downloading document...', { id: 'doc-action' });
      const { data } = await downloadDocument(filename);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Document downloaded successfully!', { id: 'doc-action' });
    } catch (err) {
      toast.error('Failed to download document.', { id: 'doc-action' });
    }
  };

  const handlePreviewDoc = async (filename, originalName) => {
    try {
      toast.loading('Loading document preview...', { id: 'doc-action' });
      setPreviewDocFilename(filename);
      const { data } = await downloadDocument(filename);
      
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes = {
        'pdf':  'application/pdf',
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
        'webp': 'image/webp',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      const file = new Blob([data], { type: contentType });
      const fileURL = window.URL.createObjectURL(file);
      setPreviewDocUrl(fileURL);
      setPreviewDocTitle(originalName || filename);
      toast.success('Document preview loaded successfully!', { id: 'doc-action' });
    } catch (err) {
      toast.error('Failed to preview document. Falling back to direct download...', { id: 'doc-action' });
      handleDownloadDoc(filename, originalName);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats();
      if (data.success) {
        setStats(data.stats);
        setCardDist(data.cardDist || []);
        setMonthlyTrend(data.monthlyTrend || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  };

  const fetchApps = async () => {
    try {
      setLoading(true);
      const { data } = await getApplications({
        status: filter === 'All' ? undefined : filter,
        search: search || undefined
      });
      if (data.success) {
        setApps(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const { data } = await getStaff();
      if (data.success) {
        setTeamList(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch team list', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchTeam();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchApps();
    }
  }, [user, filter, search]);

  // Real-Time WebSockets Sync using Socket.io
  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '') 
      : 'http://localhost:5000';

    const socket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time banking WebSocket');
    });

    socket.on('application_submitted', (data) => {
      toast.success(`New Onboarding Application: ${data.personal.name} (${data.applicationId})`, {
        duration: 5000,
        position: 'top-right'
      });

      // Update local notification panel
      setNotifsList(prev => [
        {
          id: Date.now(),
          type: 'info',
          msg: `New application ${data.applicationId} submitted by ${data.personal.name} (${data.personal.city})`,
          time: 'Just now',
          read: false
        },
        ...prev
      ]);

      // Automatically hot reload
      fetchApps();
      fetchStats();
    });

    socket.on('application_status_updated', (data) => {
      toast.success(`Application ${data.applicationId} status updated: ${data.status}`, {
        duration: 5000,
        position: 'top-right'
      });

      // Update local notification panel
      setNotifsList(prev => [
        {
          id: Date.now(),
          type: data.status === 'Approved' ? 'success' : data.status === 'Rejected' ? 'error' : 'warning',
          msg: `Status updated: ${data.applicationId} moved to ${data.status} by ${data.lastUpdatedBy}`,
          time: 'Just now',
          read: false
        },
        ...prev
      ]);

      // Automatically hot reload
      fetchApps();
      fetchStats();

      // Live reload of currently viewed detail modal if matches
      setDetailApp(prev => {
        if (prev && prev._id === data.id) {
          getApplication(data.id).then(res => {
            if (res.data?.success) setDetailApp(res.data.data);
          }).catch(console.warn);
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDeleteConfirmApp(null);
      }
    };
    if (deleteConfirmApp) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteConfirmApp]);

  const filteredApps = apps; // Pre-filtered by the API!

  async function transitionAppStatus(id, newStatus, reason = undefined) {
    try {
      setLoading(true);
      const { data } = await updateAppStatus(id, { status: newStatus, rejectionReason: reason });
      if (data.success) {
        toast.success(`Application status transitioned to ${newStatus}!`);
        // If the detail modal is active, keep it open but update the data
        setDetailApp(prev => {
          if (prev && prev._id === id) {
            return data.data;
          }
          return null;
        });
        fetchApps();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to transition application to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  }

  async function approveApp(id) {
    await transitionAppStatus(id, 'Approved');
  }

  async function rejectApp(id, reason = 'Risk check failed') {
    await transitionAppStatus(id, 'Rejected', reason);
  }

  function handleDeleteApp(app) {
    setDeleteConfirmApp(app);
  }

  async function executeDeleteApp(id) {
    try {
      setLoading(true);
      const { data } = await deleteApplication(id);
      if (data.success) {
        toast.success('Application deleted successfully!');
        setDetailApp(prev => prev && prev._id === id ? null : prev);
        setQdApp(prev => prev && prev._id === id ? null : prev);
        fetchApps();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete application');
    } finally {
      setLoading(false);
      setDeleteConfirmApp(null);
    }
  }

  const handleShowQD = async (app) => {
    try {
      setLoading(true);
      toast.loading('Fetching dynamic QD Profile...', { id: 'qd-fetch' });
      const { data } = await getQDProfile(app._id);
      if (data.success) {
        setQdProfile(data.qd);
        setQdApp(app);
        toast.success('QD Profile loaded!', { id: 'qd-fetch' });
      }
    } catch (err) {
      toast.error('Failed to fetch QD Profile dynamically. Showing offline cache.', { id: 'qd-fetch' });
      const sal = app.salaried?.monthlySalary || Math.round((app.selfEmployed?.annualTurnover || 0) / 12);
      setQdProfile({
        applicationId:   app.applicationId,
        generatedAt:     new Date().toISOString(),
        personalDetails: app.personal,
        kycDetails:      { panNumber:app.kyc?.panNumber, aadhaarMasked:app.kyc?.aadhaarNumber, panVerified:app.kyc?.panVerified, aadhaarVerified:app.kyc?.aadhaarVerified, nameMismatch:app.kyc?.nameMismatch, nameMatchScore:app.kyc?.nameMatchScore },
        employment:      { type:app.employmentType, ...(app.salaried||{}), ...(app.selfEmployed||{}) },
        financial:       app.financial,
        eligibility:     app.eligibility,
        fraud:           app.fraud,
        documents:       app.documents?.map(d => ({ docType:d.docType, isVerified:d.isVerified, uploadedAt:d.uploadedAt, fileName:d.fileName })),
        status:          app.status,
        assignedTo:      app.assignedTo?.name,
        timeline:        app.timeline,
        crm:             app.crm,
      });
      setQdApp(app);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (appId, appName) => {
    try {
      toast.loading('Generating & downloading QD PDF report...', { id: 'qd-pdf' });
      const { data } = await downloadQDPDF(appId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SBI_QD_${appName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QD PDF downloaded successfully!', { id: 'qd-pdf' });
    } catch (err) {
      toast.error('Failed to generate QD PDF report.', { id: 'qd-pdf' });
    }
  };

  const handleExportExcel = async (appId, appName) => {
    try {
      toast.loading('Generating & downloading QD Excel report...', { id: 'qd-excel' });
      const { data } = await downloadQDExcel(appId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SBI_QD_${appName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QD Excel downloaded successfully!', { id: 'qd-excel' });
    } catch (err) {
      toast.error('Failed to generate QD Excel report.', { id: 'qd-excel' });
    }
  };

  async function toggleStaffStatus(id, currentStatus) {
    try {
      await updateStaffStatus(id, { isActive: !currentStatus });
      toast.success('Staff status updated!');
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update staff status');
    }
  }

  async function saveCRMNote() {
    if (!crmApp) return;
    try {
      setLoading(true);
      await addCRMNote(crmApp._id, {
        note: crmNote,
        followUpAt: crmFollowUpDate || undefined,
        followUpType: crmFollowUpType,
        priority: crmPriority
      });
      toast.success('CRM Note saved and follow-up scheduled!');
      
      // If the currently viewed application is the one that was updated, refresh detailApp
      if (detailApp && detailApp._id === crmApp._id) {
        const { data } = await getApplication(crmApp._id);
        if (data && data.data) {
          setDetailApp(data.data);
        }
      }

      setCrmApp(null);
      setCrmNote('');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save CRM note');
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    setLoading(true);
    try {
      const res = await downloadExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sbi_applications_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report generated & downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download Excel report');
    } finally {
      setLoading(false);
    }
  }

  async function triggerBulkSyncSheets() {
    setLoading(true);
    // Open the Google Sheet URL in a new window/tab
    window.open('https://docs.google.com/spreadsheets/d/1cuZEURjkPd319C-tLi32FyH7JCMbvEKfpwbUVyjTjNo/edit?gid=0#gid=0', '_blank');
    try {
      toast.loading('Syncing all database applications to Google Sheets...', { id: 'sheets-sync' });
      const { data } = await syncAllSheets();
      if (data.success) {
        toast.success(data.message || 'Successfully synced all data to Google Sheets!', { id: 'sheets-sync' });
        fetchApps();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sync to Google Sheets.', { id: 'sheets-sync' });
    } finally {
      setLoading(false);
    }
  }

  const renderStatCard = (label, value, sub, colorClass) => {
    const accentClassMap = {
      blue: 'kpi-accent-blue',
      green: 'kpi-accent-burgundy',
      gold: 'kpi-accent-gold',
      purple: 'kpi-accent-purple'
    };
    return (
      <div className={`banking-glass-card kpi-accent-card ${accentClassMap[colorClass]}`} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        </div>
        <div>
          <div className="premium-font-sora" style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{value}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorClass === 'green' ? '#10B981' : colorClass === 'gold' ? '#F59E0B' : '#3B82F6' }}></span>
            {sub}
          </div>
        </div>
      </div>
    );
  };

  // ── Dashboard ─────────────────────────────────────────────────
  const renderDashboard = () => {
    const totalCount = stats.total || 1;
    const appPct = Math.round(((stats.approved || 0) / totalCount) * 100);
    const penPct = Math.round(((stats.pending || 0) / totalCount) * 100);
    const rejPct = Math.round(((stats.rejected || 0) / totalCount) * 100);
    const newPct = 100 - appPct - penPct - rejPct;
    const actualNewPct = newPct >= 0 ? newPct : 0;
    const donutData = [appPct, penPct, rejPct, actualNewPct];

    let trendData = [];
    let trendLabels = [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    if (monthlyTrend && monthlyTrend.length > 0) {
      trendData = monthlyTrend.map(t => t.count);
      trendLabels = monthlyTrend.map(t => months[(t._id.month - 1) % 12]);
    } else {
      // Dynamically generate the last 6 calendar months based on current date with 0 application count
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        trendData.push(0);
        trendLabels.push(months[d.getMonth()]);
      }
    }

    const displayTeam = teamList || [];

    return (
      <div>
        <div className="sbi-dashboard-header">
          <div>
            <h2 className="premium-font-sora sbi-dashboard-title" style={{ color:'#0B1F45', margin:0, fontWeight: 800, fontSize: 24 }}>Dashboard Overview</h2>
            <div className="sbi-dashboard-subtitle" style={{ fontSize:12, color:'#64748B', marginTop:4, fontWeight: 600 }}>Real-time Monitoring • Branch: Chennai Central • {role}</div>
          </div>
          <div className="sbi-dashboard-header-actions">
            <button className="btn btn-sm btn-premium-outline" onClick={exportExcel}>{loading ? <Spinner size={12}/> : ''} Export Excel</button>
            <button className="btn btn-sm btn-premium-outline" onClick={triggerBulkSyncSheets}>Sync Google Sheets</button>
            <button className="btn btn-sm btn-premium-bank" onClick={() => { logout(); navigate('/apply'); }}>+ New Application</button>
          </div>
        </div>
        <Grid cols={4} gap={20} style={{ marginBottom:24 }}>
          {renderStatCard("Total Applications", stats.total, "Real-time DB count", "blue")}
          {renderStatCard("Approved Applications", stats.approved, "Status: Approved", "green")}
          {renderStatCard("Pending Review", stats.pending, "Needs Attention", "gold")}
          {renderStatCard("Average Credit Score", `${stats.avgScore || 0}/100`, "Dynamic applicant mean", "purple")}
        </Grid>
        <Grid cols={2} gap={24} style={{ marginBottom:24 }}>
          <div className="banking-glass-card" style={{ padding: 24 }}>
            <Flex between style={{ marginBottom:16 }}>
              <div className="premium-font-sora" style={{ fontSize:14,fontWeight:800,color:'#0F172A' }}>Monthly Applications Trend</div>
              <span className="badge badge-green" style={{ borderRadius: 8, padding: '4px 10px', fontSize: 10 }}>Live</span>
            </Flex>
            <MiniBarChart data={trendData} labels={trendLabels} color="#0054A6" height={160}/>
          </div>
          <div className="banking-glass-card" style={{ padding: 24 }}>
            <Flex between style={{ marginBottom:16 }}>
              <div className="premium-font-sora" style={{ fontSize:14,fontWeight:800,color:'#0F172A' }}>Status Distribution</div>
              <span className="badge badge-blue" style={{ borderRadius: 8, padding: '4px 10px', fontSize: 10 }}>Live</span>
            </Flex>
            <Flex gap={20}>
              <DonutChart data={donutData} colors={['#10B981','#F59E0B','#EF4444','#64748B']} size={110} label={stats.total.toString()}/>
              <div style={{ flex:1 }}>
                {[['Approved', appPct, '#10B981'],['Pending', penPct, '#F59E0B'],['Rejected', rejPct, '#EF4444'],['New / Lead', actualNewPct, '#64748B']].map(([l,v,c])=>(
                  <div key={l} style={{ marginBottom:10 }}>
                    <Flex between style={{ marginBottom:4 }}>
                      <div style={{ fontSize:11,color:'#64748B',fontWeight:600 }}>{l}</div>
                      <div style={{ fontSize:11,fontWeight:800,color:c }}>{v}%</div>
                    </Flex>
                    <ProgressBar value={v} color={c} height={5}/>
                  </div>
                ))}
              </div>
            </Flex>
          </div>
        </Grid>
        <Grid cols={2} gap={24}>
          <div className="banking-glass-card" style={{ padding: 24 }}>
            <Flex between style={{ marginBottom:16 }}>
              <div className="premium-font-sora" style={{ fontSize:14,fontWeight:800,color:'#0F172A' }}>Recent Applications</div>
              <button className="btn btn-sm btn-ghost" style={{ borderRadius: 8, fontSize: 11 }} onClick={()=>setPage('applications')}>View all</button>
            </Flex>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {apps.slice(0,5).map(a=>{
                const initials = a.personal?.name ? a.personal.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'CC';
                return (
                  <div key={a._id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,background:'rgba(255,255,255,0.4)',border:'1px solid rgba(11, 31, 69, 0.03)',cursor:'pointer',transition:'all 0.2s' }} 
                    className="hover-light-bg"
                    onClick={() => setDetailApp(a)}>
                    <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg, #0054A6, #00A5EC)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,flexShrink:0 }}>
                      {initials}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:800,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.personal?.name}</div>
                      <div style={{ fontSize:11,color:'#64748B',marginTop:2 }}>{a.applicationId} • <span style={{ fontWeight:700,color:'#0054A6' }}>{a.eligibility?.recommendedCard || 'Evaluating'}</span></div>
                    </div>
                    <span className={`pill-status-fintech ${a.status?.toLowerCase().replace(' ', '-')}`} style={{ transform: 'scale(0.9)', transformOrigin: 'right center' }}>
                      {a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="banking-glass-card" style={{ padding: 24 }}>
            <div className="premium-font-sora" style={{ fontSize:14,fontWeight:800,marginBottom:16,color:'#0F172A' }}>Team Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayTeam.length > 0 ? (
                displayTeam.map(t=>(
                  <div key={t._id} style={{ background: 'rgba(255,255,255,0.4)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(11, 31, 69, 0.03)' }}>
                    <Flex between style={{ marginBottom:6 }}>
                      <div style={{ fontSize:12,fontWeight:800,color:'#0F172A' }}>{t.name} <span style={{ fontSize:10,fontWeight:600,color:'#64748B' }}>({t.role})</span></div>
                      <div style={{ fontSize:12,fontWeight:900,color:(t.conv || 0)>70?'#10B981':(t.conv || 0)>55?'#D97706':'#EF4444' }}>{t.conv || 0}% conversion</div>
                    </Flex>
                    <ProgressBar value={t.conv || 0} color={(t.conv || 0)>70?'#10B981':(t.conv || 0)>55?'#F59E0B':'#EF4444'} height={6}/>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#64748B', textAlign: 'center', padding: '30px 0', fontWeight: 600 }}>
                  No active team members registered in the database.
                </div>
              )}
            </div>
          </div>
        </Grid>
      </div>
    );
  };

  // ── Applications ──────────────────────────────────────────────
  const renderApplications = () => {
    const itemsPerPage = 6;
    const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
    const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusCount = (statusName) => {
      if (statusName === 'All') return apps.length;
      return apps.filter(a => a.status === statusName).length;
    };

    return (
      <div>
        <Flex between style={{ marginBottom: 20, gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h2 className="tracker-header-title">Application Tracker</h2>
            <div className="tracker-header-subtitle">Manage, review, and audit customer credit applications securely.</div>
          </div>
          <Flex gap={10} style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="tracker-search-bar">
              <Search size={14} color="#64748B" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search name, ID, PAN..."
                className="tracker-search-input" 
              />
            </div>
            <button className="btn-tracker-action outline" onClick={exportExcel}>
              <Download size={14} /> Excel Export
            </button>
            <button className="btn-tracker-action primary" onClick={triggerBulkSyncSheets}>
              <FileSpreadsheet size={14} /> Sync Google Sheets
            </button>
          </Flex>
        </Flex>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {['All', 'Approved', 'Under Verification', 'Pending Review', 'Rejected', 'New Lead', 'KYC Pending', 'Dispatched'].map(s => (
            <button key={s} className={`premium-filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s}
              <span className="premium-filter-chip-count">{getStatusCount(s)}</span>
            </button>
          ))}
        </div>

        {/* Data-Table */}
        <div className="premium-datatable-container">
          <table className="premium-datatable">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Customer</th>
                <th>Employment</th>
                <th>Income</th>
                <th>Card</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton-block" style={{ width: j === 0 ? '80px' : j === 1 ? '130px' : j === 3 ? '70px' : '100%' }}></div></td>
                    ))}
                  </tr>
                ))
              ) : paginatedApps.length > 0 ? (
                paginatedApps.map((a, idx) => {
                  const sal = a.salaried?.monthlySalary || Math.round((a.selfEmployed?.annualTurnover || 0) / 12);
                  const isZebra = idx % 2 === 1;
                  return (
                    <tr key={a._id} className={isZebra ? 'zebra' : ''}>
                      <td>
                        <span className="premium-font-sora" style={{ fontWeight: 800, color: '#0054A6', fontSize: 12 }}>
                          {a.applicationId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{a.personal.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{a.personal.mobile}</div>
                      </td>
                      <td>
                        <span style={{
                          background: a.employmentType === 'Salaried' ? '#E0F2FE' : '#F3E8FF',
                          color: a.employmentType === 'Salaried' ? '#0369A1' : '#6B21A8',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800
                        }}>
                          {a.employmentType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0F172A' }}>
                        ₹{sal.toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700, padding: '4px 10px' }}>
                          {a.eligibility.recommendedCard || 'Evaluating'}
                        </span>
                      </td>
                      <td className="premium-font-sora" style={{ fontWeight: 900, fontSize: 14, color: a.eligibility.score >= 80 ? '#10B981' : a.eligibility.score >= 65 ? '#D97706' : '#EF4444' }}>
                        {a.eligibility.score || '—'}
                      </td>
                      <td>
                        <span className={`pill-status-fintech ${a.status?.toLowerCase().replace(' ', '-')}`}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: {
                              'Approved': '#10B981',
                              'Rejected': '#EF4444',
                              'Under Verification': '#3B82F6',
                              'Pending Review': '#F5A623',
                              'New Lead': '#8B5CF6',
                              'KYC Pending': '#FF7A00',
                              'Dispatched': '#10B981'
                            }[a.status] || '#94A3B8',
                            display: 'inline-block'
                          }} />
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="compact-action-btn" onClick={() => setDetailApp(a)}>View</button>
                          <button className="compact-action-btn qd-btn" onClick={() => handleShowQD(a)}>QD</button>
                          {role === 'Manager' && (
                            <button className="compact-action-btn danger" onClick={() => handleDeleteApp(a)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div className="fintech-empty-state">
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>No Matching Applications</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>We couldn't find any credit card applications matching your search or filters.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination panel */}
          {filteredApps.length > 0 && (
            <div className="pagination-panel">
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                Showing <span style={{ color: '#0F172A', fontWeight: 800 }}>{((currentPage - 1) * itemsPerPage) + 1}</span> to <span style={{ color: '#0F172A', fontWeight: 800 }}>{Math.min(currentPage * itemsPerPage, filteredApps.length)}</span> of <span style={{ color: '#0F172A', fontWeight: 800 }}>{filteredApps.length}</span> applications
              </div>
              <div className="pagination-pages">
                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </button>

                {Array(totalPages).fill(0).map((_, i) => (
                  <button key={i} className={`pagination-page-number ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}

                <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const pages = { dashboard:renderDashboard, applications:renderApplications };
  return (
    <div className="sbi-dashboard-container fintech-admin-layout">
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
          height: 100vh;
          max-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1E293B;
          overflow: hidden;
        }

        /* Sticky Blurred Top Navbar */
        .fintech-navbar {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1.5px solid #E4EBF6 !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 54px;
          flex-shrink: 0;
          z-index: 100;
          position: sticky;
          top: 0;
          box-shadow: 0 2px 12px rgba(11, 31, 69, 0.03);
        }

        .navbar-brand-title {
          font-family: 'Sora', sans-serif !important;
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #0F172A !important;
          letter-spacing: -0.3px;
        }

        /* Compact, Modern Navbar Search Bar */
        .navbar-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F3F6FC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 0 12px;
          height: 36px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .navbar-search-bar:hover {
          background: #EEF2FF;
          border-color: #0054A6;
        }

        .navbar-search-bar:focus-within {
          background: #ffffff;
          border-color: #0054A6;
          box-shadow: 0 0 0 3px rgba(0, 84, 166, 0.12), 0 4px 12px rgba(11, 31, 69, 0.05);
        }

        .navbar-search-input {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          font-family: inherit !important;
          font-size: 12px !important;
          color: #0F172A !important;
          width: 160px !important;
          transition: width 0.3s ease !important;
          padding: 0 !important;
          height: 100% !important;
          box-shadow: none !important;
        }

        .navbar-search-bar:focus-within .navbar-search-input {
          width: 210px;
        }

        /* Compact Notifications Button */
        .navbar-notif-btn {
          position: relative;
          cursor: pointer;
          padding: 0 14px;
          height: 36px;
          background: #EEF2FF;
          border: 1px solid rgba(0, 84, 166, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .navbar-notif-btn:hover {
          background: #E0E7FF;
          border-color: #0054A6;
          transform: translateY(-1px);
        }

        .navbar-notif-label {
          font-size: 12px;
          color: #0054A6;
          font-weight: 700;
        }

        /* Compact Profile Section */
        .navbar-profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0054A6, #00A5EC);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          color: #fff;
          box-shadow: 0 2px 10px rgba(0, 84, 166, 0.25);
          border: 1.5px solid #fff;
          transition: all 0.2s ease;
        }

        .navbar-profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 14px rgba(0, 84, 166, 0.35);
        }

        .navbar-profile-name {
          font-size: 12px;
          font-weight: 800;
          color: #1E293B;
          line-height: 1.2;
        }

        .navbar-profile-role {
          font-size: 9.5px;
          color: #64748B;
          font-weight: 700;
          line-height: 1.2;
        }

        /* Tracker Toolbar Elements */
        .tracker-header-title {
          font-family: 'Sora', sans-serif !important;
          margin: 0;
          color: #0B1F45;
          font-weight: 800;
          font-size: 20px !important;
          letter-spacing: -0.5px;
        }

        .tracker-header-subtitle {
          font-size: 11px !important;
          color: #64748B;
          margin-top: 4px;
          font-weight: 600;
        }

        .tracker-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 0 14px;
          height: 36px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tracker-search-bar:hover {
          border-color: rgba(0, 84, 166, 0.3);
          background: #FAFCFF;
        }

        .tracker-search-bar:focus-within {
          border-color: #0054A6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(0, 84, 166, 0.12), 0 4px 12px rgba(11, 31, 69, 0.04);
        }

        .tracker-search-input {
          border: none !important;
          outline: none !important;
          background: transparent !important;
          font-family: inherit !important;
          font-size: 12px !important;
          width: 180px !important;
          color: #1E293B !important;
          padding: 0 !important;
          height: 100% !important;
          box-shadow: none !important;
        }

        /* Action Buttons */
        .btn-tracker-action {
          height: 36px !important;
          padding: 0 16px !important;
          border-radius: 10px !important;
          font-family: 'Sora', sans-serif !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: all 0.25s ease !important;
          border: none !important;
          white-space: nowrap !important;
        }

        .btn-tracker-action.primary {
          background: linear-gradient(135deg, #0054A6, #00A5EC) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(0, 84, 166, 0.18) !important;
        }

        .btn-tracker-action.primary:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 18px rgba(0, 84, 166, 0.28) !important;
        }

        .btn-tracker-action.outline {
          background: transparent !important;
          color: #0054A6 !important;
          border: 1.5px solid #0054A6 !important;
        }

        .btn-tracker-action.outline:hover {
          background: rgba(0, 84, 166, 0.05) !important;
          transform: translateY(-1px) !important;
        }

        .sbi-brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0054A6;
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
          background: #ffffff;
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
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .fintech-sidebar.collapsed .sidebar-target-card {
          display: none;
        }

        /* Premium Glassmorphic Stats Cards */
        .stat-card-premium {
          background: #ffffff;
          border: 1px solid var(--sbi-border-color);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(11, 31, 69, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .stat-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--sbi-blue-accent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .stat-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(11, 31, 69, 0.08);
          border-color: rgba(26, 86, 219, 0.2);
        }

        .stat-card-premium:hover::before {
          opacity: 1;
        }

        .stat-card-premium.blue::before { background: #1A56DB; }
        .stat-card-premium.green::before { background: #10B981; }
        .stat-card-premium.gold::before { background: #F59E0B; }
        .stat-card-premium.purple::before { background: #8B5CF6; }

        /* Filter Pill Chips */
        .premium-filter-chip {
          background: #ffffff !important;
          border: 1.5px solid #E2E8F0 !important;
          border-radius: 12px !important;
          padding: 8px 16px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #64748B !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          outline: none !important;
        }

        .premium-filter-chip:hover {
          border-color: rgba(0, 84, 166, 0.3) !important;
          background: #FAFCFF !important;
          color: #0054A6 !important;
        }

        .premium-filter-chip.active {
          background: linear-gradient(135deg, #0054A6, #00A5EC) !important;
          border-color: #0054A6 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(0, 84, 166, 0.2) !important;
        }

        .premium-filter-chip-count {
          font-size: 10px !important;
          font-weight: 800 !important;
          background: #F1F5F9 !important;
          color: #475569 !important;
          padding: 2px 8px !important;
          border-radius: 20px !important;
          transition: all 0.2s ease !important;
        }

        .premium-filter-chip.active .premium-filter-chip-count {
          background: rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
        }

        /* Dynamic Data-Table Overhaul */
        .premium-datatable-container {
          background: #ffffff !important;
          border: 1px solid #E4EBF6 !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 24px rgba(11, 31, 69, 0.04) !important;
          overflow-x: auto !important;
          margin-bottom: 24px !important;
          position: relative !important;
        }

        .premium-datatable {
          width: 100% !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          text-align: left !important;
        }

        .premium-datatable th {
          background: #F8FAFC !important;
          padding: 14px 20px !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          color: #475569 !important;
          border-bottom: 1.5px solid #E2E8F0 !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          font-family: 'Sora', sans-serif !important;
          letter-spacing: 0.5px !important;
        }

        .premium-datatable tr {
          border-bottom: 1px solid #F1F5F9 !important;
          transition: background-color 0.15s ease !important;
        }

        .premium-datatable tr:hover {
          background-color: rgba(241, 245, 249, 0.6) !important;
        }

        .premium-datatable tr.zebra {
          background-color: rgba(248, 250, 252, 0.45) !important;
        }

        .premium-datatable td {
          padding: 14px 20px !important;
          font-size: 13px !important;
          color: #334155 !important;
          vertical-align: middle !important;
          border-bottom: 1px solid #F1F5F9 !important;
        }

        /* Custom Status Pills Overrides */
        .pill-status-fintech {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 4px 10px !important;
          border-radius: 20px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: capitalize !important;
          box-shadow: none !important;
          border: 1px solid transparent !important;
          line-height: 1.2 !important;
        }

        .pill-status-fintech.approved {
          background: #E6F4EA !important;
          color: #137333 !important;
          border-color: rgba(19, 115, 51, 0.15) !important;
        }

        .pill-status-fintech.rejected {
          background: #FCE8E6 !important;
          color: #C5221F !important;
          border-color: rgba(197, 34, 31, 0.15) !important;
        }

        .pill-status-fintech.under-verification {
          background: #E8F0FE !important;
          color: #1A73E8 !important;
          border-color: rgba(26, 115, 232, 0.15) !important;
        }

        .pill-status-fintech.pending-review {
          background: #FEF7E0 !important;
          color: #B06000 !important;
          border-color: rgba(176, 96, 0, 0.15) !important;
        }

        .pill-status-fintech.new-lead {
          background: #F3E8FF !important;
          color: #6B21A8 !important;
          border-color: rgba(107, 33, 168, 0.15) !important;
        }

        .pill-status-fintech.dispatched {
          background: #E6FFFA !important;
          color: #006D5B !important;
          border-color: rgba(0, 109, 91, 0.15) !important;
        }

        .pill-status-fintech.kyc-pending {
          background: #FFEFE2 !important;
          color: #C2410C !important;
          border-color: rgba(194, 65, 12, 0.15) !important;
        }

        /* Beautiful Status Badges */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          letter-spacing: -0.1px;
        }

        .status-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-pill.approved { background: #E6F4EA; color: #137333; }
        .status-pill.approved .status-pill-dot { background: #137333; }

        .status-pill.under-verification { background: #E0F2FE; color: #0369A1; }
        .status-pill.under-verification .status-pill-dot { background: #0369A1; }

        .status-pill.under-review { background: #FEF3C7; color: #B45309; }
        .status-pill.under-review .status-pill-dot { background: #B45309; }

        .status-pill.kyc-verified { background: #E0F2FE; color: #0369A1; }
        .status-pill.kyc-verified .status-pill-dot { background: #0369A1; }

        .status-pill.rejected { background: #FCE8E6; color: #C5221F; }
        .status-pill.rejected .status-pill-dot { background: #C5221F; }

        .status-pill.new-lead { background: #EDE9FE; color: #6D28D9; }
        .status-pill.new-lead .status-pill-dot { background: #6D28D9; }

        .status-pill.kyc-pending { background: #FFEDD5; color: #EA580C; }
        .status-pill.kyc-pending .status-pill-dot { background: #EA580C; }

        .status-pill.card-assigned, .status-pill.dispatched { background: #E6F4EA; color: #137333; }
        .status-pill.card-assigned .status-pill-dot, .status-pill.dispatched .status-pill-dot { background: #137333; }

        /* Enhanced Fraud Alarms */
        .fraud-alarm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .fraud-alarm-badge.flagged {
          background: #FCE8E6;
          color: #C5221F;
          border: 1px solid rgba(197, 34, 31, 0.2);
        }

        .fraud-alarm-badge.clean {
          background: #E6F4EA;
          color: #137333;
          border: 1px solid rgba(19, 115, 51, 0.2);
        }

        /* Unified Compact Action Button Grid */
        .compact-action-btn {
          background: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          padding: 6px 14px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #475569 !important;
          cursor: pointer !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px !important;
          line-height: 1.2 !important;
        }

        .compact-action-btn:hover {
          background: #EDF2FA !important;
          border-color: rgba(0, 84, 166, 0.3) !important;
          color: #0054A6 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 10px rgba(0, 84, 166, 0.05) !important;
        }

        .compact-action-btn.qd-btn {
          color: #00838F !important;
          border-color: rgba(0, 131, 143, 0.2) !important;
          background: #E0F7FA !important;
        }

        .compact-action-btn.qd-btn:hover {
          background: #B2EBF2 !important;
          border-color: #00838F !important;
          color: #006064 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 10px rgba(0, 131, 143, 0.1) !important;
        }

        .compact-action-btn.danger {
          color: #EF4444 !important;
          border-color: rgba(239, 68, 68, 0.2) !important;
          background: #FEF2F2 !important;
        }

        .compact-action-btn.danger:hover {
          background: #EF4444 !important;
          border-color: #EF4444 !important;
          color: #ffffff !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
        }

        /* Glowing Loading Skeleton rows */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .skeleton-row td {
          padding: 18px 20px;
        }

        .skeleton-block {
          background: #E2E8F0;
          height: 16px;
          border-radius: 4px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        /* Illustrated Empty state */
        .fintech-empty-state {
          text-align: center;
          padding: 48px 24px;
          background: #ffffff;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 10px rgba(11, 31, 69, 0.1));
        }

        /* Compact Pagination Panel */
        .pagination-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
        }

        .pagination-btn {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-page-number {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-page-number.active {
          background: #0B1F45;
          border-color: #0B1F45;
          color: #fff;
          box-shadow: 0 2px 8px rgba(11, 31, 69, 0.15);
        }

        .pagination-page-number:hover:not(.active) {
          background: #F1F5F9;
        }

        /* Premium Enterprise Modal redesign */
        .premium-modal-wrapper {
          display: flex;
          flex-direction: column;
          background: #F4F7FC;
          font-family: 'Inter', sans-serif;
        }

        .premium-modal-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 30 !important;
          background: linear-gradient(135deg, #0A1C3E, #0054A6) !important;
          padding: 20px 24px !important;
          border-bottom: 3.5px solid #00A4E4 !important;
          box-shadow: 0 4px 20px rgba(0, 84, 166, 0.12) !important;
        }

        .premium-modal-close-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          font-size: 14px !important;
        }

        .premium-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: rotate(90deg) !important;
        }

        .premium-modal-body {
          padding: 24px !important;
          background: radial-gradient(100% 100% at 0% 0%, #FFFFFF 0%, #F5F7FC 100%) !important;
          overflow-y: auto !important;
        }

        /* Detail Card Grid */
        .premium-detail-card {
          background: #ffffff !important;
          border: 1.5px solid #E2E8F0 !important;
          border-radius: 12px !important;
          padding: 14px 18px !important;
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
        }

        .premium-detail-card:hover {
          border-color: rgba(0, 84, 166, 0.3) !important;
          box-shadow: 0 8px 20px rgba(0, 84, 166, 0.04) !important;
          transform: translateY(-1.5px) !important;
        }

        .premium-detail-card-icon-container {
          width: 36px !important;
          height: 36px !important;
          border-radius: 10px !important;
          background: rgba(0, 84, 166, 0.06) !important;
          color: #0054A6 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }

        .premium-detail-card-info {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
        }

        .premium-detail-card-label {
          font-size: 10px !important;
          color: #64748B !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .premium-detail-card-value {
          font-size: 13px !important;
          font-weight: 750 !important;
          color: #0F172A !important;
        }

        /* Recommended Card Widget */
        .premium-card-widget {
          background: linear-gradient(135deg, #0A1C3E, #1A3E7A) !important;
          border-radius: 14px !important;
          padding: 18px 24px !important;
          color: #ffffff !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          box-shadow: 0 8px 24px rgba(11, 31, 69, 0.12) !important;
          margin-bottom: 20px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .premium-card-widget::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          right: -10% !important;
          width: 200px !important;
          height: 200px !important;
          background: radial-gradient(circle, rgba(0, 165, 236, 0.15) 0%, transparent 70%) !important;
          pointer-events: none !important;
        }

        /* Section Container */
        .premium-modal-section {
          background: #ffffff !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 14px !important;
          padding: 20px !important;
          margin-bottom: 20px !important;
          box-shadow: 0 2px 12px rgba(11, 31, 69, 0.01) !important;
        }

        .premium-modal-section-title {
          font-family: 'Sora', sans-serif !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          color: #06122C !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          margin-bottom: 16px !important;
          padding-bottom: 10px !important;
          border-bottom: 1.5px solid #F1F5F9 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        /* Document cards */
        .premium-doc-card {
          background: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 12px !important;
          padding: 14px !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }

        .premium-doc-card:hover {
          border-color: rgba(0, 84, 166, 0.2) !important;
          background: #ffffff !important;
          box-shadow: 0 4px 15px rgba(0, 84, 166, 0.03) !important;
        }

        /* Interactive Timeline Feed */
        .premium-timeline {
          display: flex !important;
          flex-direction: column !important;
          gap: 14px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          padding-right: 6px !important;
        }

        .premium-timeline-item {
          display: flex !important;
          gap: 12px !important;
          font-size: 12px !important;
          position: relative !important;
          padding-bottom: 10px !important;
        }

        .premium-timeline-marker {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background: #0054A6 !important;
          margin-top: 5px !important;
          flex-shrink: 0 !important;
          box-shadow: 0 0 0 3px rgba(0, 84, 166, 0.15) !important;
        }

        .premium-timeline-marker.green {
          background: #10B981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
        }

        .premium-timeline-marker.orange {
          background: #F5A623 !important;
          box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15) !important;
        }

        /* Custom Reviewer Note Card */
        .premium-remarks-card {
          background: #FAFCFF !important;
          border-left: 4px solid #0054A6 !important;
          border-radius: 0 12px 12px 0 !important;
          padding: 12px 16px !important;
          margin-top: 10px !important;
          box-shadow: 0 2px 8px rgba(0, 84, 166, 0.02) !important;
        }

        /* Modern Connected Stepper */
        .premium-stepper-container {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          position: relative !important;
          width: 100% !important;
          padding: 10px 0 !important;
        }

        .premium-stepper-step {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          position: relative !important;
          z-index: 2 !important;
          flex: 1 !important;
        }

        .premium-stepper-circle {
          width: 28px !important;
          height: 28px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          transition: all 0.3s ease !important;
        }

        .premium-stepper-circle.active {
          background: #0054A6 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(0, 84, 166, 0.35) !important;
          border: 2px solid #0054A6 !important;
        }

        .premium-stepper-circle.completed {
          background: #10B981 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
          border: 2px solid #10B981 !important;
        }

        .premium-stepper-circle.rejected {
          background: #EF4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
          border: 2px solid #EF4444 !important;
        }

        .premium-stepper-circle.pending {
          background: #F1F5F9 !important;
          color: #94A3B8 !important;
          border: 2px solid #E2E8F0 !important;
        }

        .premium-stepper-line {
          position: absolute !important;
          top: 24px !important;
          left: 10% !important;
          right: 10% !important;
          height: 3px !important;
          background: #E2E8F0 !important;
          z-index: 1 !important;
        }

        .premium-stepper-line-progress {
          height: 100% !important;
          background: #10B981 !important;
          transition: width 0.3s ease !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .fintech-navbar {
            padding: 0 12px !important;
            height: 48px !important;
          }
          .sbi-scrollable-content {
            padding: 12px !important;
          }
          .navbar-brand-title {
            font-size: 13px !important;
            white-space: nowrap !important;
            max-width: 140px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .navbar-search-bar {
            display: none !important;
          }
          .navbar-notif-label {
            display: none !important;
          }
          .navbar-notif-btn {
            width: 32px !important;
            height: 32px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 50% !important;
            background: #F1F5F9 !important;
            border: none !important;
            position: relative !important;
            gap: 0 !important;
          }
          .navbar-notif-btn span {
            position: absolute !important;
            top: -3px !important;
            right: -3px !important;
            margin: 0 !important;
          }
          .navbar-profile-name, .navbar-profile-role {
            display: none !important;
          }
          
          /* Dashboard Title & Actions Stacking */
          .sbi-dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .sbi-dashboard-title {
            font-size: 20px !important;
          }
          .sbi-dashboard-subtitle {
            font-size: 11px !important;
          }
          .sbi-dashboard-header-actions {
            display: flex !important;
            width: 100% !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
          .sbi-dashboard-header-actions button {
            flex: 1 !important;
            min-width: 110px !important;
            padding: 8px 10px !important;
            font-size: 11px !important;
            justify-content: center !important;
            height: auto !important;
            white-space: nowrap !important;
          }

          /* KPI Accent Cards Mobile Optimization */
          .kpi-accent-card {
            padding: 14px 12px !important;
            gap: 6px !important;
            border-radius: 12px !important;
          }
          .kpi-accent-card .premium-font-sora {
            font-size: 20px !important;
          }
          .kpi-accent-card div:first-child div {
            font-size: 9.5px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .kpi-accent-card div:last-child {
            font-size: 9.5px !important;
            margin-top: 4px !important;
          }
          
          /* Form actions stacking */
          .flex.between {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          
          /* Table horizontal scrolling indicator */
          .sbi-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
        
        @media (max-width: 500px) {
          .premium-stepper-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding-left: 20px !important;
          }
          .premium-stepper-step {
            flex-direction: row !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
            flex: none !important;
          }
          .premium-stepper-line {
            left: 33px !important;
            top: 20px !important;
            bottom: 20px !important;
            width: 3px !important;
            height: auto !important;
            right: auto !important;
          }
          .premium-stepper-step span {
            margin-top: 0 !important;
            text-align: left !important;
          }
        }
      `}</style>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && <div className="sbi-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

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
            {SIDEBAR.map(item=>(
              <div key={item.id} className={`sidebar-item sidebar-glow-item ${page===item.id?'active':''}`} onClick={()=>{setPage(item.id); setSidebarOpen(false);}} title={item.label}>
                {item.icon && <span className="sidebar-item-icon">{item.icon}</span>}
                <span className="sidebar-item-label" style={{ fontWeight: 800 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ marginLeft:'auto',width:16,height:16,background:'#EF4444',borderRadius:'50%',fontSize:9,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900 }}>{item.badge}</span>
                )}
              </div>
            ))}
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
        {/* Navbar */}
        <div className="fintech-navbar nav-glass-sticky">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="sbi-hamburger-btn" onClick={() => setSidebarOpen(true)} style={{ color: '#ffffff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Menu size={22} />
            </button>
            <span className="navbar-brand-title">
              Admin Control Center
            </span>
          </div>
          <Flex gap={12} align="center">
            <div className="navbar-search-bar">
              <Search size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
              <input 
                placeholder="Search applications..." 
                className="navbar-search-input"
                onChange={e=>{setSearch(e.target.value);if(e.target.value)setPage('applications');}}
              />
            </div>
            <div className="navbar-notif-btn" onClick={()=>setShowNotif(p=>!p)}>
              <Bell size={14} style={{ color: '#0054A6', flexShrink: 0 }} />
              <span className="navbar-notif-label">Notifications</span>
              {notifsList.filter(n=>!n.read).length > 0 && (
                <span style={{ 
                  width:16,
                  height:16,
                  background:'#EF4444',
                  borderRadius:'50%',
                  fontSize:9,
                  color:'#fff',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontWeight:900,
                  boxShadow:'0 0 8px rgba(239, 68, 68, 0.4)' 
                }}>
                  {notifsList.filter(n=>!n.read).length}
                </span>
              )}
            </div>
            <Flex gap={8} align="center">
              <div className="navbar-profile-avatar">
                {(user?.name||'Admin').substring(0,2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="navbar-profile-name">{user?.name||'Admin User'}</div>
                <div className="navbar-profile-role">{role}</div>
              </div>
            </Flex>
          </Flex>
        </div>

        {/* Main content */}
        <div className="sbi-scrollable-content">
          {(pages[page]||renderDashboard)()}
        </div>
      </div>


      {/* QD Modal */}
      {qdApp && qdProfile && (
        <Modal onClose={()=>{setQdApp(null); setQdProfile(null);}} width={950}>
          <div className="premium-modal-wrapper">
            {/* Header */}
            <div className="premium-modal-header">
              <Flex between align="center">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={22} style={{ color: '#00A5EC' }} />
                    <span className="premium-font-sora" style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                      SBI QD PROFILE SYSTEM
                    </span>
                    <span className="badge badge-green" style={{ border: 'none', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: 10, fontWeight: 800, marginLeft: 10, padding: '2px 8px', borderRadius: 4 }}>
                      ACTIVE AUDIT
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 4, fontWeight: 600 }}>
                    Secure Banking Format • Report ID: {qdProfile.applicationId} • Generated {new Date(qdProfile.generatedAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <Flex gap={8} align="center">
                  <button className="btn btn-sm btn-premium-outline" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)', fontSize:11, display:'flex', alignItems:'center', gap:4 }} onClick={()=>handleExportPDF(qdApp._id, qdProfile.applicationId)}>
                    <Download size={12} /> Export PDF
                  </button>
                  <button className="btn btn-sm btn-premium-outline" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)', fontSize:11, display:'flex', alignItems:'center', gap:4 }} onClick={()=>handleExportExcel(qdApp._id, qdProfile.applicationId)}>
                    <FileSpreadsheet size={12} /> Export Excel
                  </button>
                  <button className="premium-modal-close-btn" style={{ marginLeft: 8 }} onClick={()=>{setQdApp(null); setQdProfile(null);}}>✕</button>
                </Flex>
              </Flex>
            </div>

            <div className="premium-modal-body">
              {/* Top Quick Audit Metrics */}
              <Grid cols={4} gap={16}>
                {/* 1. Eligibility Score */}
                <div className="premium-kpi-card">
                  <div className="premium-kpi-icon-container blue">
                    <TrendingUp size={20} />
                  </div>
                  <div className="premium-kpi-info">
                    <div className="premium-kpi-label">Eligibility Score</div>
                    <div className="premium-kpi-value" style={{ color: qdProfile.eligibility?.score >= 80 ? '#10B981' : qdProfile.eligibility?.score >= 65 ? '#D97706' : '#EF4444' }}>
                      {qdProfile.eligibility?.score || '0'}<span style={{ fontSize:12, color:'#94A3B8', fontWeight: 600 }}>/100</span>
                    </div>
                  </div>
                </div>

                {/* 2. Decision Engine */}
                <div className="premium-kpi-card">
                  <div className="premium-kpi-icon-container green">
                    <Cpu size={20} />
                  </div>
                  <div className="premium-kpi-info">
                    <div className="premium-kpi-label">Decision Engine</div>
                    <span className={`pill-status-fintech ${qdProfile.eligibility?.status?.toLowerCase().replace(' ', '-') || qdProfile.status?.toLowerCase()}`} style={{ fontSize: 10, padding: '2px 8px', marginTop: 2 }}>
                      {qdProfile.eligibility?.status || qdProfile.status}
                    </span>
                  </div>
                </div>

                {/* 3. Recommended Card */}
                <div className="premium-kpi-card">
                  <div className="premium-kpi-icon-container orange">
                    <CreditCard size={20} />
                  </div>
                  <div className="premium-kpi-info">
                    <div className="premium-kpi-label">Recommended Card</div>
                    <div className="premium-kpi-value" style={{ fontSize: 13, color: '#0F172A', marginTop: 2 }}>
                      {qdProfile.eligibility?.recommendedCard || '—'}
                    </div>
                  </div>
                </div>

                {/* 4. Risk Priority */}
                <div className="premium-kpi-card">
                  <div className="premium-kpi-icon-container red">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="premium-kpi-info">
                    <div className="premium-kpi-label">Risk Priority</div>
                    <div className="premium-kpi-value" style={{ fontSize: 13, color: qdProfile.fraud?.riskLevel === 'High' ? '#EF4444' : qdProfile.fraud?.riskLevel === 'Medium' ? '#D97706' : '#10B981', marginTop: 2 }}>
                      {qdProfile.fraud?.riskLevel || 'Low'} Risk
                    </div>
                  </div>
                </div>
              </Grid>

              {/* Split layout */}
              <div style={{ display:'flex', gap:20 }}>
                {/* Left Column - Core Data */}
                <div style={{ flex:1.2, display:'flex', flexDirection:'column', gap:20 }}>
                  
                  {/* Personal Details */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <User size={16} /> CUSTOMER PERSONAL DATA
                    </div>
                    <Grid cols={2} gap={12}>
                      {[
                        ['Full Name', qdProfile.personalDetails?.name, <User size={14} />],
                        ['Date of Birth', qdProfile.personalDetails?.dob ? new Date(qdProfile.personalDetails.dob).toLocaleDateString('en-IN') : '—', <Calendar size={14} />],
                        ['Age / Gender', `${qdProfile.personalDetails?.age || '—'} Yrs / ${qdProfile.personalDetails?.gender || '—'}`, <User size={14} />],
                        ['Mobile Number', qdProfile.personalDetails?.mobile, <Phone size={14} />],
                        ['Email Address', qdProfile.personalDetails?.email, <Mail size={14} />],
                        ['Father\'s Name', qdProfile.personalDetails?.fatherName, <User size={14} />],
                        ['Mother\'s Name', qdProfile.personalDetails?.motherName, <User size={14} />],
                        ['Nationality', qdProfile.personalDetails?.country || 'India', <MapPin size={14} />]
                      ].map(([k, v, icon]) => (
                        <div className="premium-detail-card" key={k}>
                          <div className="premium-detail-card-icon-container">
                            {icon}
                          </div>
                          <div className="premium-detail-card-info">
                            <div className="premium-detail-card-label">{k}</div>
                            <div className="premium-detail-card-value">{v || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </Grid>
                  </div>

                  {/* Residential Address */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <MapPin size={16} /> RESIDENTIAL ADDRESS PROFILE
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <div className="premium-detail-card" style={{ width: '100%' }}>
                        <div className="premium-detail-card-icon-container">
                          <MapPin size={16} />
                        </div>
                        <div className="premium-detail-card-info">
                          <div className="premium-detail-card-label">Full Address</div>
                          <div className="premium-detail-card-value" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {qdProfile.personalDetails?.address || '—'}
                          </div>
                        </div>
                      </div>
                      <Grid cols={3} gap={12}>
                        {[
                          ['City', qdProfile.personalDetails?.city],
                          ['State', qdProfile.personalDetails?.state],
                          ['Pincode', qdProfile.personalDetails?.pincode]
                        ].map(([k, v]) => (
                          <div className="premium-detail-card" key={k}>
                            <div className="premium-detail-card-icon-container">
                              <MapPin size={14} />
                            </div>
                            <div className="premium-detail-card-info">
                              <div className="premium-detail-card-label">{k}</div>
                              <div className="premium-detail-card-value">{v || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </Grid>
                    </div>
                  </div>

                  {/* KYC & Identity verification */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <Fingerprint size={16} /> KYC CREDENTIALS & ID MATCHING
                    </div>
                    <Grid cols={2} gap={12}>
                      <div className="premium-detail-card">
                        <div className="premium-detail-card-icon-container">
                          <CreditCard size={14} />
                        </div>
                        <div className="premium-detail-card-info">
                          <div className="premium-detail-card-label">PAN NUMBER</div>
                          <div className="premium-detail-card-value" style={{ fontFamily: 'Sora', fontWeight: 800 }}>
                            {qdProfile.kycDetails?.panNumber || '—'}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', marginTop:4 }}>
                            <span className={`pill-status-fintech ${qdProfile.kycDetails?.panVerified ? 'approved' : 'rejected'}`} style={{ padding: '1px 6px', fontSize: 9 }}>
                              {qdProfile.kycDetails?.panVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="premium-detail-card">
                        <div className="premium-detail-card-icon-container">
                          <Fingerprint size={14} />
                        </div>
                        <div className="premium-detail-card-info">
                          <div className="premium-detail-card-label">AADHAAR NUMBER</div>
                          <div className="premium-detail-card-value" style={{ fontFamily: 'Sora', fontWeight: 800 }}>
                            {qdProfile.kycDetails?.aadhaarMasked ? `XXXX-XXXX-${qdProfile.kycDetails.aadhaarMasked.slice(-4)}` : '—'}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', marginTop:4 }}>
                            <span className={`pill-status-fintech ${qdProfile.kycDetails?.aadhaarVerified ? 'approved' : 'rejected'}`} style={{ padding: '1px 6px', fontSize: 9 }}>
                              {qdProfile.kycDetails?.aadhaarVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Grid>

                    <Divider style={{ margin:'14px 0', borderColor: 'rgba(11,31,69,0.05)' }} />

                    <Grid cols={2} gap={12}>
                      <div className="premium-detail-card">
                        <div className="premium-detail-card-icon-container">
                          <TrendingUp size={14} />
                        </div>
                        <div className="premium-detail-card-info">
                          <div className="premium-detail-card-label">Name Match Score</div>
                          <div className="premium-detail-card-value" style={{ color: qdProfile.kycDetails?.nameMatchScore >= 85 ? '#10B981' : '#EF4444', fontFamily: 'Sora', fontWeight: 800 }}>
                            {qdProfile.kycDetails?.nameMatchScore ? `${qdProfile.kycDetails.nameMatchScore}%` : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="premium-detail-card">
                        <div className="premium-detail-card-icon-container">
                          <ShieldAlert size={14} />
                        </div>
                        <div className="premium-detail-card-info">
                          <div className="premium-detail-card-label">Name Mismatch Check</div>
                          <div className="premium-detail-card-value" style={{ color: qdProfile.kycDetails?.nameMismatch ? '#EF4444' : '#10B981', fontSize: 11 }}>
                            {qdProfile.kycDetails?.nameMismatch ? 'Mismatch Flagged' : 'Match Score Success'}
                          </div>
                        </div>
                      </div>
                    </Grid>
                  </div>

                  {/* Employment details */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <Briefcase size={16} /> EMPLOYMENT & INCOME PROFILE
                    </div>
                    <Grid cols={2} gap={12}>
                      {[
                        ['Employment Type', qdProfile.employment?.type, <Briefcase size={14} />],
                        ['Company / Business Name', qdProfile.employment?.companyName || qdProfile.employment?.businessName, <Briefcase size={14} />],
                        ['Designation / Business Type', qdProfile.employment?.designation || qdProfile.employment?.businessType, <Briefcase size={14} />],
                        ['Monthly Net Income', qdProfile.employment?.monthlySalary ? `₹${qdProfile.employment.monthlySalary.toLocaleString('en-IN')}` : qdProfile.employment?.annualTurnover ? `₹${Math.round(qdProfile.employment.annualTurnover/12).toLocaleString('en-IN')} (From Annual)` : '—', <DollarSign size={14} />],
                        ['Work Experience', `${qdProfile.employment?.workExpYears || qdProfile.employment?.businessYears || '0'} Years`, <Calendar size={14} />],
                        ['GST / Business ID', qdProfile.employment?.gstNumber || qdProfile.employment?.employeeId || '—', <Fingerprint size={14} />]
                      ].map(([k, v, icon]) => (
                        <div className="premium-detail-card" key={k}>
                          <div className="premium-detail-card-icon-container">
                            {icon}
                          </div>
                          <div className="premium-detail-card-info">
                            <div className="premium-detail-card-label">{k}</div>
                            <div className="premium-detail-card-value">{v || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </Grid>
                  </div>

                  {/* Financial details */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <TrendingUp size={16} /> BANK STATEMENT & FINANCIAL METRICS
                    </div>
                    <Grid cols={2} gap={12}>
                      {[
                        ['Bank Name', qdProfile.financial?.bankName, <CreditCard size={14} />],
                        ['Account Type', qdProfile.financial?.accountType, <Layers size={14} />],
                        ['IFSC Code', qdProfile.financial?.ifscCode, <Fingerprint size={14} />],
                        ['Avg Monthly Balance', qdProfile.financial?.avgBankBalance ? `₹${qdProfile.financial.avgBankBalance.toLocaleString('en-IN')}` : '₹0', <DollarSign size={14} />],
                        ['Monthly Credits', qdProfile.financial?.monthlyCredits ? `₹${qdProfile.financial.monthlyCredits.toLocaleString('en-IN')}` : '₹0', <TrendingUp size={14} />],
                        ['Monthly Debits', qdProfile.financial?.monthlyDebits ? `₹${qdProfile.financial.monthlyDebits.toLocaleString('en-IN')}` : '₹0', <TrendingUp size={14} />]
                      ].map(([k, v, icon]) => (
                        <div className="premium-detail-card" key={k}>
                          <div className="premium-detail-card-icon-container">
                            {icon}
                          </div>
                          <div className="premium-detail-card-info">
                            <div className="premium-detail-card-label">{k}</div>
                            <div className="premium-detail-card-value">{v || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </Grid>
                  </div>

                </div>

                {/* Right Column - Audit & Decision Engine */}
                <div style={{ flex:0.9, display:'flex', flexDirection:'column', gap:20 }}>

                  {/* Eligibility Engine Card */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <Cpu size={16} /> CREDIT ENGINE AUDIT LOG
                    </div>
                    <div className="premium-card-widget" style={{ marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:800, textTransform:'uppercase' }}>INDICATIVE CREDIT LIMIT</div>
                        <div className="premium-font-sora" style={{ fontSize:22, fontWeight:900, color:'#ffffff', marginTop:4 }}>
                          {qdProfile.eligibility?.creditLimit || '₹0'}
                        </div>
                      </div>
                      <CreditCard size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    
                    {qdProfile.eligibility?.positives?.length > 0 && (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, color:'#10B981', fontWeight:800, marginBottom:6, letterSpacing:'0.05em' }}>CREDIT ENGINE POSITIVES</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {qdProfile.eligibility.positives.map((p, i) => (
                            <div key={i} style={{ fontSize:11, color:'#065F46', background:'#ECFDF5', padding:'8px 12px', borderRadius:8, fontWeight:700, borderLeft:'3px solid #10B981', display:'flex', alignItems:'center', gap:6 }}>
                              <CheckCircle2 size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {qdProfile.eligibility?.reasons?.length > 0 && (
                      <div>
                        <div style={{ fontSize:10, color:'#EF4444', fontWeight:800, marginBottom:6, letterSpacing:'0.05em' }}>CREDIT ENGINE WARNINGS / NEGATIVES</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {qdProfile.eligibility.reasons.map((r, i) => (
                            <div key={i} style={{ fontSize:11, color:'#991B1B', background:'#FEF2F2', padding:'8px 12px', borderRadius:8, fontWeight:700, borderLeft:'3px solid #EF4444', display:'flex', alignItems:'center', gap:6 }}>
                              <AlertTriangle size={12} style={{ color: '#EF4444', flexShrink: 0 }} />
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fraud flags check */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <ShieldAlert size={16} /> RISK & FRAUD AUDITING
                    </div>
                     {qdProfile.fraud?.flagged ? (
                      <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:12, marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:800, color:'#991B1B', display:'flex', alignItems:'center', gap:6 }}>
                          <AlertTriangle size={14} /> SYSTEM SECURITY FRAUD ALERT
                        </div>
                        <div style={{ fontSize:11, color:'#7F1D1D', marginTop:4, fontWeight:600 }}>
                          Application flagged due to risk parameters matching security threat logs.
                        </div>
                      </div>
                    ) : (
                      <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:10, padding:12, marginBottom:14, fontSize:11, fontWeight:800, color:'#065F46', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <ShieldCheck size={14} /> SECURITY CHECK PASSED (NO ACTIVE THREATS)
                      </div>
                    )}

                    <Grid cols={2} gap={10} style={{ marginBottom:14 }}>
                      <div style={{ background:'rgba(11,31,69,0.03)', padding:10, borderRadius:8 }}>
                        <div style={{ fontSize:9, color:'#64748B', fontWeight:800 }}>FACE MATCH SCORE</div>
                        <div className="premium-font-sora" style={{ fontSize:14, fontWeight:900, color:'#0F172A', marginTop:2 }}>{qdProfile.fraud?.faceMatchScore ? `${qdProfile.fraud.faceMatchScore}%` : '—'}</div>
                      </div>
                      <div style={{ background:'rgba(11,31,69,0.03)', padding:10, borderRadius:8 }}>
                        <div style={{ fontSize:9, color:'#64748B', fontWeight:800 }}>DOCUMENT AUTH SCORE</div>
                        <div className="premium-font-sora" style={{ fontSize:14, fontWeight:900, color:'#0F172A', marginTop:2 }}>{qdProfile.fraud?.docAuthScore ? `${qdProfile.fraud.docAuthScore}%` : '—'}</div>
                      </div>
                    </Grid>

                    {qdProfile.fraud?.flagReasons?.length > 0 && (
                      <div>
                        <div style={{ fontSize:9, color:'#EF4444', fontWeight:800, marginBottom:6 }}>FLAG TRIGGER REASONS</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {qdProfile.fraud.flagReasons.map((reason, idx) => (
                            <div key={idx} style={{ fontSize:10, color:'#7F1D1D', background:'#FEF2F2', padding:'8px 12px', borderRadius:8, fontWeight:750, display:'flex', alignItems:'center', gap:6 }}>
                              <AlertTriangle size={12} style={{ color: '#EF4444', flexShrink: 0 }} />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Documents checklist */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <FileText size={16} /> UPLOADED KYC & PROOF DOCUMENTS
                    </div>
                    {qdProfile.documents?.length > 0 ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {qdProfile.documents.map((doc, i) => (
                          <div className="premium-doc-card" key={i}>
                            <Flex between align="center">
                              <div>
                                <span style={{ fontSize:11, fontWeight:900, color:'#1F2937', textTransform:'uppercase' }}>{doc.docType}</span>
                                <div style={{ fontSize:9, color:'#94A3B8', marginTop:2 }}>Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</div>
                              </div>
                              <span className={`pill-status-fintech ${doc.isVerified ? 'approved' : 'kyc-pending'}`} style={{ transform:'scale(0.85)', transformOrigin:'right center', margin:0 }}>
                                {doc.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </Flex>
                            {doc.fileName && (
                              <button className="compact-action-btn" style={{ width:'100%', padding:'6px 12px', borderRadius:8, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }} onClick={() => downloadDocument(doc.fileName, doc.fileName)}>
                                <Download size={12} /> Download Document
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center', padding:10 }}>No document uploads recorded.</div>
                    )}
                  </div>

                  {/* CRM remarks */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <MessageSquare size={16} /> WORKFLOW NOTES & EXECUTIVE REMARKS
                    </div>
                    {qdProfile.crm?.notes?.length > 0 ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:150, overflowY:'auto' }}>
                        {qdProfile.crm.notes.map((noteObj, idx) => (
                          <div key={idx} style={{ background:'rgba(11,31,69,0.03)', padding:'10px 12px', borderRadius:8, borderLeft:'3px solid #0054A6' }}>
                            <div style={{ fontSize:11, color:'#374151', fontWeight:700 }}>{noteObj.note}</div>
                            <div style={{ fontSize:9, color:'#94A3B8', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                              <Clock size={10} /> Added {new Date(noteObj.addedAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center', padding:10 }}>No remarks or notes recorded.</div>
                    )}
                  </div>

                  {/* Application timeline */}
                  <div className="premium-modal-section">
                    <div className="premium-modal-section-title">
                      <Clock size={16} /> APPLICATION AUDIT TIMELINE
                    </div>
                    {qdProfile.timeline?.length > 0 ? (
                      <div className="premium-timeline" style={{ maxHeight:150, overflowY:'auto' }}>
                        {qdProfile.timeline.slice(-4).reverse().map((t, i) => (
                          <div className="premium-timeline-item" key={i}>
                            <div className="premium-timeline-marker blue"></div>
                            <div>
                              <div style={{ fontWeight:800, color:'#374151', fontSize:11 }}>{t.event}</div>
                              {t.description && <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{t.description}</div>}
                              <div style={{ fontSize:9, color:'#94A3B8', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                                <Clock size={10} /> {new Date(t.timestamp).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center', padding:10 }}>No timeline activities found.</div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            <div style={{ background:'#F8FAFC', padding:'16px 24px', borderRadius:'0 0 16px 16px', display:'flex', justifyContent:'flex-end', gap:12, borderTop:'1px solid rgba(11,31,69,0.08)' }}>
              <button className="btn btn-premium-outline" onClick={()=>{setQdApp(null); setQdProfile(null);}}>Close Portal Audit</button>
              <button className="btn btn-premium-bank" onClick={()=>handleExportPDF(qdApp._id, qdProfile.applicationId)}>Export Detailed PDF Report</button>
            </div>
          </div>
        </Modal>
      )}

      {/* App Detail Modal */}
      {detailApp && (
        <Modal onClose={()=>setDetailApp(null)} width={800}>
          <div className="premium-modal-wrapper">
            {/* Header */}
            <div className="premium-modal-header">
              <Flex between style={{ width: '100%' }}>
                <div>
                  <div className="premium-font-sora" style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                    {detailApp.personal.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>APP ID: {detailApp.applicationId}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                    <span>PAN: {detailApp.kyc.panNumber}</span>
                  </div>
                </div>
                <Flex gap={12} align="center">
                  <span className={`pill-status-fintech ${detailApp.status?.toLowerCase().replace(' ', '-')}`}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: {
                        'Approved': '#10B981',
                        'Rejected': '#EF4444',
                        'Under Review': '#3B82F6',
                        'Under Verification': '#3B82F6',
                        'Pending Review': '#F5A623',
                        'New Lead': '#8B5CF6',
                        'KYC Pending': '#FF7A00',
                        'Dispatched': '#10B981',
                        'Card Assigned': '#10B981'
                      }[detailApp.status] || '#94A3B8',
                      display: 'inline-block'
                    }} />
                    {detailApp.status}
                  </span>
                  <button className="premium-modal-close-btn" onClick={() => setDetailApp(null)}>✕</button>
                </Flex>
              </Flex>
            </div>

            {/* Body */}
            <div className="premium-modal-body">
              {/* Grid cards for metadata info */}
              <Grid cols={2} gap={14} style={{ marginBottom: 20 }}>
                {[
                  ['PAN Number', detailApp.kyc.panNumber, <FileText size={18} />],
                  ['Aadhaar Number', detailApp.kyc.aadhaarNumber, <Fingerprint size={18} />],
                  ['Mobile Number', detailApp.personal.mobile, <Phone size={18} />],
                  ['Email Address', detailApp.personal.email, <Mail size={18} />],
                  ['Father\'s Name', detailApp.personal.fatherName, <User size={18} />],
                  ['Mother\'s Name', detailApp.personal.motherName, <User size={18} />],
                  ['Employment Type', detailApp.employmentType, <Briefcase size={18} />],
                  ['Monthly Income', `₹${(detailApp.salaried?.monthlySalary || Math.round((detailApp.selfEmployed?.annualTurnover || 0) / 12)).toLocaleString()}`, <TrendingUp size={18} />]
                ].map(([label, value, icon]) => (
                  <div key={label} className="premium-detail-card">
                    <div className="premium-detail-card-icon-container">
                      {icon}
                    </div>
                    <div className="premium-detail-card-info">
                      <span className="premium-detail-card-label">{label}</span>
                      <span className="premium-detail-card-value">{value || '—'}</span>
                    </div>
                  </div>
                ))}
              </Grid>

              {/* Recommended Product Widget */}
              <div className="premium-card-widget">
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    System Recommended Product
                  </div>
                  <div className="premium-font-sora" style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={18} style={{ color: '#00A4E4' }} />
                    {detailApp.eligibility.recommendedCard || 'Evaluating'}
                  </div>
                </div>
                <span 
                  className={`badge ${detailApp.fraud.flagged ? 'badge-red' : 'badge-green'}`} 
                  style={{ 
                    border: 'none', 
                    borderRadius: 20, 
                    padding: '6px 14px', 
                    fontSize: 10, 
                    fontWeight: 900, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4,
                    boxShadow: detailApp.fraud.flagged ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  {detailApp.fraud.flagged ? (
                    <>
                      <ShieldAlert size={12} />
                      Risk Flagged
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={12} />
                      Fraud Scan Clear
                    </>
                  )}
                </span>
              </div>

              {/* Documents Attachments Panel */}
              <div className="premium-modal-section">
                <div className="premium-modal-section-title">
                  <FileText size={14} style={{ color: '#0054A6' }} />
                  Uploaded Documents & Verification Attachments
                </div>
                {detailApp.documents && detailApp.documents.length > 0 ? (
                  <Grid cols={2} gap={14}>
                    {detailApp.documents.map(doc => (
                      <div key={doc._id || doc.fileName} className="premium-doc-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} color="#475569" />
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'capitalize', color: '#0F172A' }}>
                              {doc.docType} Document
                            </div>
                            <div style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {doc.originalName || doc.fileName}
                            </div>
                          </div>
                        </div>
                        <Flex gap={8} style={{ width: '100%' }}>
                          <button 
                            className="compact-action-btn" 
                            style={{ flex: 1, padding: '5px 8px', fontSize: 11, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }} 
                            onClick={() => handlePreviewDoc(doc.fileName, doc.originalName || doc.fileName)}
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                          <button 
                            className="compact-action-btn" 
                            style={{ flex: 1, padding: '5px 8px', fontSize: 11, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }} 
                            onClick={() => handleDownloadDoc(doc.fileName, doc.originalName || doc.fileName)}
                          >
                            <Download size={12} />
                            Download
                          </button>
                        </Flex>
                      </div>
                    ))}
                  </Grid>
                ) : (
                  <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                    No verification documents uploaded yet.
                  </div>
                )}
              </div>

              {/* Real-time Lifecycle Tracker */}
              <div className="premium-modal-section">
                <div className="premium-modal-section-title">
                  <Layers size={14} style={{ color: '#0054A6' }} />
                  Application Lifecycle Stage
                </div>
                <div className="premium-stepper-container">
                  <div className="premium-stepper-line">
                    <div 
                      className="premium-stepper-line-progress" 
                      style={{ 
                        width: `${
                          (() => {
                            const lifecycleSteps = [
                              { active: ['Submitted', 'New Lead', 'Documents Uploaded', 'Under Review', 'Under Verification', 'Pending Review', 'KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                              { active: ['Under Review', 'Under Verification', 'Pending Review', 'KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                              { active: ['KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                              { active: ['Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                              { active: ['Card Assigned', 'Dispatched'].includes(detailApp.status) }
                            ];
                            const activeCount = lifecycleSteps.filter(s => s.active).length;
                            return activeCount <= 1 ? 0 : ((activeCount - 1) / (lifecycleSteps.length - 1)) * 100;
                          })()
                        }%` 
                      }} 
                    />
                  </div>

                  {[
                    { label: 'Submitted', active: ['Submitted', 'New Lead', 'Documents Uploaded', 'Under Review', 'Under Verification', 'Pending Review', 'KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                    { label: 'Under Review', active: ['Under Review', 'Under Verification', 'Pending Review', 'KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                    { label: 'KYC Verified', active: ['KYC Verified', 'KYC Pending', 'Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                    { label: 'Approved', active: ['Approved', 'Conditionally Approved', 'Card Printed', 'Card Assigned', 'Dispatched'].includes(detailApp.status) },
                    { label: 'Assigned', active: ['Card Assigned', 'Dispatched'].includes(detailApp.status) }
                  ].map((s, idx, arr) => {
                    let circleClass = 'pending';
                    if (detailApp.status === 'Rejected' && !s.active) {
                      if (idx === 3) circleClass = 'rejected';
                    } else if (s.active) {
                      circleClass = 'completed';
                    }

                    return (
                      <div key={s.label} className="premium-stepper-step">
                        <div className={`premium-stepper-circle ${circleClass}`}>
                          {circleClass === 'rejected' ? '✕' : circleClass === 'completed' ? '✓' : idx + 1}
                        </div>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 700, 
                          marginTop: 8, 
                          color: circleClass === 'completed' ? '#10B981' : circleClass === 'rejected' ? '#EF4444' : '#64748B', 
                          textAlign: 'center' 
                        }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verification Logs & Remarks Feed */}
              <div className="premium-modal-section">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, borderBottom:'1.5px solid #F1F5F9', paddingBottom:10 }}>
                  <div className="premium-modal-section-title" style={{ margin:0, padding:0, border: 'none' }}>
                    <Clock size={14} style={{ color: '#0054A6' }} />
                    Audit Trail & Remarks
                  </div>
                  <button 
                    className="btn btn-sm btn-premium-outline" 
                    style={{ padding: '6px 14px', fontSize: 11, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }} 
                    onClick={() => { setCrmApp(detailApp); setCrmNote(''); setCrmPriority('Medium'); setCrmFollowUpType('Call Scheduled'); }}
                  >
                    <Plus size={12} />
                    Add Remark
                  </button>
                </div>

                <div className="premium-timeline">
                  {/* Timeline Events */}
                  {detailApp.timeline && detailApp.timeline.length > 0 ? (
                    detailApp.timeline.map((evt, idx) => {
                      let markerColor = 'blue';
                      if (evt.event?.toLowerCase().includes('approved') || evt.event?.toLowerCase().includes('clear') || evt.event?.toLowerCase().includes('success')) {
                        markerColor = 'green';
                      } else if (evt.event?.toLowerCase().includes('flag') || evt.event?.toLowerCase().includes('fail') || evt.event?.toLowerCase().includes('reject')) {
                        markerColor = 'orange';
                      }

                      return (
                        <div key={evt._id || idx} className="premium-timeline-item">
                          <div className={`premium-timeline-marker ${markerColor}`} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                              <span style={{ fontWeight: 800, color: markerColor === 'green' ? '#10B981' : markerColor === 'orange' ? '#EF4444' : '#0054A6' }}>
                                {evt.event}
                              </span>
                              <span style={{ color: '#94A3B8', fontSize: 10, fontWeight: 600 }}>
                                {new Date(evt.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', color: '#475569', fontWeight: 550, lineHeight: 1.4 }}>
                              {evt.description || 'System state progression'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                      No timeline events logged.
                    </div>
                  )}

                  {/* CRM/Admin Remarks */}
                  {detailApp.crm?.notes && detailApp.crm.notes.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px dashed #E2E8F0', paddingTop: 12 }}>
                      <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageSquare size={12} />
                        Reviewer Remarks Feed
                      </div>
                      {detailApp.crm.notes.map((note, idx) => (
                        <div key={note._id || idx} className="premium-remarks-card">
                          <p style={{ color: '#0F172A', fontWeight: 700, margin: 0, fontSize: 12, lineHeight: 1.4 }}>
                            "{note.note}"
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: 10, marginTop: 6, fontWeight: 600 }}>
                            <span>By: {note.addedBy?.name || 'Admin Officer'}</span>
                            <span>{new Date(note.addedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <Flex gap={10} style={{ marginTop: 14 }}>
                {/* Progressive Actions based on standard banking lifecycle */}
                {(['Submitted', 'Documents Uploaded', 'New Lead'].includes(detailApp.status)) && (
                  <>
                    <button className="btn btn-premium-bank" style={{ flex: 2, padding: '10px 14px' }} onClick={() => transitionAppStatus(detailApp._id, 'Under Review')}>Start "Under Review"</button>
                    <button className="btn btn-premium-outline" style={{ flex: 1, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '10px 14px' }} onClick={() => rejectApp(detailApp._id)}>Reject</button>
                  </>
                )}
                
                {(['Under Review', 'Under Verification', 'Pending Review'].includes(detailApp.status)) && (
                  <>
                    <button className="btn btn-premium-bank" style={{ flex: 2, padding: '10px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} onClick={() => transitionAppStatus(detailApp._id, 'KYC Verified')}>Verify KYC & Identity</button>
                    <button className="btn btn-premium-outline" style={{ flex: 1, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '10px 14px' }} onClick={() => rejectApp(detailApp._id)}>Reject</button>
                  </>
                )}

                {(['KYC Verified', 'KYC Pending'].includes(detailApp.status)) && (
                  <>
                    <button className="btn btn-premium-bank" style={{ flex: 2, padding: '10px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} onClick={() => approveApp(detailApp._id)}>Approve Credit Card</button>
                    <button className="btn btn-premium-outline" style={{ flex: 1, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '10px 14px' }} onClick={() => rejectApp(detailApp._id)}>Reject</button>
                  </>
                )}

                {(['Approved', 'Conditionally Approved', 'Card Printed'].includes(detailApp.status)) && (
                  <button className="btn btn-premium-bank" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #F5A623, #D97706)', border: 'none', boxShadow: '0 4px 15px rgba(245, 166, 35, 0.3)' }} onClick={() => transitionAppStatus(detailApp._id, 'Card Assigned')}>Assign & Dispatch Credit Card</button>
                )}

                {detailApp.status === 'Rejected' && (
                  <button className="btn btn-premium-outline" style={{ flex: 1, padding: '12px' }} onClick={() => transitionAppStatus(detailApp._id, 'Under Review')}>Re-evaluate & Review Application</button>
                )}

                {(detailApp.status === 'Card Assigned' || detailApp.status === 'Dispatched') && (
                  <div style={{ flex: 1, padding: '12px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 12, fontSize: 12, fontWeight: 800, textAlign: 'center', boxShadow: '0 2px 10px rgba(6, 95, 70, 0.05)' }}>
                    Card successfully printed & dispatched! Onboarding completed.
                  </div>
                )}
              </Flex>
            </div>
          </div>
        </Modal>
      )}

      {/* Dynamic Document Preview Overlay Modal */}
      {previewDocUrl && (
        <Modal onClose={() => { window.URL.revokeObjectURL(previewDocUrl); setPreviewDocUrl(null); }} width={800}>
          <div style={{ background:'linear-gradient(135deg,#0B1F45,#1A3A7A)', padding:'14px 20px', borderRadius:'16px 16px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff', fontFamily:"'Sora',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>Document Preview — {previewDocTitle}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Btn variant="outline" size="sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', gap:4 }} onClick={() => handleDownloadDoc(previewDocFilename, previewDocTitle)}>Download</Btn>
              <Btn variant="ghost" size="sm" style={{ color:'rgba(255,255,255,.7)', borderColor:'rgba(255,255,255,.2)' }} onClick={() => { window.URL.revokeObjectURL(previewDocUrl); setPreviewDocUrl(null); }}>✕ Close</Btn>
            </div>
          </div>
          <div style={{ padding:10, height:'70vh', background:'#F1F5F9', display:'flex', justifyContent:'center', alignItems:'center', position:'relative' }}>
            {previewDocTitle.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewDocUrl} width="100%" height="100%" style={{ border:'none', borderRadius:8 }} title="PDF Document Preview" />
            ) : ['.jpg', '.jpeg', '.png', '.webp'].some(ext => previewDocTitle.toLowerCase().endsWith(ext)) ? (
              <div style={{ maxWidth:'100%', maxHeight:'100%', overflow:'auto', display:'flex', justifyContent:'center', alignItems:'center', width:'100%', height:'100%' }}>
                <img src={previewDocUrl} alt="Document Preview" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:8, boxShadow:'0 4px 20px rgba(0,0,0,.15)' }} />
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:40 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#1E293B', marginTop:12 }}>Preview Not Supported for this File Type</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>Please download the file directly to view its contents.</div>
                <Btn variant="primary" style={{ marginTop:16, margin:'16px auto 0 auto' }} onClick={() => handleDownloadDoc(previewDocFilename, previewDocTitle)}>Download Document</Btn>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CRM Note Modal */}
      {crmApp && (
        <Modal onClose={()=>setCrmApp(null)} width={400}>
          <div style={{ padding:24 }}>
            <Flex between style={{ marginBottom:16 }}>
              <div style={{ fontSize:16,fontWeight:800 }}>CRM Note — {crmApp.personal?.name}</div>
              <Btn variant="ghost" size="sm" onClick={()=>setCrmApp(null)}>✕</Btn>
            </Flex>
            <Select label="Follow-up Type" options={['Call Scheduled','WhatsApp Sent','Email Sent','Meeting Set','Awaiting Docs']} value={crmFollowUpType} onChange={e=>setCrmFollowUpType(e.target.value)}/>
            <Textarea label="Note" rows={4} value={crmNote} onChange={e=>setCrmNote(e.target.value)} placeholder="Add your follow-up note here..."/>
            <Input label="Next Follow-up Date & Time" type="datetime-local" value={crmFollowUpDate} onChange={e=>setCrmFollowUpDate(e.target.value)}/>
            <Select label="Priority" options={['Low','Medium','High']} value={crmPriority} onChange={e=>setCrmPriority(e.target.value)}/>
            <Flex gap={10} style={{ justifyContent:'flex-end',marginTop:8 }}>
              <Btn variant="ghost" onClick={()=>setCrmApp(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={saveCRMNote}>{loading ? <Spinner size={12}/> : 'Save Note'}</Btn>
            </Flex>
          </div>
        </Modal>
      )}
      {/* ── Custom Delete Confirmation Modal ── */}
      {deleteConfirmApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s ease-out'
        }} onClick={() => setDeleteConfirmApp(null)}>
          <div style={{
            background: 'rgba(11, 31, 69, 0.94)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '32px 24px 24px',
            width: '100%',
            maxWidth: 420,
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            margin: '0 16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertTriangle size={28} color="#EF4444" />
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 12,
              fontFamily: "'Sora', sans-serif"
            }}>Confirm Deletion</h3>
            <p style={{
              fontSize: 13,
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: 28,
              padding: '0 10px'
            }}>
              Are you sure you want to permanently delete the credit card application of <strong style={{ color: '#fff' }}>{deleteConfirmApp.personal?.name || 'Unknown'}</strong> (<span style={{ color: '#00A4E4', fontWeight: 700 }}>{deleteConfirmApp.applicationId || 'N/A'}</span>)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              onClick={() => setDeleteConfirmApp(null)}>
                Cancel
              </button>
              <button style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)'; }}
              onClick={() => executeDeleteApp(deleteConfirmApp._id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
