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
  Bell, 
  AlertTriangle, 
  Sparkles, 
  LogOut, 
  User,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';

export const Navbar = ({ 
  activeView, 
  setActiveView, 
  unreadCount = 0, 
  onOpenNotifications, 
  onOpenSos,
  onLoadDemoData,
  demoLoading = false 
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { language, setLanguage, t, languages } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: t('healthReports') || 'Reports', icon: FileText },
    { id: 'compare', label: t('compareReports') || 'Compare', icon: GitCompare },
    { id: 'tracker', label: t('healthTracker') || 'Health Tracker', icon: Activity },
    { id: 'trends', label: t('healthTrends') || 'Trends', icon: TrendingUp },
    { id: 'medicines', label: t('medicines') || 'Medicines', icon: Pill },
    { id: 'careconnect', label: t('careConnect') || 'CareConnect', icon: Video },
    { id: 'adherence', label: t('adherence') || 'Adherence', icon: CalendarCheck },
    { id: 'timeline', label: t('timeline') || 'Timeline', icon: Clock },
    { id: 'copilot', label: t('aiCopilot') || 'AI Copilot', icon: Bot },
    { id: 'guardians', label: t('guardians') || 'Guardians', icon: Users }
  ];

  return (
    <nav className="navbar" id="vitacare-navbar">
      {/* Brand Section */}
      <div className="brand-section" onClick={() => setActiveView(isAdmin ? 'admin' : 'dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-icon">
          <Heart size={22} fill="#fff" />
        </div>
        <div className="brand-text">
          <h1>VitaCare AI</h1>
          <span className="tagline">Personal Health Copilot</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-links">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              id={`nav-tab-${item.id}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Admin Portal Tab */}
        <button
          className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveView('admin')}
          id="nav-tab-admin"
          style={{
            color: activeView === 'admin' ? '#fff' : (isAdmin ? 'var(--primary)' : 'var(--text-secondary)'),
            fontWeight: isAdmin ? 700 : 500
          }}
          title="Secure Administration Console"
        >
          <ShieldCheck size={16} color={activeView === 'admin' ? '#fff' : 'var(--primary)'} />
          <span>{t('adminPanel') || 'Admin Portal'}</span>
        </button>
      </div>

      {/* Action Buttons & Profile */}
      <div className="nav-actions">
        {/* Multi-Language Selector Dropdown (Requirement 4) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-alt)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <Globe size={15} color="var(--primary)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            id="global-language-selector"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--navy)',
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Select Language"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* 1-Click Sample Data */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onLoadDemoData}
          disabled={demoLoading}
          title="Populate complete verified patient clinical records"
          style={{ borderStyle: 'dashed', color: 'var(--primary-dark)', background: 'var(--primary-light)' }}
        >
          <Sparkles size={14} color="var(--primary)" />
          {demoLoading ? 'Loading...' : 'Sample Records'}
        </button>

        {/* Notification Bell */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenNotifications}
          style={{ position: 'relative', padding: '8px 10px' }}
          id="btn-notifications-trigger"
          title="Notification Center"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--status-red)',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Emergency SOS Button */}
        <button
          className="btn btn-danger btn-sm"
          onClick={onOpenSos}
          id="btn-emergency-sos"
          title="Trigger Emergency SOS"
          style={{ fontWeight: 800, letterSpacing: '0.03em' }}
        >
          <AlertTriangle size={16} />
          <span>{t('sos') || 'SOS'}</span>
        </button>

        {/* User Avatar & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-light)' }}>
          <div 
            title={`${user?.name || 'User'} (${user?.role || 'patient'})`}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isAdmin ? 'var(--status-red)' : 'var(--navy)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {user ? user.name.charAt(0) : 'P'}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            title={t('logout') || 'Log out'}
            style={{ padding: '8px' }}
            id="btn-logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
