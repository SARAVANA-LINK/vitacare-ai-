import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrandingProvider } from './context/BrandingContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrandingProvider>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrandingProvider>
  </StrictMode>,
);
