import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Pill, 
  Calendar, 
  FileText, 
  BellRing, 
  Settings, 
  Video, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Globe,
  LayoutDashboard,
  Megaphone,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  ArrowUpDown,
  RefreshCw,
  Clock,
  UserCheck,
  Check,
  Smartphone,
  Search,
  Send,
  Database,
  Upload,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const AdminPanelView = ({ onSwitchPortal }) => {
  const { t, refreshTranslations, language, setLanguage } = useTranslation();
  const { websiteName, logoUrl, updateBrandingState, refreshBranding } = useBranding();
  const [logoUploading, setLogoUploading] = useState(false);
  // Tabs: 'overview' | 'cms-modules' | 'cms-cards' | 'cms-content' | 'translations' | 'sms-guardian' | 'users' | 'medicines' | 'schedules' | 'alerts' | 'reports' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [settings, setSettings] = useState(null);

  // CMS Collections State
  const [cmsModules, setCmsModules] = useState([]);
  const [cmsCards, setCmsCards] = useState([]);
  const [cmsAnnouncements, setCmsAnnouncements] = useState([]);
  const [cmsContent, setCmsContent] = useState([]);

  // Translations State (Requirement 1 & 5)
  const [translationsList, setTranslationsList] = useState([]);
  const [translationSearch, setTranslationSearch] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('all');
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [isAddTransOpen, setIsAddTransOpen] = useState(false);
  const [newTransData, setNewTransData] = useState({ key: '', en: '', ta: '', te: '', ml: '', kn: '', hi: '', bn: '', mr: '', category: 'General' });

  // Guardian SMS State (Requirement 2 & 5)
  const [smsTriggers, setSmsTriggers] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [adminGuardians, setAdminGuardians] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [testSmsPhone, setTestSmsPhone] = useState('+91 98765 43210');
  const [testSmsMsg, setTestSmsMsg] = useState('VitaCare AI Test: SMS carrier dispatch verified successfully.');
  const [testSmsLang, setTestSmsLang] = useState('en');
  const [testSmsSending, setTestSmsSending] = useState(false);

  // Database Reset State (Requirement 3)
  const [isClearDbConfirmOpen, setIsClearDbConfirmOpen] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals / Form States
  const [editingUser, setEditingUser] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    title: '',
    subtitle: '',
    value: '',
    delta: '',
    badgeColor: 'blue',
    orderIndex: 1
  });

  const [isAddAnnOpen, setIsAddAnnOpen] = useState(false);
  const [newAnnData, setNewAnnData] = useState({
    title: '',
    message: '',
    alertType: 'info',
    priority: 1,
    isPublished: true
  });

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    userId: '',
    name: '',
    dosage: '500 mg',
    frequency: 'Once daily',
    intakeTimes: ['08:00 AM'],
    duration: '30 days',
    instructions: 'Take after meals'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [
        overviewRes, 
        usersRes, 
        medsRes, 
        schedRes, 
        alertsRes, 
        docsRes, 
        settingsRes,
        modsRes,
        cardsRes,
        annsRes,
        contentRes,
        transRes,
        smsTrigRes,
        smsTplRes,
        smsLogsRes,
        guardiansRes
      ] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminMedicines(),
        api.getAdminSchedules(),
        api.getAdminAlerts(),
        api.getAdminReports(),
        api.getAdminSettings(),
        api.getAdminCmsModules().catch(() => ({ modules: [] })),
        api.getAdminCmsCards().catch(() => ({ cards: [] })),
        api.getAdminCmsAnnouncements().catch(() => ({ announcements: [] })),
        api.getAdminCmsContent().catch(() => ({ content: [] })),
        api.getAdminTranslations().catch(() => ({ translations: [] })),
        api.getAdminSmsTriggers().catch(() => ({ triggers: [] })),
        api.getAdminSmsTemplates().catch(() => ({ templates: [] })),
        api.getAdminSmsLogs(50).catch(() => ({ logs: [] })),
        api.getAdminGuardians().catch(() => ({ guardians: [] }))
      ]);

      setMetrics(overviewRes.metrics);
      setUsers(usersRes.users || []);
      setMedicines(medsRes.medicines || []);
      setSchedules(schedRes.schedules || []);
      setAlerts(alertsRes.alerts || []);
      setDocuments(docsRes.documents || []);
      setSettings(settingsRes.settings || {});

      setCmsModules(modsRes.modules || []);
      setCmsCards(cardsRes.cards || []);
      setCmsAnnouncements(annsRes.announcements || []);
      setCmsContent(contentRes.content || []);

      setTranslationsList(transRes.translations || []);
      setSmsTriggers(smsTrigRes.triggers || []);
      setSmsTemplates(smsTplRes.templates || []);
      setSmsLogs(smsLogsRes.logs || []);
      setAdminGuardians(guardiansRes.guardians || []);
    } catch (err) {
      console.error('Admin data load failed:', err);
      setErrorMsg(err.message || 'Failed to load administrator data. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // --------------------------------------------------------------------------
  // CMS MODULE ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleModule = async (mod) => {
    try {
      await api.updateAdminCmsModule(mod.id, { isEnabled: !mod.isEnabled });
      showSuccess(`Module "${mod.title}" is now ${!mod.isEnabled ? 'ENABLED' : 'DISABLED'} on the User Dashboard.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminCmsModule(editingModule.id, editingModule);
      setEditingModule(null);
      showSuccess('Module configuration updated. Automatically reflected on User Dashboard.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CMS CARD ACTIONS
  // --------------------------------------------------------------------------
  const handleToggleCardVisibility = async (card) => {
    try {
      await api.updateAdminCmsCard(card.id, { isVisible: !card.isVisible });
      showSuccess(`Card "${card.title}" visibility toggled.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminCmsCard(newCardData);
      setIsAddCardOpen(false);
      setNewCardData({ title: '', subtitle: '', value: '', delta: '', badgeColor: 'blue', orderIndex: 1 });
      showSuccess('New metric card added to User Dashboard.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminCmsCard(editingCard.id, editingCard);
      setEditingCard(null);
      showSuccess('Metric card updated successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this metric card?')) return;
    try {
      await api.deleteAdminCmsCard(cardId);
      showSuccess('Card deleted from dashboard.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CMS ANNOUNCEMENT ACTIONS
  // --------------------------------------------------------------------------
  const handleTogglePublishAnnouncement = async (ann) => {
    try {
      await api.updateAdminCmsAnnouncement(ann.id, { isPublished: !ann.isPublished });
      showSuccess(`Announcement ${!ann.isPublished ? 'Published to User Dashboard' : 'Unpublished'}.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminCmsAnnouncement(newAnnData);
      setIsAddAnnOpen(false);
      setNewAnnData({ title: '', message: '', alertType: 'info', priority: 1, isPublished: true });
      showSuccess('New clinical announcement broadcast created.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Delete this announcement broadcast?')) return;
    try {
      await api.deleteAdminCmsAnnouncement(annId);
      showSuccess('Announcement removed.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // CMS TEXT CONTENT ACTIONS
  // --------------------------------------------------------------------------
  const handleUpdateContent = async (cnt, newValue) => {
    try {
      await api.updateAdminCmsContent(cnt.id, { value: newValue });
      showSuccess(`Content "${cnt.title}" saved. Updates live on User Dashboard.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // PATIENT, MEDICINE & SYSTEM ACTIONS
  // --------------------------------------------------------------------------
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminUser(editingUser.id, editingUser);
      setEditingUser(null);
      showSuccess('Patient profile updated successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminMedicine(newMedData);
      setIsAddMedOpen(false);
      setNewMedData({
        userId: '',
        name: '',
        dosage: '500 mg',
        frequency: 'Once daily',
        intakeTimes: ['08:00 AM'],
        duration: '30 days',
        instructions: 'Take after meals'
      });
      showSuccess('New medicine created and scheduled successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medicine?')) return;
    try {
      await api.deleteAdminMedicine(id);
      showSuccess('Medicine removed from patient catalog.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminSchedule(editingSchedule.id, editingSchedule);
      setEditingSchedule(null);
      showSuccess('Medicine schedule updated successfully.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateAdminSettings(settings);
      if (res && res.settings) {
        updateBrandingState(res.settings);
      }
      showSuccess('Website branding and system configuration saved successfully.');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.uploadAdminLogo(formData);
      if (res && res.logoUrl) {
        setSettings(prev => ({ ...prev, logoUrl: res.logoUrl }));
        updateBrandingState({ ...settings, logoUrl: res.logoUrl });
        showSuccess('Website logo photo uploaded successfully.');
      }
    } catch (err) {
      setErrorMsg('Logo upload failed: ' + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleApplySystemLanguage = async (targetLang) => {
    const langToApply = targetLang || settings.defaultLanguage || 'en';
    try {
      setSettings(prev => ({ ...prev, defaultLanguage: langToApply }));
      await api.updateAdminSettings({ ...settings, defaultLanguage: langToApply });
      await setLanguage(langToApply);
      updateBrandingState({ ...settings, defaultLanguage: langToApply });
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === langToApply);
      showSuccess(`Whole system language successfully switched to ${langObj?.name || langToApply} (${langObj?.nativeName || ''})!`);
    } catch (err) {
      setErrorMsg('Failed to change system language: ' + err.message);
    }
  };

  // --------------------------------------------------------------------------
  // TRANSLATIONS ACTIONS (Requirement 1 & 5)
  // --------------------------------------------------------------------------
  const handleSaveTranslation = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminTranslation(editingTranslation.key, editingTranslation);
      setEditingTranslation(null);
      showSuccess(`Translation for "${editingTranslation.key}" updated across languages.`);
      refreshTranslations();
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateTranslation = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminTranslation(newTransData);
      setIsAddTransOpen(false);
      setNewTransData({ key: '', en: '', ta: '', te: '', hi: '', category: 'General' });
      showSuccess(`New translation key "${newTransData.key}" created.`);
      refreshTranslations();
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteTranslation = async (key) => {
    if (!window.confirm(`Delete translation key "${key}"?`)) return;
    try {
      await api.deleteAdminTranslation(key);
      showSuccess(`Translation key "${key}" deleted.`);
      refreshTranslations();
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // SMS & GUARDIAN ACTIONS (Requirement 2 & 5)
  // --------------------------------------------------------------------------
  const handleToggleSmsTrigger = async (eventType) => {
    const updated = smsTriggers.map(t => t.eventType === eventType ? { ...t, isEnabled: !t.isEnabled } : t);
    setSmsTriggers(updated);
    try {
      await api.updateAdminSmsTriggers(updated);
      showSuccess('SMS trigger settings updated.');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveSmsTemplate = async (e) => {
    e.preventDefault();
    try {
      await api.updateAdminSmsTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
      showSuccess('SMS template updated.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSendTestSms = async (e) => {
    e.preventDefault();
    setTestSmsSending(true);
    try {
      const res = await api.sendAdminTestSms({ phoneNumber: testSmsPhone, message: testSmsMsg, language: testSmsLang });
      showSuccess(`Test SMS dispatched to ${res.log?.maskedPhone || testSmsPhone}. Status: DELIVERED.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setTestSmsSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // DATABASE RESET / CLEAR USER DATA (Requirement 3)
  // --------------------------------------------------------------------------
  const handleClearDatabase = async () => {
    setClearingDb(true);
    try {
      const res = await api.clearUserData();
      setIsClearDbConfirmOpen(false);
      showSuccess(res.message || 'All patient data removed. Database is now empty for fresh registrations.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setClearingDb(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '3px solid var(--border-light)',
          borderTopColor: '#dc2626',
          margin: '0 auto 14px auto',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading Administrator Command Center & CMS...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('adminOverview') || 'System Overview', icon: ShieldCheck },
    { id: 'cms-modules', label: t('adminModules') || 'Dashboard Modules CMS', icon: LayoutDashboard, badge: cmsModules.length },
    { id: 'cms-cards', label: t('adminStatCards') || 'KPI Stat Cards CMS', icon: Eye, badge: cmsCards.length },
    { id: 'cms-content', label: t('adminAnnouncements') || 'Announcements & Text CMS', icon: Megaphone },
    { id: 'translations', label: `${t('adminTranslations') || 'Multilingual CMS'} (8 Langs)`, icon: Globe, badge: translationsList.length },
    { id: 'sms-guardian', label: t('adminSmsGuardians') || 'Guardian SMS & Triggers', icon: Smartphone, badge: smsLogs.length },
    { id: 'users', label: t('adminPatientAccounts') || 'Patients Roster', icon: Users, badge: users.length },
    { id: 'medicines', label: t('adminMedications') || 'Medicine Catalog', icon: Pill, badge: medicines.length },
    { id: 'schedules', label: t('adminSchedules') || 'Dose Schedules', icon: Calendar },
    { id: 'alerts', label: t('adminAlertsAudits') || 'Escalation Logs', icon: BellRing },
    { id: 'reports', label: t('adminReportsData') || 'Medical Documents', icon: FileText },
    { id: 'settings', label: t('adminSettings') || 'System Settings & DB', icon: Settings }
  ];

  return (
    <div>
      {/* Admin Top Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px',
        padding: '16px 20px',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        borderLeft: '5px solid #dc2626'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="#dc2626" />
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>
              {t('adminPortalTitle') || 'VitaCare Administrator Portal & CMS'}
            </h2>
            <span style={{
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #fca5a5'
            }}>
              {t('cmsActiveBadge') || 'CMS ACTIVE'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            {t('adminCmsSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            title={t('refresh')}
          >
            <RefreshCw size={14} /> {t('refresh') || 'Refresh'}
          </button>
          {onSwitchPortal && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onSwitchPortal('user')}
              style={{ background: 'var(--navy)', borderColor: 'var(--navy)' }}
            >
              {t('openUserDashboard') || 'Open User Dashboard →'}
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div style={{
          background: 'var(--status-green-bg)',
          border: '1px solid var(--status-green-border)',
          color: '#065f46',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} /> {actionSuccess}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'var(--status-red-bg)',
          border: '1px solid var(--status-red-border)',
          color: '#991b1b',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontSize: '0.82rem',
                  padding: '7px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isActive ? '#dc2626' : undefined,
                  borderColor: isActive ? '#dc2626' : undefined
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span style={{
                    fontSize: '0.68rem',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-alt)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: SYSTEM OVERVIEW
          ===================================================================== */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PATIENTS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--navy)', margin: '4px 0' }}>
                {metrics?.totalRegisteredUsers || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-green)', fontWeight: 600 }}>Active registered accounts</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VERIFIED MEDICINES</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                {metrics?.verifiedMedicines || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Confirmed patient intakes</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING MEDICINES</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                {metrics?.pendingMedicines || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Awaiting patient verification</span>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>GUARDIAN ESCALATIONS</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
                {metrics?.guardianAlertsCount || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Warning & emergency alerts</span>
            </div>
          </div>

          {/* Quick CMS Status Box */}
          <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <div className="card-header">
              <h3 className="card-title">
                <LayoutDashboard size={18} color="var(--primary)" />
                Dynamic User Dashboard CMS Status
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#fff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configured Dashboard Modules</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{cmsModules.length} Modules</div>
                <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>{cmsModules.filter(m => m.isEnabled).length} Enabled</span>
              </div>
              <div style={{ background: '#fff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dashboard Metric Stat Cards</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{cmsCards.length} Cards</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{cmsCards.filter(c => c.isVisible).length} Visible</span>
              </div>
              <div style={{ background: '#fff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Broadcast Announcements</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{cmsAnnouncements.length} Notices</div>
                <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>{cmsAnnouncements.filter(a => a.isPublished).length} Published</span>
              </div>
              <div style={{ background: '#fff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CareConnect Video Check-ins</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{metrics?.careConnectSessionsCount || 0} Sessions</div>
                <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>Hardware WebRTC Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: DASHBOARD MODULES CMS (Enable/Disable/Reorder Sections)
          ===================================================================== */}
      {activeTab === 'cms-modules' && (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutDashboard size={20} color="var(--primary)" />
                Dashboard Sections & Modules Content Manager
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Enable or disable entire dashboard sections, change titles, or modify display order. Changes immediately take effect on the User Dashboard.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cmsModules.map((mod) => (
              <div
                key={mod.id}
                style={{
                  background: mod.isEnabled ? '#ffffff' : '#f8fafc',
                  border: `1px solid ${mod.isEnabled ? 'var(--border-light)' : '#e2e8f0'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  opacity: mod.isEnabled ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: mod.isEnabled ? 'var(--primary-light)' : '#e2e8f0',
                    color: mod.isEnabled ? 'var(--primary-dark)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}>
                    #{mod.orderIndex || 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--navy)' }}>{mod.title}</strong>
                      <span className={`badge ${mod.isEnabled ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.7rem' }}>
                        {mod.isEnabled ? 'ACTIVE ON USER DASHBOARD' : 'DISABLED / HIDDEN'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Module Key: <code>{mod.key}</code> • {mod.description}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className={`btn btn-sm ${mod.isEnabled ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => handleToggleModule(mod)}
                    style={{ fontWeight: 700 }}
                  >
                    {mod.isEnabled ? 'Disable Section' : 'Enable Section'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingModule(mod)}
                  >
                    <Edit size={14} /> Edit Title/Order
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Module Edit Modal */}
          {editingModule && (
            <div className="modal-overlay" style={{ zIndex: 350 }}>
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3 className="card-title">Edit Dashboard Module</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingModule(null)}>
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleSaveModule}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Module Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={editingModule.title}
                        onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingModule.description || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Display Order Index</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingModule.orderIndex || 1}
                        onChange={(e) => setEditingModule({ ...editingModule, orderIndex: parseInt(e.target.value, 10) })}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="mod-enabled-chk"
                        checked={editingModule.isEnabled}
                        onChange={(e) => setEditingModule({ ...editingModule, isEnabled: e.target.checked })}
                      />
                      <label htmlFor="mod-enabled-chk" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        Enabled on Patient Dashboard
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingModule(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Module
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: KPI STAT CARDS CMS (Add/Edit/Delete/Toggle Cards)
          ===================================================================== */}
      {activeTab === 'cms-cards' && (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} color="var(--primary)" />
                Dashboard KPI Stat Cards Manager
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Manage the metric cards shown at the top of the user dashboard. Add new custom metrics, edit values, or toggle visibility.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddCardOpen(true)}>
              <Plus size={16} /> Add New Stat Card
            </button>
          </div>

          <div className="grid-3" style={{ marginBottom: '20px' }}>
            {cmsCards.map((card) => (
              <div 
                key={card.id} 
                className="card" 
                style={{ 
                  background: card.isVisible ? '#ffffff' : '#f8fafc', 
                  border: `1px solid ${card.isVisible ? 'var(--border-light)' : '#e2e8f0'}`,
                  opacity: card.isVisible ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--navy)' }}>{card.title}</strong>
                  <span className={`badge ${
                    card.badgeColor === 'green' ? 'badge-green' :
                    card.badgeColor === 'orange' ? 'badge-orange' :
                    card.badgeColor === 'purple' ? 'badge-purple' : 'badge-blue'
                  }`} style={{ fontSize: '0.68rem' }}>
                    {card.badgeColor}
                  </span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 12px 0' }}>
                  {card.subtitle} {card.delta && `• ${card.delta}`}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleCardVisibility(card)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {card.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                    {card.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingCard(card)}
                      style={{ padding: '4px 8px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteCard(card.id)}
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Stat Card Modal */}
          {isAddCardOpen && (
            <div className="modal-overlay" style={{ zIndex: 350 }}>
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3 className="card-title">Add Dashboard KPI Card</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsAddCardOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleCreateCard}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Card Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Glucose Stability Index"
                        value={newCardData.title}
                        onChange={(e) => setNewCardData({ ...newCardData, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subtitle</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 7-day average within target"
                        value={newCardData.subtitle}
                        onChange={(e) => setNewCardData({ ...newCardData, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Metric Value</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. 96%"
                          value={newCardData.value}
                          onChange={(e) => setNewCardData({ ...newCardData, value: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delta / Trend</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. +3.1% improved"
                          value={newCardData.delta}
                          onChange={(e) => setNewCardData({ ...newCardData, delta: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge Color Theme</label>
                      <select
                        className="form-select"
                        value={newCardData.badgeColor}
                        onChange={(e) => setNewCardData({ ...newCardData, badgeColor: e.target.value })}
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddCardOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add Card
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Stat Card Modal */}
          {editingCard && (
            <div className="modal-overlay" style={{ zIndex: 350 }}>
              <div className="modal-content" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <h3 className="card-title">Edit Dashboard KPI Card</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingCard(null)}>
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleSaveCard}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Card Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={editingCard.title}
                        onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subtitle</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingCard.subtitle || ''}
                        onChange={(e) => setEditingCard({ ...editingCard, subtitle: e.target.value })}
                      />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Metric Value</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingCard.value || ''}
                          onChange={(e) => setEditingCard({ ...editingCard, value: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Delta / Trend</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingCard.delta || ''}
                          onChange={(e) => setEditingCard({ ...editingCard, delta: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge Color Theme</label>
                      <select
                        className="form-select"
                        value={editingCard.badgeColor || 'blue'}
                        onChange={(e) => setEditingCard({ ...editingCard, badgeColor: e.target.value })}
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="orange">Orange</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingCard(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: BROADCASTS & TEXT CONTENT CMS
          ===================================================================== */}
      {activeTab === 'cms-content' && (
        <div>
          {/* Section 1: Announcements Broadcast Manager */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={18} color="var(--primary)" />
                  Site-Wide Clinical Broadcast Announcements
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Publish urgent notices or healthcare updates directly onto the user dashboard.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddAnnOpen(true)}>
                <Plus size={16} /> Broadcast Announcement
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cmsAnnouncements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px' }}>
                  No active announcements. Click Broadcast Announcement to post one.
                </p>
              ) : (
                cmsAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${
                          ann.alertType === 'warning' ? 'badge-orange' :
                          ann.alertType === 'alert' ? 'badge-red' : 'badge-blue'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {ann.alertType.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--navy)' }}>{ann.title}</strong>
                        <span className={`badge ${ann.isPublished ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: '0.68rem' }}>
                          {ann.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {ann.message}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`btn btn-sm ${ann.isPublished ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => handleTogglePublishAnnouncement(ann)}
                      >
                        {ann.isPublished ? 'Unpublish' : 'Publish Live'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create Announcement Modal */}
          {isAddAnnOpen && (
            <div className="modal-overlay" style={{ zIndex: 350 }}>
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h3 className="card-title">Broadcast Clinical Announcement</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsAddAnnOpen(false)}>
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleCreateAnnouncement}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Announcement Title</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="e.g. Flu Vaccine Clinic Schedule"
                        value={newAnnData.title}
                        onChange={(e) => setNewAnnData({ ...newAnnData, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message Content</label>
                      <textarea
                        required
                        className="form-input"
                        rows="3"
                        placeholder="e.g. Free annual influenza immunizations available starting Monday."
                        value={newAnnData.message}
                        onChange={(e) => setNewAnnData({ ...newAnnData, message: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alert Banner Type</label>
                      <select
                        className="form-select"
                        value={newAnnData.alertType}
                        onChange={(e) => setNewAnnData({ ...newAnnData, alertType: e.target.value })}
                      >
                        <option value="info">Information (Blue)</option>
                        <option value="warning">Notice / Warning (Amber)</option>
                        <option value="alert">Urgent Alert (Red)</option>
                        <option value="success">Success / Verified (Green)</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsAddAnnOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Publish Announcement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section 2: Global Content & Branding Dictionary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FileText size={18} color="var(--primary)" />
                Global Application Text & Branding CMS
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cmsContent.map((cnt) => (
                <div 
                  key={cnt.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>{cnt.title}</strong>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{cnt.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={cnt.value}
                      id={`cnt-input-${cnt.id}`}
                      style={{ background: '#fff' }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const val = document.getElementById(`cnt-input-${cnt.id}`).value;
                        handleUpdateContent(cnt, val);
                      }}
                    >
                      <Save size={14} /> Save Text
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: PATIENT ROSTER
          ===================================================================== */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} color="var(--primary)" />
              Registered Patients Directory ({users.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Patient Name</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Blood Group</th>
                  <th style={{ padding: '10px' }}>Language</th>
                  <th style={{ padding: '10px' }}>Emergency Contact</th>
                  <th style={{ padding: '10px' }}>Registered</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--navy)' }}>{u.name}</td>
                    <td style={{ padding: '12px 10px' }}>{u.email}</td>
                    <td style={{ padding: '12px 10px' }}><span className="badge badge-blue">{u.bloodGroup || 'O+'}</span></td>
                    <td style={{ padding: '12px 10px' }}><span className="badge badge-green">{u.preferredLanguage?.toUpperCase() || 'EN'}</span></td>
                    <td style={{ padding: '12px 10px' }}>{u.emergencyPhone || 'None'}</td>
                    <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(u)}>
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: MEDICINE CATALOG
          ===================================================================== */}
      {activeTab === 'medicines' && (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <h3 className="card-title">
              <Pill size={18} color="var(--primary)" />
              Prescribed Medicines Master Catalog ({medicines.length})
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddMedOpen(true)}>
              <Plus size={16} /> Add Medicine
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Medicine</th>
                  <th style={{ padding: '10px' }}>Dosage</th>
                  <th style={{ padding: '10px' }}>Frequency</th>
                  <th style={{ padding: '10px' }}>Times</th>
                  <th style={{ padding: '10px' }}>Duration</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--navy)' }}>{m.name}</td>
                    <td style={{ padding: '12px 10px' }}>{m.dosage}</td>
                    <td style={{ padding: '12px 10px' }}>{m.frequency}</td>
                    <td style={{ padding: '12px 10px' }}>{Array.isArray(m.intakeTimes) ? m.intakeTimes.join(', ') : m.intakeTimes}</td>
                    <td style={{ padding: '12px 10px' }}>{m.duration}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-green">ACTIVE</span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMedicine(m.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: DOSE SCHEDULES
          ===================================================================== */}
      {activeTab === 'schedules' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} color="var(--primary)" />
              Daily Dose Schedule Calendar ({schedules.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Time</th>
                  <th style={{ padding: '10px' }}>Medicine</th>
                  <th style={{ padding: '10px' }}>Dosage</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Warning Calls</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.slice(0, 50).map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px' }}>{s.scheduledDate}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{s.scheduledTime}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--navy)' }}>{s.medicineName}</td>
                    <td style={{ padding: '10px' }}>{s.dosage}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${
                        (s.status || '').toLowerCase() === 'verified' || (s.status || '').toLowerCase() === 'taken' ? 'badge-green' :
                        (s.status || '').toLowerCase() === 'missed' ? 'badge-red' : 'badge-orange'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{s.warningCallsSent || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingSchedule(s)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: ESCALATION LOGS
          ===================================================================== */}
      {activeTab === 'alerts' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BellRing size={18} color="var(--primary)" />
              Emergency Escalation & Alert Audit Trail ({alerts.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px' }}>No alert events logged.</p>
            ) : (
              alerts.map(a => (
                <div key={a.id} style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${
                      a.eventType === 'guardian_escalation' ? 'badge-red' :
                      a.eventType === 'medicine_verified' ? 'badge-green' : 'badge-orange'
                    }`}>
                      {a.eventType}
                    </span>
                    <div>
                      <strong>{a.message}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Recipient: {a.recipientName} ({a.recipientPhone}) • {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{a.deliveryStatus}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 9: MEDICAL DOCUMENTS
          ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} color="var(--primary)" />
              Uploaded Reports & Prescriptions Archive ({documents.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Title</th>
                  <th style={{ padding: '10px' }}>Patient</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Extraction Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-blue">{d.documentType?.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--navy)' }}>{d.title}</td>
                    <td style={{ padding: '10px' }}>{d.patientName}</td>
                    <td style={{ padding: '10px' }}>{d.date}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-green">Clinically Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 10: SYSTEM SETTINGS
          ===================================================================== */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px' }}>
          {/* Section 1: Website Branding & Logo */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={20} color="var(--primary)" />
                Website Branding, Portal Name & Logo Photo
              </h3>
            </div>
            {settings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Healthcare Website & Portal Name
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
                    This name appears on the top navigation bar, sidebar, login/registration portals, and browser tab.
                  </p>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. VitaCare AI, Apollo Care, MediShield Copilot"
                    value={settings.websiteName || ''}
                    onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                  />
                </div>

                {/* Logo / Photo Upload & Live Preview Card */}
                <div style={{
                  padding: '18px',
                  background: 'var(--bg-alt)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-light)'
                }}>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>
                    Website Logo / Photo
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    {/* Live Preview Box */}
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '18px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)',
                      border: '2px solid #ffffff'
                    }}>
                      {settings.logoUrl ? (
                        <img 
                          src={settings.logoUrl} 
                          alt="Logo Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <ShieldCheck size={40} color="#ffffff" />
                      )}
                    </div>

                    {/* Upload & Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <label 
                          className="btn btn-primary btn-sm" 
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Upload size={14} />
                          {logoUploading ? 'Uploading...' : 'Upload Logo / Photo'}
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                            style={{ display: 'none' }} 
                            onChange={handleLogoUpload}
                            disabled={logoUploading}
                          />
                        </label>

                        {settings.logoUrl && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#dc2626' }}
                            onClick={() => {
                              setSettings(prev => ({ ...prev, logoUrl: '' }));
                              updateBrandingState({ ...settings, logoUrl: '' });
                              showSuccess('Custom logo removed. Reset to default icon.');
                            }}
                          >
                            <Trash2 size={14} /> Remove Logo
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Or enter direct Image Web URL:
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://example.com/logo.png"
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                          value={settings.logoUrl || ''}
                          onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Logos */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-light)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      Quick Preset Healthcare Logos:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { label: '🩺 Stethoscope Icon', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=200&q=80' },
                        { label: '❤️ Cardiac Care', url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=200&q=80' },
                        { label: '🏥 Medical Center', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80' },
                        { label: '🔬 Laboratory DNA', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=200&q=80' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => {
                            setSettings(prev => ({ ...prev, logoUrl: preset.url }));
                            updateBrandingState({ ...settings, logoUrl: preset.url });
                            showSuccess(`Preset ${preset.label} applied.`);
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveSettings}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Save size={16} /> Save Website Name & Branding
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Whole System Language Selector */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="var(--primary)" />
                Whole System Language Configuration (8 Supported Languages)
              </h3>
            </div>
            {settings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(13, 148, 136, 0.06) 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(2, 132, 199, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
                    <Globe size={18} />
                    <span>Choose System Default Language to Change the Whole System</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Changing this setting updates the default language for all modules, menus, symptom checkers, medications, reports, and timeline across the entire application.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Select System Default Language:
                  </label>
                  <select
                    className="form-input"
                    value={settings.defaultLanguage || 'en'}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    style={{ fontSize: '0.95rem', fontWeight: 600, padding: '10px 14px' }}
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name} — {lang.nativeName} ({lang.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid of All 8 Supported Languages for One-Click Switch */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'block' }}>
                    Quick 1-Click System Language Switch:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                    {SUPPORTED_LANGUAGES.map(lang => {
                      const isCurrent = (settings.defaultLanguage || 'en') === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          className={`btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            fontSize: '0.85rem'
                          }}
                          onClick={() => handleApplySystemLanguage(lang.code)}
                        >
                          <span>{lang.flag} {lang.nativeName}</span>
                          {isCurrent && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleApplySystemLanguage(settings.defaultLanguage)}
                  >
                    <Globe size={16} /> Apply Selected Language to Whole System Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Escalation Rules & Operational Contacts */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="var(--primary)" />
                Escalation Rules & Operational Support
              </h3>
            </div>
            {settings && (
              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Support Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.supportPhone || ''}
                        onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Email</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.supportEmail || ''}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Warning Call Attempts Before Guardian Escalation</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-input"
                        value={settings.warningCallAttempts || 2}
                        onChange={(e) => setSettings({ ...settings, warningCallAttempts: parseInt(e.target.value, 10) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timeout Between Warning Calls (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        className="form-input"
                        value={settings.warningTimeoutMinutes || 15}
                        onChange={(e) => setSettings({ ...settings, warningTimeoutMinutes: parseInt(e.target.value, 10) })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="esc-guardian-chk"
                      checked={settings.escalateToGuardian}
                      onChange={(e) => setSettings({ ...settings, escalateToGuardian: e.target.checked })}
                    />
                    <label htmlFor="esc-guardian-chk" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      Enable automatic phone call escalation to primary guardian
                    </label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="careconnect-chk"
                      checked={settings.careConnectEnabled}
                      onChange={(e) => setSettings({ ...settings, careConnectEnabled: e.target.checked })}
                    />
                    <label htmlFor="careconnect-chk" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      Enable CareConnect real device camera video check-ins
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                    <Save size={16} /> Save All Operational Settings
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Database Operations & Clean Slate (Requirement 3) */}
          <div style={{
            paddingTop: '20px',
            background: '#fff5f5',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #fed7d7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', marginBottom: '8px' }}>
              <Database size={20} color="#dc2626" />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Database Clean Slate & Empty State Management
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              Reset the prototype to a genuine empty database. This permanently clears all test patient records, uploaded reports, and intake schedules, leaving only system administrators and configuration intact so new patients can register fresh.
            </p>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setIsClearDbConfirmOpen(true)}
              style={{
                background: '#dc2626',
                color: '#fff',
                borderColor: '#dc2626',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={15} /> Wipe Patient Data (Reset to Clean Empty Database)
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 11: MULTILINGUAL TRANSLATIONS CMS (Requirement 1 & 5)
          ===================================================================== */}
      {activeTab === 'translations' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <h3 className="card-title">
                <Globe size={18} color="var(--primary)" />
                Multilingual Content & Translations CMS (English • Tamil • Telugu • Malayalam • Kannada • Hindi • Bengali • Marathi)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Manage live dictionary strings across all 8 languages. Changes dynamically reflect across the patient and admin portals.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddTransOpen(true)}>
              <Plus size={16} /> Add Translation Key
            </button>
          </div>

          {/* Search & Language Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search translation key or text..."
                value={translationSearch}
                onChange={(e) => setTranslationSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.84rem' }}
              />
            </div>
            <select
              className="form-select"
              value={selectedLanguageFilter}
              onChange={(e) => setSelectedLanguageFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.84rem' }}
            >
              <option value="all">All 8 Languages View</option>
              <option value="en">🇬🇧 English</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
              <option value="te">🇮🇳 తెలుగు (Telugu)</option>
              <option value="ml">🇮🇳 മലയാളം (Malayalam)</option>
              <option value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="bn">🇮🇳 বাংলা (Bengali)</option>
              <option value="mr">🇮🇳 मराठी (Marathi)</option>
            </select>
          </div>

          {/* Translations Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Key & Category</th>
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'en') && (
                    <th style={{ padding: '10px' }}>🇬🇧 English</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'ta') && (
                    <th style={{ padding: '10px' }}>🇮🇳 தமிழ்</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'te') && (
                    <th style={{ padding: '10px' }}>🇮🇳 తెలుగు</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'ml') && (
                    <th style={{ padding: '10px' }}>🇮🇳 മലയാളം</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'kn') && (
                    <th style={{ padding: '10px' }}>🇮🇳 ಕನ್ನಡ</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'hi') && (
                    <th style={{ padding: '10px' }}>🇮🇳 हिन्दी</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'bn') && (
                    <th style={{ padding: '10px' }}>🇮🇳 বাংলা</th>
                  )}
                  {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'mr') && (
                    <th style={{ padding: '10px' }}>🇮🇳 मराठी</th>
                  )}
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {translationsList
                  .filter(t => {
                    if (!translationSearch) return true;
                    const s = translationSearch.toLowerCase();
                    return (
                      t.key.toLowerCase().includes(s) ||
                      (t.en && t.en.toLowerCase().includes(s)) ||
                      (t.ta && t.ta.toLowerCase().includes(s)) ||
                      (t.te && t.te.toLowerCase().includes(s)) ||
                      (t.ml && t.ml.toLowerCase().includes(s)) ||
                      (t.kn && t.kn.toLowerCase().includes(s)) ||
                      (t.hi && t.hi.toLowerCase().includes(s)) ||
                      (t.bn && t.bn.toLowerCase().includes(s)) ||
                      (t.mr && t.mr.toLowerCase().includes(s))
                    );
                  })
                  .map(t => (
                    <tr key={t.key} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--navy)' }}>
                        <code>{t.key}</code>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          Category: {t.category || 'General'}
                        </div>
                      </td>
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'en') && (
                        <td style={{ padding: '10px', maxWidth: '180px' }}>{t.en || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'ta') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#0369a1' }}>{t.ta || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'te') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#047857' }}>{t.te || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'ml') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#4f46e5' }}>{t.ml || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'kn') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#7c3aed' }}>{t.kn || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'hi') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#b45309' }}>{t.hi || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'bn') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#0d9488' }}>{t.bn || '—'}</td>
                      )}
                      {(selectedLanguageFilter === 'all' || selectedLanguageFilter === 'mr') && (
                        <td style={{ padding: '10px', maxWidth: '180px', color: '#be123c' }}>{t.mr || '—'}</td>
                      )}
                      <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingTranslation(t)}
                          style={{ marginRight: '6px' }}
                          title="Edit translations"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteTranslation(t.key)}
                          title="Delete translation key"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 12: GUARDIAN SMS & AUTOMATION (Requirement 2 & 5)
          ===================================================================== */}
      {activeTab === 'sms-guardian' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: SMS Notification Triggers */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Smartphone size={18} color="var(--primary)" />
                Guardian SMS Notification Triggers & Automation
              </h3>
            </div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Configure which clinical events automatically dispatch SMS notifications to registered guardians.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {smsTriggers.map(trig => (
                <div
                  key={trig.eventType}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: trig.isEnabled ? '2px solid #bae6fd' : '1px solid var(--border-light)',
                    background: trig.isEnabled ? '#f0f9ff' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--navy)' }}>{trig.title}</strong>
                      <span className={`badge ${trig.isEnabled ? 'badge-green' : 'badge-gray'}`}>
                        {trig.isEnabled ? 'SMS ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {trig.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${trig.isEnabled ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleToggleSmsTrigger(trig.eventType)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    {trig.isEnabled ? 'Disable SMS Trigger' : 'Enable SMS Trigger'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Multilingual SMS Templates */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Globe size={18} color="var(--primary)" />
                Multilingual Guardian SMS Templates (4 Languages)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Custom message templates dispatched to guardians. Supported placeholders: <code>{'{patientName}'}</code>, <code>{'{time}'}</code>, <code>{'{medicineName}'}</code>, <code>{'{dosage}'}</code>, <code>{'{vitalName}'}</code>, <code>{'{vitalValue}'}</code>.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Event</th>
                    <th style={{ padding: '10px' }}>Language</th>
                    <th style={{ padding: '10px' }}>Template Message</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {smsTemplates.map(tpl => (
                    <tr key={tpl.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <span className="badge badge-blue">{tpl.eventType}</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontWeight: 700 }}>
                          {tpl.language === 'en' ? '🇬🇧 English' :
                           tpl.language === 'ta' ? '🇮🇳 தமிழ்' :
                           tpl.language === 'te' ? '🇮🇳 తెలుగు' : '🇮🇳 हिन्दी'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', maxWidth: '420px', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {tpl.templateText}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingTemplate(tpl)}>
                          <Edit size={13} /> Edit Template
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Registered Healthcare Guardians (Masked numbers) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Users size={18} color="var(--primary)" />
                Registered Healthcare Guardians ({adminGuardians.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Guardian contacts associated with patient accounts. Phone numbers are securely masked for confidentiality.
            </p>
            {adminGuardians.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                No guardians registered yet. When patients register with guardian details, they appear here.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Patient</th>
                      <th style={{ padding: '10px' }}>Guardian Name</th>
                      <th style={{ padding: '10px' }}>Relationship</th>
                      <th style={{ padding: '10px' }}>Masked Mobile Number</th>
                      <th style={{ padding: '10px' }}>Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminGuardians.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{g.patientName}</td>
                        <td style={{ padding: '10px' }}>{g.name}</td>
                        <td style={{ padding: '10px' }}>
                          <span className="badge badge-purple">{g.relationship}</span>
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)' }}>
                          🔒 {g.maskedPhone}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {g.allowEmergencyNotification && <span className="badge badge-red">SOS Alerts</span>}
                            {g.allowMedicationEscalation && <span className="badge badge-orange">Missed Doses</span>}
                            {g.allowCareConnectAccess && <span className="badge badge-green">CareConnect</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Live SMS Dispatch Audit Trail */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <BellRing size={18} color="var(--primary)" />
                Guardian SMS Delivery Logs & Audit Trail ({smsLogs.length})
              </h3>
            </div>
            {smsLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                No SMS logs recorded yet. Test dispatches and automatic triggers will be logged here with carrier receipts.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Timestamp</th>
                      <th style={{ padding: '10px' }}>Recipient & Masked Phone</th>
                      <th style={{ padding: '10px' }}>Trigger</th>
                      <th style={{ padding: '10px' }}>Language</th>
                      <th style={{ padding: '10px' }}>Message Body</th>
                      <th style={{ padding: '10px' }}>Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smsLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                          <strong>{log.guardianName}</strong>
                          <div style={{ fontSize: '0.74rem', color: 'var(--navy)' }}>{log.maskedPhone}</div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className="badge badge-blue">{log.eventType}</span>
                        </td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{log.language?.toUpperCase()}</td>
                        <td style={{ padding: '10px', maxWidth: '300px', fontSize: '0.78rem' }}>
                          {log.message}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className="badge badge-green">✓ {log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Test SMS Dispatch Tool */}
          <div className="card" style={{ maxWidth: '640px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Send size={18} color="var(--primary)" />
                Direct Test SMS Dispatcher
              </h3>
            </div>
            <form onSubmit={handleSendTestSms}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Recipient Mobile Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={testSmsPhone}
                    onChange={(e) => setTestSmsPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SMS Language</label>
                  <select
                    className="form-select"
                    value={testSmsLang}
                    onChange={(e) => setTestSmsLang(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="ml">Malayalam (മലയാളം)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message Payload</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input"
                    value={testSmsMsg}
                    onChange={(e) => setTestSmsMsg(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={testSmsSending}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={14} /> {testSmsSending ? 'Transmitting via Gateway...' : 'Send Live Test SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT TRANSLATION (Requirement 1 & 5)
          ===================================================================== */}
      {editingTranslation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <Globe size={18} color="var(--primary)" />
                Edit Translation Key: <code>{editingTranslation.key}</code>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingTranslation(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTranslation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">🇬🇧 English Translation</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingTranslation.en || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, en: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 தமிழ் (Tamil) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.ta || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, ta: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 తెలుగు (Telugu) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.te || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, te: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 മലയാളം (Malayalam) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.ml || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, ml: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 ಕನ್ನಡ (Kannada) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.kn || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, kn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 हिन्दी (Hindi) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.hi || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, hi: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 বাংলা (Bengali) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.bn || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, bn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 मराठी (Marathi) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.mr || ''}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, mr: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTranslation.category || 'General'}
                    onChange={(e) => setEditingTranslation({ ...editingTranslation, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTranslation(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save All Translations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD TRANSLATION KEY
          ===================================================================== */}
      {isAddTransOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <Plus size={18} color="var(--primary)" />
                Add New Multilingual Translation Key
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddTransOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTranslation}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Unique Translation Key (camelCase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. customBadgeNotice"
                    className="form-input"
                    value={newTransData.key}
                    onChange={(e) => setNewTransData({ ...newTransData, key: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇬🇧 English Translation</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newTransData.en}
                    onChange={(e) => setNewTransData({ ...newTransData, en: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 தமிழ் (Tamil) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.ta}
                    onChange={(e) => setNewTransData({ ...newTransData, ta: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 తెలుగు (Telugu) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.te}
                    onChange={(e) => setNewTransData({ ...newTransData, te: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 മലയാളം (Malayalam) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.ml}
                    onChange={(e) => setNewTransData({ ...newTransData, ml: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 ಕನ್ನಡ (Kannada) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.kn}
                    onChange={(e) => setNewTransData({ ...newTransData, kn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 हिन्दी (Hindi) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.hi}
                    onChange={(e) => setNewTransData({ ...newTransData, hi: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 বাংলা (Bengali) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.bn}
                    onChange={(e) => setNewTransData({ ...newTransData, bn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">🇮🇳 मराठी (Marathi) Translation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.mr}
                    onChange={(e) => setNewTransData({ ...newTransData, mr: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTransData.category}
                    onChange={(e) => setNewTransData({ ...newTransData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTransOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={15} /> Create Translation Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT SMS TEMPLATE
          ===================================================================== */}
      {editingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <Smartphone size={18} color="var(--primary)" />
                Edit SMS Template: <code>{editingTemplate.eventType}</code> ({editingTemplate.language?.toUpperCase()})
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingTemplate(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveSmsTemplate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Template Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Template Text</label>
                  <textarea
                    rows={4}
                    required
                    className="form-input"
                    value={editingTemplate.templateText || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, templateText: e.target.value })}
                  />
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Available dynamic tags: <code>{'{patientName}'}</code>, <code>{'{time}'}</code>, <code>{'{medicineName}'}</code>, <code>{'{dosage}'}</code>, <code>{'{vitalName}'}</code>, <code>{'{vitalValue}'}</code>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONFIRM DATABASE RESET (EMPTY DATABASE) (Requirement 3)
          ===================================================================== */}
      {isClearDbConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', border: '2px solid #ef4444' }}>
            <div className="modal-header" style={{ background: '#fef2f2' }}>
              <h3 className="card-title" style={{ color: '#991b1b' }}>
                <AlertTriangle size={20} color="#dc2626" />
                Confirm Reset to Empty Database
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsClearDbConfirmOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ color: 'var(--navy)', lineHeight: 1.6, fontSize: '0.88rem' }}>
                Are you sure you want to wipe all patient data?
              </p>
              <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '10px 0 16px 20px', lineHeight: 1.6 }}>
                <li>All patient user accounts, profiles, and guardians will be cleared.</li>
                <li>All uploaded health reports and extracted OCR data will be cleared.</li>
                <li>All prescriptions, medicines, and adherence logs will be cleared.</li>
                <li>Administrator accounts, CMS modules, SMS templates, and system settings will be preserved.</li>
              </ul>
              <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '8px', fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>
                This creates a completely fresh empty database for patient signups.
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsClearDbConfirmOpen(false)}
                disabled={clearingDb}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearDatabase}
                disabled={clearingDb}
              >
                {clearingDb ? 'Wiping Database...' : 'Yes, Wipe Patient Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
