import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Pill, AlertTriangle, FileText, Video, ShieldAlert } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const NotificationDrawer = ({ isOpen, onClose, onRefresh }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'medicine_reminder':
      case 'medicine_due':
        return <Pill size={16} color="var(--primary)" />;
      case 'guardian_alert':
        return <ShieldAlert size={16} color="var(--status-orange)" />;
      case 'emergency_sos':
        return <AlertTriangle size={16} color="var(--status-red)" />;
      case 'careconnect_reminder':
        return <Video size={16} color="var(--status-green)" />;
      default:
        return <FileText size={16} color="var(--primary)" />;
    }
  };

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '420px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        animation: 'slideInRight 0.2s ease-out'
      }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--primary)" />
            <h3 className="card-title" style={{ fontSize: '1.05rem' }}>{t('notificationCenter') || 'Notification Center'}</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-alt)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('unreadAlertsCount', { count: notifications.filter(n => !n.isRead).length }) || `${notifications.filter(n => !n.isRead).length} unread alerts`}
          </span>
          <button className="btn btn-sm" onClick={handleMarkAllRead} style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            <CheckCheck size={14} style={{ marginRight: '4px' }} /> {t('markAllRead') || 'Mark all read'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('loadingNotifications') || 'Loading notifications...'}</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p>{t('noNotifications') || 'No notifications yet.'}</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  marginBottom: '10px',
                  background: item.isRead ? '#ffffff' : 'var(--primary-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getIcon(item.type)}
                    <span style={{ fontWeight: item.isRead ? 600 : 700, fontSize: '0.88rem', color: 'var(--navy)' }}>
                      {item.title}
                    </span>
                  </div>
                  {item.isDemo ? (
                    <span className="badge badge-demo" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>DEMO</span>
                  ) : (
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>REAL</span>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                  {item.message}
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
