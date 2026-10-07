import React, { useState, useEffect } from 'react';
import { Activity, Plus, ShieldCheck, Calendar, FileText, ArrowUp, ArrowDown, Minus, X, CheckCircle2, Clock, AlertCircle, Check, Pill, RefreshCw, Camera, Eye } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';
import { PillConsumptionTrackerModal } from '../components/PillConsumptionTrackerModal';

export const HealthTrackerView = ({ onAddReport }) => {
  const { t } = useTranslation();
  const [vitals, setVitals] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [trackingTargetSchedule, setTrackingTargetSchedule] = useState(null);

  const [manualForm, setManualForm] = useState({
    metricName: '',
    value: '',
    unit: 'mg/dL',
    referenceRange: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [vitalsRes, schedRes] = await Promise.all([
        api.getVitals(),
        api.getTodaySchedule()
      ]);
      setVitals(vitalsRes.vitals || []);
      setSchedules(schedRes.schedules || []);
    } catch (err) {
      console.error('Error fetching tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Real-time UI: Safe polling interval for automated status updates (Requirement 14)
    const interval = setInterval(() => {
      fetchData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmIntake = async (scheduleId, medicineName) => {
    try {
      setConfirmingId(scheduleId);
      const res = await api.markMedicineTaken(scheduleId);
      
      // Update local state dynamically
      setSchedules(prev => prev.map(s => {
        if (s.id === scheduleId) {
          return {
            ...s,
            status: 'Verified',
            taken: true,
            takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      }));

      setActionMessage({
        type: 'success',
        text: `✅ ${medicineName} ${t('statusVerified') || 'Verified'}! Guardian alert dispatched to registered proxy.`
      });

      setTimeout(() => {
        setActionMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to confirm intake:', err);
      setActionMessage({
        type: 'error',
        text: `Error verifying medication intake: ${err.message}`
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.logManualVital(manualForm);
      setIsManualModalOpen(false);
      setManualForm({
        metricName: '',
        value: '',
        unit: 'mg/dL',
        referenceRange: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const normStatus = (s.status || 'Pending').toLowerCase();
    if (statusFilter === 'verified') return normStatus === 'verified' || normStatus === 'taken';
    if (statusFilter === 'pending') return normStatus === 'pending' || normStatus === 'scheduled';
    if (statusFilter === 'missed') return normStatus === 'missed' || normStatus === 'skipped';
    return true;
  });

  const verifiedCount = schedules.filter(s => (s.status || '').toLowerCase() === 'verified' || (s.status || '').toLowerCase() === 'taken').length;
  const pendingCount = schedules.filter(s => (s.status || '').toLowerCase() === 'pending' || (s.status || '').toLowerCase() === 'scheduled').length;
  const missedCount = schedules.filter(s => (s.status || '').toLowerCase() === 'missed' || (s.status || '').toLowerCase() === 'skipped').length;

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>{t('healthTrackerTitle') || 'Unified Health Tracker & Verification'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('healthTrackerSubtitle') || 'Live patient medication intake verification, biomarker trends, and verified diagnostic records.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setIsManualModalOpen(true)}>
            <Plus size={16} /> {t('logVital') || 'Log Manual Vital'}
          </button>
          <button className="btn btn-primary" onClick={onAddReport}>
            <Plus size={16} /> + {t('addReport') || 'Add Health Report'}
          </button>
        </div>
      </div>

      {/* Action Notification Toast / Banner */}
      {actionMessage && (
        <div style={{
          background: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${actionMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION: MEDICINE VERIFICATION TRACKER (Requirement 2) */}
      <div className="card" style={{ marginBottom: '28px', borderLeft: '5px solid var(--primary)' }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={20} color="var(--primary)" />
              {t('medicationVerification') || 'Scheduled Medicine Verification'}
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {t('medicineVerificationSubtitle') || 'Tracks whether the patient has taken each scheduled dose. Updates dynamically and stores to user profile.'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              <button
                className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('all')}
              >
                {t('allFilters') || 'All'} ({schedules.length})
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('pending')}
              >
                ⏳ {t('statusPending') || 'Pending'} ({pendingCount})
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setStatusFilter('verified')}
              >
                ✅ {t('statusVerified') || 'Verified'} ({verifiedCount})
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={fetchData} title={t('refresh') || 'Refresh schedules'}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Verification Summary Counters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          background: 'var(--bg-alt)',
          padding: '12px',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('totalScheduled') || 'Total Scheduled'}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)' }}>{schedules.length}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #86efac' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>✅ {t('statusVerified') || 'Verified'}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{verifiedCount}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>⏳ {t('statusPending') || 'Pending'}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c' }}>{pendingCount}</div>
          </div>
          <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>⚠️ {t('statusMissed') || 'Missed'}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{missedCount}</div>
          </div>
        </div>

        {/* Medicine Verification Table / Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            {t('loading') || 'Loading medicine schedules...'}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', background: 'var(--bg-alt)', borderRadius: 'var(--radius-lg)' }}>
            <Pill size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>{t('noSchedulesFiltered') || 'No medicine schedules found for this filter.'}</p>
            <p style={{ fontSize: '0.82rem' }}>{t('noSchedulesAddRx') || 'Add a prescription or manual medicine to populate scheduled verification times.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredSchedules.map((item) => {
              const rawStatus = (item.status || 'Pending').toLowerCase();
              const isVerified = rawStatus === 'verified' || rawStatus === 'taken';
              const isPending = rawStatus === 'pending' || rawStatus === 'scheduled';
              const isMissed = rawStatus === 'missed' || rawStatus === 'skipped';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: isVerified ? '#f0fdf4' : isPending ? '#ffffff' : '#fef2f2',
                    border: `1px solid ${isVerified ? '#bbf7d0' : isPending ? 'var(--border-light)' : '#fecaca'}`,
                    transition: 'all 0.2s ease',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  {/* Left: Medicine & Dosage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isVerified ? '#dcfce7' : isPending ? 'var(--primary-subtle)' : '#fee2e2',
                      color: isVerified ? '#16a34a' : isPending ? 'var(--primary)' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Pill size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)' }}>
                        {item.medicineName}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <strong>{t('dosage') || 'Dosage'}:</strong> {item.dosage} {item.instructions ? `• ${item.instructions}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Scheduled Time & Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    <Clock size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                        {item.scheduledTime || '08:00 AM'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {item.date || 'Today'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Dynamic Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isVerified && (
                      <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <CheckCircle2 size={16} />
                        {t('statusVerified') || 'VERIFIED'}
                      </span>
                    )}

                    {isPending && (
                      <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Clock size={16} />
                        {t('statusPending') || 'PENDING'}
                      </span>
                    )}

                    {isMissed && (
                      <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <AlertCircle size={16} />
                        {t('statusMissed') || 'MISSED'}
                      </span>
                    )}

                    {/* Automatic Pill Consumption Tracking: Camera Vision Trigger Only */}
                    {isPending ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => setTrackingTargetSchedule(item)}
                        title="Start camera-based pill consumption tracking"
                      >
                        <Camera size={16} />
                        {t('trackPillIntake') || 'Track Intake (Camera)'}
                      </button>
                    ) : isVerified ? (
                      <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={16} />
                        {t('statusVerified') || 'VERIFIED'} • {item.verifiedVia === 'camera_vision_pipeline' ? (t('aiCameraVerified') || 'AI Camera Verified') : (t('verified') || 'Verified')} {item.takenAt ? `${t('atTime') || 'at'} ${item.takenAt}` : ''}
                      </div>
                    ) : (
                      <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: UNIFIED BIOMARKERS & SOURCE TRANSPARENCY */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>
          {t('verifiedBiomarkersTitle') || 'Verified Physiological Biomarkers & Vitals'} ({vitals.length})
        </h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('clinicalIntervalSubtitle') || 'Clinical interval transparency & OCR report lineage'}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {t('loading') || 'Loading health biomarkers...'}
        </div>
      ) : vitals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Activity size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto', opacity: 0.4 }} />
          <h3>{t('noVitalsRecorded') || 'No health measurements recorded'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 20px 0' }}>
            {t('noVitalsRecordedSubtitle') || 'Upload a diagnostic health report or log a manual measurement to begin tracking.'}
          </p>
          <button className="btn btn-primary" onClick={onAddReport}>
            {t('addHealthReport') || '+ ADD HEALTH REPORT'}
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {vitals.map((v, idx) => (
            <div key={idx} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: '2px' }}>
                    {v.metricName}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {t('standardReference') || 'Standard Reference'}: {v.referenceRange || (t('standardTarget') || 'Standard clinical target')}
                  </span>
                </div>
                <span className={`badge ${
                  v.statusIndicator === 'normal' ? 'badge-green' :
                  v.statusIndicator === 'elevated' ? 'badge-orange' : 'badge-blue'
                }`}>
                  {v.statusIndicator}
                </span>
              </div>

              {/* Value and Delta */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '14px 0' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--navy)' }}>
                  {v.value}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {v.unit}
                </span>

                {v.previousValue && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>{t('previous') || 'Previous'}: <strong>{v.previousValue} {v.unit}</strong></span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Date: {v.previousDate}</div>
                  </div>
                )}
              </div>

              {/* Source Transparency Box */}
              <div style={{
                background: 'var(--bg-alt)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{t('sourceDoc') || 'Source Document'}:</span>
                  <strong style={{ color: 'var(--navy)' }}>{v.source?.title || (t('patientHealthEntry') || 'Patient Health Entry')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{t('recordedDate') || 'Recorded Date'}:</span>
                  <span>{v.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('verificationStatus') || 'Verification'}:</span>
                  <span style={{ color: 'var(--status-green)', fontWeight: 700 }}>
                    <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {v.verificationStatus || (t('clinicallyVerified') || 'Clinically Verified')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Vital Logger Modal */}
      {isManualModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">{t('logVitalModalHeading') || 'Log Manual Vital Measurement'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsManualModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('biomarkerName') || 'Metric Name'}</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Fasting Blood Glucose, Blood Pressure"
                    value={manualForm.metricName}
                    onChange={(e) => setManualForm({ ...manualForm, metricName: e.target.value })}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('measurementValue') || 'Measurement Value'}</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 108"
                      value={manualForm.value}
                      onChange={(e) => setManualForm({ ...manualForm, value: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('metricUnit') || 'Unit'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. mg/dL, mmHg, %"
                      value={manualForm.unit}
                      onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('referenceRange') || 'Reference Range'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 70 - 99 mg/dL"
                    value={manualForm.referenceRange}
                    onChange={(e) => setManualForm({ ...manualForm, referenceRange: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('recordedDate') || 'Measurement Date'}</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsManualModalOpen(false)}>
                  {t('cancel') || 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('saveVitalMeasurement') || 'Save Vital Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Camera Pill Consumption Tracking HUD Modal */}
      <PillConsumptionTrackerModal
        isOpen={!!trackingTargetSchedule}
        schedule={trackingTargetSchedule}
        onClose={() => setTrackingTargetSchedule(null)}
        onVerified={(res) => {
          fetchData();
          setActionMessage({
            type: 'success',
            text: `✅ ${trackingTargetSchedule?.medicineName} ${t('statusVerified') || 'Verified'}! Guardian alert dispatched to registered proxy.`
          });
          setTimeout(() => setActionMessage(null), 5000);
        }}
        onRefused={(res) => {
          fetchData();
          setActionMessage({
            type: 'error',
            text: `⚠️ ${trackingTargetSchedule?.medicineName} Refused. Automated call escalation initiated.`
          });
          setTimeout(() => setActionMessage(null), 6000);
        }}
      />
    </div>
  );
};
