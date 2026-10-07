import React, { useState, useEffect } from 'react';
import { Clock, FileText, Pill, CheckCircle, Video, AlertTriangle, Activity, Filter } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const TimelineView = () => {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.getTimeline(filterType);
      setTimeline(res.timeline || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [filterType]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'report_uploaded':
        return <FileText size={16} color="var(--primary)" />;
      case 'prescription_added':
      case 'medicine_scheduled':
        return <Pill size={16} color="#0284c7" />;
      case 'medication_confirmed':
        return <CheckCircle size={16} color="var(--status-green)" />;
      case 'careconnect_session':
        return <Video size={16} color="#6366f1" />;
      case 'sos_triggered':
        return <AlertTriangle size={16} color="var(--status-red)" />;
      default:
        return <Activity size={16} color="var(--primary)" />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>{t('timelineTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('timelineSubtitle')}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: t('allHealthEvents') },
            { id: 'report_uploaded', label: t('reportsTab') },
            { id: 'prescription_added', label: t('prescriptionsTab') },
            { id: 'medication_confirmed', label: t('dosesConfirmedTab') },
            { id: 'careconnect_session', label: t('careConnectTab') },
            { id: 'vital_updated', label: t('vitalsLoggedTab') }
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${filterType === tab.id ? 'active' : ''}`}
              onClick={() => setFilterType(tab.id)}
              style={{ fontSize: '0.82rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            {t('loadingMedicalTimeline')}
          </div>
        ) : timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p>{t('noTimelineEvents')}</p>
          </div>
        ) : (
          <div className="timeline-list">
            {timeline.map((event, idx) => (
              <div key={idx} className="timeline-node">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="timeline-date">{event.eventDate || new Date(event.createdAt).toLocaleDateString()}</div>
                  {event.isDemo && (
                    <span className="badge badge-demo" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                      {t('demoEventBadge')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {getEventIcon(event.eventType)}
                  <div className="timeline-title">{event.title}</div>
                </div>
                <div className="timeline-desc">{event.description}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t('loggedAtTime', { time: new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
