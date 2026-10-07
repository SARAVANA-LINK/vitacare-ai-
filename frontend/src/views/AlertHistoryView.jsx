import React, { useState, useEffect } from 'react';
import { 
  History, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  ShieldAlert, 
  XCircle, 
  Clock, 
  Pill, 
  Filter, 
  User, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const AlertHistoryView = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getAlertHistory();
      setHistory(res.history || res.alerts || []);
    } catch (err) {
      console.error('Failed to load alert history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered entries
  const filteredHistory = history.filter(item => {
    if (filterType === 'all') return true;
    const type = (item.alertType || '').toLowerCase();
    const status = (item.status || '').toLowerCase();

    if (filterType === 'verified') return type.includes('verified') || status === 'confirmed' || status === 'verified';
    if (filterType === 'calls') return type.includes('warning') || type.includes('call') || type.includes('patient');
    if (filterType === 'guardian') return type.includes('guardian') || status === 'escalated';
    if (filterType === 'refused') return type.includes('refused') || status === 'refused';
    return true;
  });

  const verifiedCount = history.filter(h => (h.alertType || '').includes('verified') || (h.status || '').toLowerCase() === 'confirmed').length;
  const callCount = history.filter(h => (h.alertType || '').includes('warning') || (h.alertType || '').includes('call')).length;
  const escalationCount = history.filter(h => (h.alertType || '').includes('guardian')).length;
  const refusalCount = history.filter(h => (h.alertType || '').includes('refused')).length;

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="view-title">
              {t('alertHistoryTitle')}
            </h1>
            <span className="badge badge-demo">{t('auditTrailBadge')}</span>
          </div>
          <p className="view-subtitle">
            {t('alertHistorySubtitle')}
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchHistory} title={t('refresh')}>
          <RefreshCw size={14} /> {t('refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('totalAuditEvents')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '4px 0' }}>{history.length}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('fullLifecycleTracking')}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>{t('verifiedIntakes')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>{verifiedCount}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('aiCameraConfirmed')}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '0.78rem', color: '#9a3412', fontWeight: 600 }}>{t('warningCalls')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ea580c', margin: '4px 0' }}>{callCount}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('automatedVoiceAlerts')}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>{t('guardianEscalations')}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>{escalationCount}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('smsCallDispatched')}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button 
          className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('all')}
        >
          {t('allEventsCount', { count: history.length })}
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('verified')}
        >
          {t('verifiedCountBtn', { count: verifiedCount })}
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'calls' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('calls')}
        >
          {t('phoneCallsCountBtn', { count: callCount })}
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'guardian' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('guardian')}
        >
          {t('guardianAlertsCountBtn', { count: escalationCount })}
        </button>
        <button 
          className={`btn btn-sm ${filterType === 'refused' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('refused')}
        >
          {t('patientRefusalsCountBtn', { count: refusalCount })}
        </button>
      </div>

      {/* Chronological Timeline */}
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <h3 className="card-title">
            <History size={18} color="var(--primary)" />
            {t('chronologicalLog')}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('showingRecordsCount', { count: filteredHistory.length, total: history.length })}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid var(--border-light)',
              borderTopColor: 'var(--primary)',
              margin: '0 auto 12px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p>{t('loadingAlertHistory')}</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <History size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>{t('noAlertHistory')}</p>
            <p style={{ fontSize: '0.82rem' }}>{t('auditLogsDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
            {filteredHistory.map((item, index) => {
              const type = (item.alertType || '').toLowerCase();
              const isVerified = type.includes('verified') || item.status === 'confirmed';
              const isGuardian = type.includes('guardian');
              const isCall = type.includes('warning') || type.includes('call');
              const isRefusal = type.includes('refused');

              const eventTime = item.createdAt 
                ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Recorded';
              const eventDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Today';

              return (
                <div
                  key={item.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    background: isVerified ? '#f0fdf4' : isGuardian ? '#fef2f2' : isRefusal ? '#fff1f2' : isCall ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${isVerified ? '#bbf7d0' : isGuardian ? '#fecaca' : isRefusal ? '#fecdd3' : isCall ? '#fde68a' : 'var(--border-light)'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Timeline Badge Icon */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isVerified ? '#dcfce7' : isGuardian ? '#fee2e2' : isRefusal ? '#ffe4e6' : isCall ? '#fef3c7' : 'var(--bg-alt)',
                    color: isVerified ? '#16a34a' : isGuardian ? '#dc2626' : isRefusal ? '#e11d48' : isCall ? '#d97706' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {isVerified ? <CheckCircle2 size={22} /> :
                     isGuardian ? <ShieldAlert size={22} /> :
                     isRefusal ? <XCircle size={22} /> :
                     isCall ? <PhoneCall size={22} /> : <Clock size={22} />}
                  </div>

                  {/* Main Event Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.98rem', color: 'var(--navy)' }}>
                          {item.medicineName || 'Medication Dose'}
                        </strong>
                        {item.dosage && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ({item.dosage})
                          </span>
                        )}

                        <span className={`badge ${
                          isVerified ? 'badge-green' :
                          isGuardian ? 'badge-red' :
                          isRefusal ? 'badge-red' :
                          isCall ? 'badge-orange' : 'badge-blue'
                        }`} style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          {item.alertType || item.status}
                        </span>

                        {item.attemptNumber > 0 && (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                            {t('attemptNumber', { number: item.attemptNumber })}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} />
                        <strong>{eventTime}</strong> • {eventDate}
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.86rem',
                      color: isVerified ? '#166534' : isGuardian ? '#991b1b' : isRefusal ? '#9f1239' : '#92400e',
                      margin: '4px 0 8px 0',
                      lineHeight: 1.5
                    }}>
                      {item.messageContent || item.reason || 'Event processed by VitaCare state engine.'}
                    </p>

                    {/* Metadata Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid rgba(0,0,0,0.05)',
                      paddingTop: '6px'
                    }}>
                      {item.recipient && (
                        <span>
                          <strong>{t('recipientLabel')}:</strong> {item.recipient}
                        </span>
                      )}
                      {item.recipientType && (
                        <span>
                          <strong>{t('channelLabel')}:</strong> {item.recipientType}
                        </span>
                      )}
                      {item.status && (
                        <span>
                          <strong>{t('statusLabel')}:</strong> {item.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
