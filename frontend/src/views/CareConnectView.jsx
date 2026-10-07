import React, { useState, useEffect } from 'react';
import { Video, ShieldCheck, HeartHandshake, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const CareConnectView = ({ onStartVideoCheckIn }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getCareConnectSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>{t('careConnectTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('careConnectSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onStartVideoCheckIn}>
          <Video size={16} /> {t('startVideoCall')}
        </button>
      </div>

      {/* Safety & Protocol Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#10b981',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={32} />
        </div>
        <div>
          <h3 style={{ color: '#166534', fontSize: '1.2rem', marginBottom: '4px' }}>
            {t('caregiverPolicyTitle')}
          </h3>
          <p style={{ color: '#15803d', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {t('caregiverPolicyDesc')}
          </p>
        </div>
      </div>

      <div className="grid-main-side">
        {/* Previous Sessions Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} color="var(--primary)" />
              {t('recordedSessions', { count: sessions.length })}
            </h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {t('loadingSessions')}
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <HeartHandshake size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p>{t('noSessionsRecorded')}</p>
              <button className="btn btn-secondary btn-sm" onClick={onStartVideoCheckIn} style={{ marginTop: '12px' }}>
                {t('launchLiveCheckin')}
              </button>
            </div>
          ) : (
            <div>
              {sessions.map(s => (
                <div
                  key={s.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    marginBottom: '10px',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-dark)'
                    }}>
                      <Video size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--navy)' }}>
                        {s.caregiverName}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {s.notes || t('medicationEvents')}
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-green">
                      <CheckCircle size={12} /> {t('confirmedBadge')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Authorized Caregiver Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <User size={18} color="var(--primary)" />
              {t('authorizedCaregiver')}
            </h3>
            <span className="badge badge-green">{t('activeBadge')}</span>
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              margin: '0 auto 12px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              <User size={32} />
            </div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--navy)' }}>Eleanor Doe</h4>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t('primaryProxy')}
            </span>
          </div>

          <div style={{
            background: 'var(--bg-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginTop: '10px'
          }}>
            <div style={{ marginBottom: '4px' }}>{t('phoneLabel')}: <strong>+1 (555) 774-8833</strong></div>
            <div style={{ marginBottom: '4px' }}>{t('careConnectAccessLabel')}: <strong>{t('granted')}</strong></div>
            <div>{t('escalationPermissionsLabel')}: <strong>{t('enabled')}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
