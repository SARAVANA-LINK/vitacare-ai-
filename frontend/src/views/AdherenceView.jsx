import React, { useState, useEffect } from 'react';
import { CalendarCheck, ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const AdherenceView = () => {
  const { t } = useTranslation();
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escalationResult, setEscalationResult] = useState(null);
  const [escalating, setEscalating] = useState(false);

  const fetchAdherence = async () => {
    try {
      setLoading(true);
      const res = await api.getAdherence();
      setAdherence(res.adherence);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdherence();
  }, []);

  const handleTriggerEscalation = async () => {
    try {
      setEscalating(true);
      const res = await api.escalateMissedMedicine({
        medicineName: 'Metformin 500 mg',
        scheduledTime: '08:00 AM'
      });
      setEscalationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>{t('adherenceTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('adherenceSubtitle')}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleTriggerEscalation}
          disabled={escalating}
          title={t('testGuardianEscalation')}
        >
          <ShieldAlert size={16} color="var(--status-orange)" />
          {escalating ? t('escalating') : t('testGuardianEscalation')}
        </button>
      </div>

      {/* Escalation Notification Feedback */}
      {escalationResult && (
        <div style={{
          background: 'var(--status-orange-bg)',
          border: '1px solid var(--status-orange-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-demo">{escalationResult.statusBadge || 'DEMO'}</span>
              <strong style={{ color: '#92400e' }}>{t('guardianAlertDispatched')}</strong>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '4px' }}>
              {escalationResult.escalationMessage} ({t('recipientLabel')}: {escalationResult.guardianContacted} • {escalationResult.phoneNumber})
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEscalationResult(null)}>
            {t('dismiss')}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {t('computingAdherence')}
        </div>
      ) : (
        <div className="grid-main-side">
          {/* Main Adherence Score & Calendar */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CalendarCheck size={20} color="var(--primary)" />
                {t('weeklyAdherenceBreakdown')}
              </h3>
              <span className="badge badge-green">{t('auditedBadge')}</span>
            </div>

            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                fontSize: '4.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                color: 'var(--primary)',
                lineHeight: 1
              }}>
                {adherence?.adherencePercentage ?? 100}%
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy)', marginTop: '8px' }}>
                {t('overallAdherenceRate')}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t('basedOnOpportunities', { count: (adherence?.takenCount ?? 0) + (adherence?.missedCount ?? 0) })}
              </p>
            </div>

            {/* Weekly Calendar Dots Table (Section 26) */}
            <div style={{
              background: 'var(--bg-alt)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginTop: '16px'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--navy)', marginBottom: '14px' }}>
                {t('complianceHistory7Day')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
                {(adherence?.weeklyCalendar || []).map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 6px',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                      {day.day}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                      <span className={`dot-indicator dot-${day.status}`} style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {day.status === 'good' ? t('taken') : day.status === 'warning' ? t('partial') : day.status === 'missed' ? t('missed') : t('scheduled')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adherence Counts Sidebar */}
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '16px' }}>
                {t('medicationEvents')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-green-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600 }}>
                    <CheckCircle size={18} /> {t('takenDoses')}
                  </div>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>
                    {adherence?.takenCount ?? 0}
                  </strong>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-red-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 600 }}>
                    <XCircle size={18} /> {t('missedDoses')}
                  </div>
                  <strong style={{ fontSize: '1.2rem', color: '#991b1b' }}>
                    {adherence?.missedCount ?? 0}
                  </strong>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-blue-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#075985', fontWeight: 600 }}>
                    <Clock size={18} /> {t('upcomingToday')}
                  </div>
                  <strong style={{ fontSize: '1.2rem', color: '#075985' }}>
                    {adherence?.upcomingCount ?? 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 27 Guardian Escalation Explainer */}
            <div className="card">
              <h4 style={{ fontSize: '0.9rem', color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} color="var(--status-orange)" />
                {t('missedEscalationTitle')}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {t('missedEscalationDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
