import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const EmergencySosModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [isCounting, setIsCounting] = useState(true);
  const [isTriggered, setIsTriggered] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer = null;
    if (isOpen && isCounting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isOpen && isCounting && countdown === 0) {
      setIsCounting(false);
      executeSos();
    }
    return () => clearTimeout(timer);
  }, [isOpen, isCounting, countdown]);

  const handleCancel = () => {
    setIsCounting(false);
    onClose();
  };

  const executeSos = async () => {
    setLoading(true);
    try {
      const res = await api.triggerSos('GPS Coordinates: 37.7749° N, 122.4194° W');
      setSosResult(res);
      setIsTriggered(true);
    } catch (err) {
      console.error('SOS failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImmediateTrigger = () => {
    setIsCounting(false);
    setCountdown(0);
    executeSos();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }}>
      <div className="modal-content" style={{ maxWidth: '520px', border: '2px solid var(--status-red)' }}>
        <div className="modal-header" style={{ background: 'var(--status-red-bg)' }}>
          <h3 className="card-title" style={{ color: 'var(--status-red)' }}>
            <AlertTriangle size={22} color="var(--status-red)" />
            {t('emergencySosAlertTitle') || 'EMERGENCY SOS ALERT'}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          {!isTriggered ? (
            <div>
              <div style={{ margin: '16px 0' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'var(--status-red)',
                  color: '#fff',
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
                }}>
                  {countdown}
                </span>
                <p style={{ marginTop: '12px', fontWeight: '700', color: 'var(--navy)', fontSize: '1.05rem' }}>
                  {t('emergencyContactsAlertIn', { seconds: countdown }) || `Emergency contacts will be alerted in ${countdown} seconds...`}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {t('clickCancelNotice') || 'Click CANCEL immediately if this was pressed in error.'}
                </p>
              </div>

              <div style={{
                background: 'var(--bg-alt)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'left',
                margin: '18px 0',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--navy)' }}>
                  {t('whoWillBeContacted') || 'Who will be contacted?'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldAlert size={16} color="var(--status-red)" />
                  <span>{t('contact1Ems') || 'Contact 1: EMS / Ambulance (911 / 112)'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneCall size={16} color="var(--primary)" />
                  <span>{t('contact2Guardian') || 'Contact 2: Eleanor Doe (Spouse / Guardian)'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ margin: '12px 0', color: 'var(--status-green)' }}>
                <CheckCircle size={56} style={{ margin: '0 auto 10px auto' }} />
                <h4 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>{t('sosDispatchedHeading') || 'Emergency SOS Dispatched'}</h4>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge badge-demo" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {t('demoSosMode') || 'DEMO SOS MODE'}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'left',
                margin: '14px 0',
                fontSize: '0.85rem'
              }}>
                <p style={{ fontWeight: '700', marginBottom: '6px' }}>{t('simulatedAlertSummary') || 'Simulated Alert Summary:'}</p>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                  <li>{t('alertDetail1') || 'First Responders notified: 911 / 112 [DEMO]'}</li>
                  <li>{t('alertDetail2') || 'Guardian notified with patient profile & GPS [DEMO]'}</li>
                  <li>{t('alertDetail3') || 'Medical conditions & blood group transmitted'}</li>
                </ul>
                <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {t('demoNotice') || 'Notice: Operates in DEMO SOS mode for hackathon demonstration. No external emergency agency was contacted.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {!isTriggered ? (
            <>
              <button className="btn btn-secondary btn-lg" onClick={handleCancel} style={{ flex: 1 }}>
                {t('cancelSos') || 'CANCEL SOS'}
              </button>
              <button className="btn btn-danger btn-lg" onClick={handleImmediateTrigger} disabled={loading} style={{ flex: 1 }}>
                {t('sendNow') || 'Send Now'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              {t('closeEmergencyStatus') || 'Close Emergency Status'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
