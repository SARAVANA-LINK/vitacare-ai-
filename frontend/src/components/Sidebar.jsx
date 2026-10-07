import React from 'react';
import { 
  Heart, 
  LayoutDashboard, 
  FileText, 
  GitCompare, 
  Activity, 
  TrendingUp, 
  Pill, 
  Video, 
  CalendarCheck, 
  Clock, 
  Bot, 
  Users, 
  LogOut, 
  ShieldCheck, 
  X,
  ChevronRight,
  ExternalLink,
  Shield,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const Sidebar = ({ 
  activeView, 
  setActiveView, 
  isOpen, 
  onClose,
  portalMode = 'user',
  onSwitchPortal
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { websiteName, logoUrl } = useBranding();
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  // Navigation Items for User Portal
  const navSections = [
    {
      title: t('dailyCareRegimen') || 'DAILY CARE & REGIMEN',
      items: [
        { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
        { id: 'tracker', label: t('healthTracker') || 'Health Tracker', icon: Activity, badge: t('verified') || 'Verified' },
        { id: 'medicines', label: t('medicines') || 'Medicines', icon: Pill },
        { id: 'careconnect', label: t('careConnect') || 'CareConnect Video', icon: Video, badge: t('live') || 'Live' }
      ]
    },
    {
      title: t('diagnosticsAnalytics') || 'DIAGNOSTICS & ANALYTICS',
      items: [
        { id: 'reports', label: t('healthReports') || 'Health Reports', icon: FileText },
        { id: 'compare', label: t('compareReports') || 'Compare Reports', icon: GitCompare },
        { id: 'trends', label: t('healthTrends') || 'Biomarker Trends', icon: TrendingUp },
        { id: 'adherence', label: t('adherence') || 'Adherence Analytics', icon: CalendarCheck },
        { id: 'timeline', label: t('timeline') || 'Medical Timeline', icon: Clock }
      ]
    },
    {
      title: t('aiCareNetwork') || 'AI & CARE NETWORK',
      items: [
        { id: 'copilot', label: t('aiCopilot') || 'AI Health Copilot', icon: Bot },
        { id: 'guardians', label: t('guardians') || 'Guardians & Proxy', icon: Users },
        { id: 'alerts', label: t('alertHistoryTitle') || 'Alert & Escalation History', icon: History }
      ]
    }
  ];

  const handleNavClick = (id) => {
    setActiveView(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Vertical Sidebar */}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} id="vitacare-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {logoUrl && !imgError ? (
              <img 
                src={logoUrl} 
                alt={websiteName || 'Brand Logo'} 
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} 
              />
            ) : (
              <Heart size={20} fill="#fff" />
            )}
          </div>
          <div className="brand-text">
            <h2>{websiteName || t('appTitle') || 'VitaCare AI'}</h2>
            <span className="tagline">{t('personalCopilot') || 'Personal Health Copilot'}</span>
          </div>
          {/* Close button on mobile */}
          <button 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Portal Indicator Badge */}
        <div style={{ padding: '0 18px 12px 18px' }}>
          <div style={{
            background: portalMode === 'admin' ? 'rgba(220, 38, 38, 0.08)' : 'var(--primary-subtle)',
            border: `1px solid ${portalMode === 'admin' ? 'rgba(220, 38, 38, 0.2)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: portalMode === 'admin' ? '#dc2626' : '#10b981'
              }} />
              <strong style={{ color: portalMode === 'admin' ? '#991b1b' : 'var(--navy)' }}>
                {portalMode === 'admin' ? (t('adminPortal') || 'ADMIN PORTAL') : (t('patientPortal') || 'PATIENT PORTAL')}
              </strong>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              v2.4
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="sidebar-menu-scroll">
          {navSections.map((sec, idx) => (
            <div key={idx} className="sidebar-section">
              <div className="sidebar-section-title">
                {sec.title}
              </div>
              <div className="sidebar-nav-list">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                      id={`sidebar-link-${item.id}`}
                    >
                      <Icon size={18} className="sidebar-item-icon" />
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.badge && (
                        <span className={`sidebar-item-badge ${
                          item.id === 'careconnect' ? 'badge-live' : 'badge-verified'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin Switch Link (if authorized admin) */}
          {isAdmin && (
            <div className="sidebar-section" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <button
                className="sidebar-nav-item admin-switch-btn"
                onClick={() => {
                  if (onSwitchPortal) onSwitchPortal('admin');
                  if (onClose) onClose();
                }}
                style={{
                  background: 'rgba(220, 38, 38, 0.06)',
                  color: '#dc2626',
                  border: '1px solid rgba(220, 38, 38, 0.15)'
                }}
              >
                <ShieldCheck size={18} color="#dc2626" />
                <span className="sidebar-item-label">{t('switchToAdminCms') || 'Switch to Admin CMS'}</span>
                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer: User Card & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {user ? user.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">
                {user ? user.name : (t('patientUser') || 'Patient User')}
              </div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? `🛡️ ${t('administrator') || 'Administrator'}` : `${t('blood') || 'Blood'}: ${user?.bloodGroup || 'O+'}`}
              </div>
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              title={t('logout') || 'Log out'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
