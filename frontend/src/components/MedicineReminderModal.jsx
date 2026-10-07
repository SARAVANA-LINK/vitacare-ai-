import React, { useState } from 'react';
import { Pill, Clock, Check, PhoneCall, Video, X, Camera } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';
import { PillConsumptionTrackerModal } from './PillConsumptionTrackerModal';

export const MedicineReminderModal = ({ isOpen, onClose, schedule, onConfirmed, onStartCareConnect }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [phoneCallResult, setPhoneCallResult] = useState(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  if (!isOpen || !schedule) return null;

  const handleStartTracking = () => {
    setIsTrackerOpen(true);
  };

  const handleRemindLater = async () => {
    try {
      await api.snoozeMedicine(schedule.id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceCall = async () => {
    try {
      setLoading(true);
      const res = await api.triggerWarningCall(schedule.id);
      setPhoneCallResult({
        callType: res.action === 'guardian_escalated' ? 'Guardian Escalation' : `Warning Call #${res.attemptCount}`,
        message: res.message,
        recipient: res.guardianName ? `${res.guardianName} (${res.guardianPhone})` : res.phoneNumber
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 220 }}>
      <div className="modal-content" style={{ maxWidth: '500px', borderTop: '5px solid var(--primary)' }}>
        <div className="modal-header">
          <h3 className="card-title">
            <Pill size={22} color="var(--primary)" />
            {t('medicineReminderTitle') || 'MEDICINE REMINDER'}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--primary-subtle)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('scheduledDoseDue') || 'Scheduled Dose Due'}
            </span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--navy)', margin: '6px 0' }}>
              {schedule.medicineName}
            </h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {schedule.dosage}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', color: 'var(--primary-dark)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Clock size={16} /> {t('scheduledAtTime', { time: schedule.scheduledTime }) || `Scheduled: ${schedule.scheduledTime}`}
            </div>
            {schedule.instructions && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {t('instructionsWithLabel', { instructions: schedule.instructions }) || `Instructions: ${schedule.instructions}`}
              </p>
            )}
          </div>

          {phoneCallResult && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              marginBottom: '14px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--navy)' }}>{t('voiceCallDispatched') || 'Voice Call Dispatched:'}</strong>
                <span className="badge badge-orange">{phoneCallResult.callType}</span>
              </div>
              <p style={{ margin: 0 }}>{phoneCallResult.message}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleVoiceCall} disabled={loading}>
              <PhoneCall size={14} /> {t('sendVoiceCallAlert') || 'Send Voice Call Alert'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { onClose(); onStartCareConnect(schedule); }}>
              <Video size={14} color="var(--primary)" /> {t('careConnectVideoBtn') || 'CareConnect Video'}
            </button>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleRemindLater} disabled={loading}>
            {t('remindMeLater') || 'Remind Me Later'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleStartTracking} 
            disabled={loading} 
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Camera size={16} /> {t('startCameraTrackingBtn') || t('trackPillIntake') || 'START CAMERA TRACKING'}
          </button>
        </div>
      </div>

      {/* Embedded Real Camera Tracking HUD Modal */}
      <PillConsumptionTrackerModal
        isOpen={isTrackerOpen}
        schedule={schedule}
        onClose={() => setIsTrackerOpen(false)}
        onVerified={() => {
          setIsTrackerOpen(false);
          if (onConfirmed) onConfirmed();
          onClose();
        }}
        onRefused={() => {
          setIsTrackerOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
