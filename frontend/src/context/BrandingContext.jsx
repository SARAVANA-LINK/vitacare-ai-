import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/apiClient';

const BrandingContext = createContext(null);

export const BrandingProvider = ({ children }) => {
  const [websiteName, setWebsiteName] = useState(() => {
    return localStorage.getItem('vitacare_website_name') || 'VitaCare AI';
  });

  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('vitacare_logo_url') || '';
  });

  const [defaultLanguage, setDefaultLanguage] = useState(() => {
    return localStorage.getItem('vitacare_default_lang') || 'en';
  });

  const [supportPhone, setSupportPhone] = useState('+1 (800) 555-VITA');
  const [supportEmail, setSupportEmail] = useState('support@vitacare.ai');
  const [careConnectEnabled, setCareConnectEnabled] = useState(true);

  const applyBranding = useCallback((data) => {
    if (!data) return;
    const name = data.websiteName || 'VitaCare AI';
    const logo = data.logoUrl || '';
    const defLang = data.defaultLanguage || 'en';

    setWebsiteName(name);
    setLogoUrl(logo);
    setDefaultLanguage(defLang);
    if (data.supportPhone) setSupportPhone(data.supportPhone);
    if (data.supportEmail) setSupportEmail(data.supportEmail);
    if (data.careConnectEnabled !== undefined) setCareConnectEnabled(Boolean(data.careConnectEnabled));

    localStorage.setItem('vitacare_website_name', name);
    localStorage.setItem('vitacare_logo_url', logo);
    localStorage.setItem('vitacare_default_lang', defLang);

    // Update browser tab title dynamically
    if (typeof document !== 'undefined') {
      document.title = `${name} — Personal Health Copilot`;
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const data = await api.getPublicSettings();
      if (data) {
        applyBranding(data);
      }
    } catch (err) {
      console.warn('Could not sync public branding settings:', err.message);
    }
  }, [applyBranding]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const updateBrandingState = useCallback((newSettings) => {
    applyBranding({
      websiteName: newSettings.websiteName !== undefined ? newSettings.websiteName : websiteName,
      logoUrl: newSettings.logoUrl !== undefined ? newSettings.logoUrl : logoUrl,
      defaultLanguage: newSettings.defaultLanguage !== undefined ? newSettings.defaultLanguage : defaultLanguage,
      supportPhone: newSettings.supportPhone || supportPhone,
      supportEmail: newSettings.supportEmail || supportEmail,
      careConnectEnabled: newSettings.careConnectEnabled !== undefined ? newSettings.careConnectEnabled : careConnectEnabled
    });
  }, [applyBranding, websiteName, logoUrl, defaultLanguage, supportPhone, supportEmail, careConnectEnabled]);

  const value = {
    websiteName,
    logoUrl,
    defaultLanguage,
    supportPhone,
    supportEmail,
    careConnectEnabled,
    refreshBranding,
    updateBrandingState
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      websiteName: 'VitaCare AI',
      logoUrl: '',
      defaultLanguage: 'en',
      supportPhone: '+1 (800) 555-VITA',
      supportEmail: 'support@vitacare.ai',
      careConnectEnabled: true,
      refreshBranding: () => {},
      updateBrandingState: () => {}
    };
  }
  return context;
};
