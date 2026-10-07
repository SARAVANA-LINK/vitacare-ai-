import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './i18n/LanguageContext';
import { api } from './api/apiClient';

// Components
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { NotificationDrawer } from './components/NotificationDrawer';
import { EmergencySosModal } from './components/EmergencySosModal';
import { PrescriptionUploadModal } from './components/PrescriptionUploadModal';
import { ReportUploadModal } from './components/ReportUploadModal';
import { CareConnectModal } from './components/CareConnectModal';
import { MedicineReminderModal } from './components/MedicineReminderModal';

// Views
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ReportsView } from './views/ReportsView';
import { CompareReportsView } from './views/CompareReportsView';
import { HealthTrackerView } from './views/HealthTrackerView';
import { HealthTrendsView } from './views/HealthTrendsView';
import { MedicinesView } from './views/MedicinesView';
import { CareConnectView } from './views/CareConnectView';
import { AdherenceView } from './views/AdherenceView';
import { TimelineView } from './views/TimelineView';
import { AiCopilotView } from './views/AiCopilotView';
import { GuardianView } from './views/GuardianView';
import { AlertHistoryView } from './views/AlertHistoryView';
import { AdminPanelView } from './views/AdminPanelView';

export function App() {
  const { user, isLoading, isAdmin, logout } = useAuth();
  const { t } = useTranslation();
  
  // URL & Portal Detection (/user vs /admin)
  const getInitialPortal = () => {
    if (typeof window === 'undefined') return 'user';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin' || search.includes('mode=admin') || search.includes('portal=admin')) {
      return 'admin';
    }
    return 'user';
  };

  const [portalMode, setPortalMode] = useState(getInitialPortal);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Modals State
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCareConnectOpen, setIsCareConnectOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeReminderSchedule, setActiveReminderSchedule] = useState(null);

  // Unread notifications & sample loading
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoBanner, setDemoBanner] = useState('');

  // Handle URL changes & back/forward navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const mode = getInitialPortal();
      setPortalMode(mode);

      const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
      const validUserViews = ['dashboard', 'reports', 'compare', 'tracker', 'trends', 'medicines', 'careconnect', 'adherence', 'timeline', 'copilot', 'guardians', 'alerts'];
      
      if (mode === 'admin') {
        setActiveView('admin');
      } else if (validUserViews.includes(hash)) {
        setActiveView(hash);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const switchPortal = (targetMode) => {
    setPortalMode(targetMode);
    if (targetMode === 'admin') {
      window.history.pushState(null, '', '/admin');
      window.location.hash = '#/admin';
      setActiveView('admin');
    } else {
      window.history.pushState(null, '', '/user');
      window.location.hash = '#/user';
      setActiveView('dashboard');
    }
  };

  const refreshNotificationCount = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotificationCount();
    }
  }, [user]);

  const handleLoadDemoData = async () => {
    try {
      setDemoLoading(true);
      await api.loadDemoData();
      setDemoBanner('Sample clinical dataset loaded. Verified reports, vitals, prescriptions, and timeline are ready.');
      await refreshNotificationCount();
      setTimeout(() => setDemoBanner(''), 6000);
      setActiveView('dashboard');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '4px solid var(--border-light)',
            borderTopColor: 'var(--primary)',
            margin: '0 auto 16px auto',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontWeight: 600 }}>Initializing VitaCare AI...</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show Portal-Specific Login Screen
  if (!user) {
    return (
      <AuthView 
        portalMode={portalMode} 
        onSwitchPortal={switchPortal} 
      />
    );
  }

  // Normal patient attempting to access /admin portal -> Strict RBAC Access Denied
  if (portalMode === 'admin' && !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fef2f2',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '500px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 20px 35px -5px rgba(220, 38, 38, 0.1)',
          border: '1px solid #fecaca'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <h2 style={{ color: '#991b1b', marginBottom: '8px' }}>403 — Unauthorized Access</h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
            You are currently signed in as a patient user (<strong>{user.email}</strong>). Normal users do not have administrative privileges to access the Admin Portal or CMS.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => switchPortal('user')}
            >
              Return to Patient User Portal
            </button>
            <button
              className="btn btn-secondary"
              onClick={logout}
            >
              Log Out and Sign In as Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const viewTitles = {
    dashboard: t('dashboard') || 'Personal Health Overview',
    tracker: t('healthTracker') || 'Unified Health Tracker & Intake Verification',
    medicines: t('medicines') || 'Medication Regimen & Escalation',
    careconnect: t('careConnect') || 'CareConnect — Live Video Supervision',
    reports: t('reports') || 'Diagnostic Lab Reports & OCR Archives',
    compare: t('compare') || 'Compare Diagnostic Panels & Differentials',
    trends: t('trends') || 'Physiological Biomarker Trends',
    adherence: t('adherence') || 'Medication Adherence Analytics',
    timeline: t('timeline') || 'Medical Event History & Audit Log',
    copilot: t('aiCopilot') || 'VitaCare AI Clinical Health Copilot',
    guardians: t('guardians') || 'Authorized Healthcare Proxies & Guardians',
    admin: t('adminPanel') || 'Administrator Control Center & Dynamic CMS'
  };

  return (
    <div className="saas-layout">
      {/* 1. VERTICAL LEFT SIDEBAR */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        portalMode={portalMode}
        onSwitchPortal={switchPortal}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="saas-main-wrapper">
        {/* Top Header Bar */}
        <TopHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeViewTitle={portalMode === 'admin' ? 'Administrator Command Center & CMS' : (viewTitles[activeView] || 'Personal Health Portal')}
          unreadCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSos={() => setIsSosModalOpen(true)}
          onLoadDemoData={handleLoadDemoData}
          demoLoading={demoLoading}
          portalMode={portalMode}
          onSwitchPortal={switchPortal}
        />

        {/* Demo Data Feedback Banner */}
        {demoBanner && (
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span>{demoBanner}</span>
            <button
              onClick={() => setDemoBanner('')}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          {portalMode === 'admin' ? (
            <AdminPanelView onSwitchPortal={switchPortal} />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView
                  onAddPrescription={() => setIsRxModalOpen(true)}
                  onAddReport={() => setIsReportModalOpen(true)}
                  onOpenMedicineReminder={(schedule) => setActiveReminderSchedule(schedule)}
                  onViewReport={() => setActiveView('reports')}
                  setActiveView={setActiveView}
                />
              )}

              {activeView === 'reports' && (
                <ReportsView
                  onAddReport={() => setIsReportModalOpen(true)}
                  onCompareReports={() => setActiveView('compare')}
                />
              )}

              {activeView === 'compare' && (
                <CompareReportsView
                  onBackToReports={() => setActiveView('reports')}
                />
              )}

              {activeView === 'tracker' && (
                <HealthTrackerView
                  onAddReport={() => setIsReportModalOpen(true)}
                />
              )}

              {activeView === 'trends' && (
                <HealthTrendsView
                  onAddReport={() => setIsReportModalOpen(true)}
                />
              )}

              {activeView === 'medicines' && (
                <MedicinesView
                  onAddPrescription={() => setIsRxModalOpen(true)}
                  onOpenReminder={(schedule) => setActiveReminderSchedule(schedule)}
                />
              )}

              {activeView === 'careconnect' && (
                <CareConnectView
                  onStartVideoCheckIn={() => setIsCareConnectOpen(true)}
                />
              )}

              {activeView === 'adherence' && (
                <AdherenceView />
              )}

              {activeView === 'timeline' && (
                <TimelineView />
              )}

              {activeView === 'copilot' && (
                <AiCopilotView />
              )}

              {activeView === 'guardians' && (
                <GuardianView />
              )}

              {activeView === 'alerts' && (
                <AlertHistoryView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <PrescriptionUploadModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        onSuccess={() => {
          refreshNotificationCount();
          setActiveView('medicines');
        }}
      />

      <ReportUploadModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          refreshNotificationCount();
          setActiveView('tracker');
        }}
      />

      <CareConnectModal
        isOpen={isCareConnectOpen}
        onClose={() => setIsCareConnectOpen(false)}
        medicine={{ id: 'med-1', name: 'Metformin', dosage: '500 mg', instructions: 'Take with food' }}
        scheduleId={null}
        onMedicationConfirmed={() => {
          refreshNotificationCount();
        }}
      />

      <EmergencySosModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onRefresh={refreshNotificationCount}
      />

      {activeReminderSchedule && (
        <MedicineReminderModal
          isOpen={!!activeReminderSchedule}
          schedule={activeReminderSchedule}
          onClose={() => setActiveReminderSchedule(null)}
          onConfirmed={() => {
            refreshNotificationCount();
            setActiveReminderSchedule(null);
          }}
          onStartCareConnect={() => {
            setIsCareConnectOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
