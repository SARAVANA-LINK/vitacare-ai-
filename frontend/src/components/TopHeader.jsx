import React from 'react';
import { 
  Menu, 
  Globe, 
  Bell, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  User, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const TopHeader = ({
  onToggleSidebar,
  activeViewTitle,
  unreadCount = 0,
  onOpenNotifications,
  onOpenSos,
  onLoadDemoData,
  demoLoading = false,
  portalMode = 'user',
  onSwitchPortal
}) => {
  const { user, isAdmin } = useAuth();
  const { language, setLanguage, t, languages } = useTranslation();
  const { websiteName, logoUrl } = useBranding();
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <header className="top-header" id="vitacare-top-header">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="top-header-left">
        <button
          className="top-header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          id="btn-sidebar-toggle"
        >
          <Menu size={22} />
        </button>

        <div className="top-header-title-wrapper">
          <div className="top-header-breadcrumb">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {logoUrl && !imgError && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  onError={() => setImgError(true)}
                  style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} 
                />
              )}
              {websiteName || t('appTitle') || 'VitaCare'}
            </span>
            <ChevronRight size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {portalMode === 'admin' ? (t('adminPortal') || 'Admin CMS') : (t('patientPortal') || 'Health Portal')}
            </span>
          </div>
          <h1 className="top-header-title">
            {activeViewTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="top-header-right">
        {/* Multi-Language Selector Dropdown */}
        <div className="header-lang-selector">
          <Globe size={15} color="var(--primary)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            id="global-language-selector"
            className="lang-select"
            title={t('selectLanguage') || 'Choose Language'}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName || lang.name} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* 1-Click Sample Records (Patient mode) */}
        {portalMode === 'user' && (
          <button
            className="btn btn-secondary btn-sm header-sample-btn"
            onClick={onLoadDemoData}
            disabled={demoLoading}
            title={t('populateSampleRecords') || 'Populate complete verified patient clinical records'}
          >
            <Sparkles size={14} color="var(--primary)" />
            <span className="btn-label-desktop">{demoLoading ? (t('loading') || 'Loading...') : (t('sampleRecords') || 'Sample Records')}</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="header-icon-btn"
          onClick={onOpenNotifications}
          id="btn-notifications-trigger"
          title={t('notifications') || 'Notification Center'}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="header-notification-badge">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Emergency SOS Button */}
        {portalMode === 'user' && (
          <button
            className="btn btn-danger btn-sm header-sos-btn"
            onClick={onOpenSos}
            id="btn-emergency-sos"
            title={t('triggerEmergencySos') || 'Trigger Emergency SOS'}
          >
            <AlertTriangle size={15} />
            <span>{t('sos') || 'SOS'}</span>
          </button>
        )}

        {/* Portal Switch Link */}
        {portalMode === 'user' ? (
          <button
            className="portal-link-btn admin"
            onClick={() => onSwitchPortal('admin')}
            title={t('adminPortal') || 'Open Admin Portal'}
            id="btn-portal-switch-admin"
          >
            <ShieldCheck size={15} color="#dc2626" />
            <span className="btn-label-desktop">{t('adminPortal') || 'Admin Portal'}</span>
          </button>
        ) : (
          <button
            className="portal-link-btn patient"
            onClick={() => onSwitchPortal('user')}
            title={t('patientPortal') || 'Return to Patient Portal'}
            id="btn-portal-switch-user"
          >
            <User size={15} color="var(--primary)" />
            <span className="btn-label-desktop">{t('patientPortal') || 'Patient Portal'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
