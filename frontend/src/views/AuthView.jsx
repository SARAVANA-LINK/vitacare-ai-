import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  AlertCircle,
  ArrowLeft,
  Smartphone,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const AuthView = ({ portalMode = 'user', onSwitchPortal }) => {
  const { login, register, adminLogin, demoLogin } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { websiteName, logoUrl } = useBranding();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  // Mode: 'login' | 'register' for patient portal; admin portal is always admin
  const [userTab, setUserTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: portalMode === 'admin' ? 'admin@vitacare.ai' : '',
    password: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    emergencyPhone: '',
    preferredLanguage: language || 'en',
    // Guardian / Parent SMS contact details (Requirement 2)
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'Parent / Primary Caregiver'
  });

  useEffect(() => {
    if (portalMode === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: prev.email || 'admin@vitacare.ai'
      }));
    }
  }, [portalMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (portalMode === 'admin') {
        await adminLogin(formData.email, formData.password);
      } else if (userTab === 'register') {
        await register({
          ...formData,
          preferredLanguage: language
        });
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setFormData({
      ...formData,
      email: 'admin@vitacare.ai',
      password: 'AdminSecure2026!'
    });
    setErrorMsg('');
  };

  const handleDemoAccess = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setErrorMsg('Failed to initialize demo session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdminPortal = portalMode === 'admin';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isAdminPortal 
        ? 'radial-gradient(circle at top right, #fee2e2 0%, #f8fafc 60%)'
        : 'radial-gradient(circle at top right, #e0f2fe 0%, #f8fafc 60%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.08)',
        border: `1px solid ${isAdminPortal ? '#fecaca' : '#e2e8f0'}`
      }}>
        {/* Top Bar: Portal Indicator & Language Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            background: isAdminPortal ? '#fee2e2' : 'var(--primary-subtle)',
            color: isAdminPortal ? '#dc2626' : 'var(--primary-dark)',
            border: `1px solid ${isAdminPortal ? '#fca5a5' : 'var(--border-light)'}`
          }}>
            {isAdminPortal ? t('adminPortalBadge') : t('userPortalBadge')}
          </span>

          {/* Multilingual Selector (Requirement 1: Available throughout complete app including auth) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-alt)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid var(--border-light)'
          }}>
            <Globe size={14} color="var(--primary)" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              id="auth-language-selector"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--navy)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: isAdminPortal 
              ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            color: '#fff',
            overflow: 'hidden',
            boxShadow: isAdminPortal 
              ? '0 8px 18px rgba(220, 38, 38, 0.35)'
              : '0 8px 18px rgba(2, 132, 199, 0.35)'
          }}>
            {logoUrl && !imgError ? (
              <img 
                src={logoUrl} 
                alt={websiteName || 'Brand Logo'} 
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              isAdminPortal ? <ShieldCheck size={32} fill="#fff" /> : <Heart size={32} fill="#fff" />
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--navy)', marginBottom: '4px' }}>
            {websiteName || t('appTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
            {isAdminPortal 
              ? t('adminPortalSubtitle') 
              : t('personalCopilot')}
          </p>
        </div>

        {/* Patient Portal: Sign In vs Register Tabs */}
        {!isAdminPortal && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: 'var(--bg-alt)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              className={`btn btn-sm ${userTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '8px' }}
              onClick={() => { setUserTab('login'); setErrorMsg(''); }}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${userTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '8px' }}
              onClick={() => { setUserTab('register'); setErrorMsg(''); }}
            >
              {t('createAccount')}
            </button>
          </div>
        )}

        {/* Admin Restricted Notice Banner with 1-Click Credentials */}
        {isAdminPortal && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '20px',
            fontSize: '0.8rem',
            color: '#991b1b'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> {t('restrictedAdminAccess')}
            </div>
            <p style={{ margin: '0 0 10px 0', lineHeight: 1.5, fontSize: '0.78rem' }}>
              {t('adminAccessDesc')}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillAdminCredentials}
              style={{ width: '100%', fontSize: '0.78rem', background: '#fff', borderColor: '#fca5a5', color: '#991b1b', fontWeight: 600 }}
            >
              {t('fillAdminCredentials')}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: 'var(--status-red-bg)',
            border: '1px solid var(--status-red-border)',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#dc2626" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {!isAdminPortal && userTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Johnathan Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('age')}</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('bloodGroup')}</label>
                  <select
                    className="form-select"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Requirement 2: Guardian / Parent Contact during registration */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--navy)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '10px' }}>
                  <Smartphone size={15} color="var(--primary)" />
                  {t('guardianContactTitle')}
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('guardianName')} *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Eleanor Doe"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('guardianPhone')} *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '6px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('guardianRelationship')}</label>
                    <select
                      className="form-select"
                      value={formData.guardianRelationship}
                      onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                    >
                      <option value="Parent">{t('relParent')}</option>
                      <option value="Spouse">{t('relSpouse')}</option>
                      <option value="Child">{t('relChild')}</option>
                      <option value="Guardian">{t('relGuardian')}</option>
                      <option value="Caregiver">{t('relCaregiver')}</option>
                    </select>
                  </div>
                </div>

                <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  🔒 {t('guardianSmsNotice')}
                </p>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              {isAdminPortal ? t('adminEmailLabel') : t('emailAddress')}
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder={isAdminPortal ? 'admin@vitacare.ai' : 'name@example.com'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '10px',
              background: isAdminPortal ? '#dc2626' : undefined,
              borderColor: isAdminPortal ? '#dc2626' : undefined
            }}
          >
            {loading ? t('pleaseWait') : (
              isAdminPortal ? t('authorizeAdmin') :
              userTab === 'register' ? t('createAccount') :
              t('signIn')
            )}
          </button>
        </form>

        {/* Portal Switcher Navigation at Bottom */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          {isAdminPortal ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onSwitchPortal('user')}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={14} /> {t('returnToPatientPortal')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onSwitchPortal('admin')}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#dc2626' }}
            >
              <ShieldCheck size={14} /> {t('accessAdminPortalPrompt')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
