import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pill, 
  FileText, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  AlertCircle, 
  ShieldCheck, 
  Heart,
  Droplet,
  Flame,
  CalendarCheck,
  Megaphone,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Camera
} from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';
import { PillConsumptionTrackerModal } from '../components/PillConsumptionTrackerModal';

export const DashboardView = ({ 
  onAddPrescription, 
  onAddReport, 
  onOpenMedicineReminder, 
  onViewReport, 
  setActiveView 
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [cmsConfig, setCmsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackingTargetSchedule, setTrackingTargetSchedule] = useState(null);

  const fetchDashboard = async () => {
    try {
      const [overviewRes, cmsRes] = await Promise.all([
        api.getDashboardOverview(),
        api.getCmsConfig().catch(() => ({ modules: [], cards: [], announcements: [], content: {} }))
      ]);
      setData(overviewRes);
      setCmsConfig(cmsRes);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setErrorMsg('Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Real-time UI: Safe polling interval for automated status updates (Requirement 14)
    const interval = setInterval(() => {
      fetchDashboard();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          margin: '0 auto 16px auto',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading personal health dashboard...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const user = data?.user;
  const nextMed = data?.nextMedicine;
  const latestVitals = data?.latestVitals || [];
  const todaySchedules = data?.todaySchedules || [];
  const adherence = data?.adherence;
  const recentReports = data?.recentReports || [];
  const summaryPoints = data?.healthStatusSummary?.points || [];

  // CMS Helper to check if a module is enabled
  const isModuleEnabled = (key) => {
    if (!cmsConfig?.modules || cmsConfig.modules.length === 0) return true;
    const mod = cmsConfig.modules.find(m => m.key === key);
    return mod ? mod.isEnabled !== false : true;
  };

  const heroTitle = cmsConfig?.content?.hero_title || `Welcome back, ${user?.name || 'Patient'}`;
  const heroSubtitle = cmsConfig?.content?.hero_subtitle || 'VitaCare AI Personal Health Copilot • Unified clinical biomarker tracking and dose supervision';
  const announcements = (cmsConfig?.announcements || []).filter(a => a.isPublished !== false);
  const cmsCards = (cmsConfig?.cards || []).filter(c => c.isVisible !== false);

  return (
    <div>
      {/* 1. DYNAMIC CMS ANNOUNCEMENT BROADCASTS */}
      {isModuleEnabled('announcements') && announcements.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                background: ann.alertType === 'warning' ? '#fffbeb' :
                            ann.alertType === 'alert' ? '#fef2f2' :
                            ann.alertType === 'success' ? '#f0fdf4' : '#f0f9ff',
                border: `1px solid ${
                  ann.alertType === 'warning' ? '#fde68a' :
                  ann.alertType === 'alert' ? '#fca5a5' :
                  ann.alertType === 'success' ? '#86efac' : '#bae6fd'
                }`,
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: ann.alertType === 'warning' ? '#f59e0b' :
                            ann.alertType === 'alert' ? '#dc2626' :
                            ann.alertType === 'success' ? '#16a34a' : 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Megaphone size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  fontSize: '0.92rem',
                  color: ann.alertType === 'alert' ? '#991b1b' : 'var(--navy)'
                }}>
                  {ann.title}
                </strong>
                <p style={{
                  fontSize: '0.82rem',
                  color: ann.alertType === 'alert' ? '#b91c1c' : 'var(--text-secondary)',
                  margin: '2px 0 0 0'
                }}>
                  {ann.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. PRIMARY ACTION & HERO BANNER */}
      <div className="action-banner">
        <div className="action-banner-text">
          <h2>{cmsConfig?.content?.hero_title || (t('welcomeUser', { name: user?.name || 'Patient' }))}</h2>
          <p>{cmsConfig?.content?.hero_subtitle || t('tagline')}</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
            <span>{t('bloodGroup')}: <strong>{user?.bloodGroup || 'O+'}</strong></span>
            <span>{t('age')}: <strong>{user?.age || '48'}</strong></span>
            <span>{t('preferredLanguage')}: <strong>{user?.preferredLanguage?.toUpperCase() || 'EN'}</strong></span>
          </div>
        </div>
        <div className="action-banner-buttons">
          <button
            className="btn btn-primary btn-lg"
            onClick={onAddPrescription}
            id="btn-add-prescription-top"
            style={{ boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)' }}
          >
            <Plus size={18} /> {t('addPrescription')}
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onAddReport}
            id="btn-add-health-report-top"
            style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--navy)' }}
          >
            <Plus size={18} /> {t('addHealthReport')}
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC CMS KPI & METRIC STAT CARDS */}
      {isModuleEnabled('quick_stats') && cmsCards.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {cmsCards.map((card) => (
            <div key={card.id} className="card" style={{ padding: '18px 20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {card.title}
                </span>
                <span className={`badge ${
                  card.badgeColor === 'green' ? 'badge-green' :
                  card.badgeColor === 'orange' ? 'badge-orange' :
                  card.badgeColor === 'purple' ? 'badge-purple' : 'badge-blue'
                }`} style={{ fontSize: '0.68rem' }}>
                  {card.badgeColor ? card.badgeColor.toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>
                {card.value}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {card.subtitle}
                </span>
                {card.delta && (
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                    {card.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. NEXT SCHEDULED MEDICINE CARD */}
      {isModuleEnabled('next_dose') && (
        nextMed ? (
          <div className="next-med-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}>
                <Pill size={26} />
              </div>
              <div className="next-med-info">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('nextMedicine')}
                </span>
                <h3>{nextMed.medicineName}</h3>
                <div className="next-med-details">
                  <span>{t('dosage')}: <strong>{nextMed.dosage}</strong></span>
                  <span>{t('time')}: <strong>{nextMed.scheduledTime}</strong></span>
                  {nextMed.instructions && <span>{t('instructions')}: {nextMed.instructions}</span>}
                </div>
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setTrackingTargetSchedule(nextMed)}
                id="btn-track-pill-next"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Camera size={18} /> {t('trackPillIntake')}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="var(--status-green)" />
              <span>{t('allDosesCompleted')}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('medicines')}>
              {t('viewAllMedicines')}
            </button>
          </div>
        )
      )}

      {/* 5. MAIN 2-COLUMN LAYOUT */}
      <div className="grid-main-side">
        {/* Left Column */}
        <div>
          {/* Latest Health Measurements Grid */}
          {isModuleEnabled('vitals_summary') && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">
                  <Activity size={20} color="var(--primary)" />
                  {t('biomarkers') || 'Latest Health Measurements'}
                </h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveView('tracker')}
                >
                  Health Tracker <ArrowUpRight size={14} />
                </button>
              </div>

              {latestVitals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <p>No health report measurements recorded yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={onAddReport} style={{ marginTop: '12px' }}>
                    + Add Health Report
                  </button>
                </div>
              ) : (
                <div className="grid-3">
                  {latestVitals.slice(0, 6).map((vital, idx) => (
                    <div key={idx} className="vital-stat-card">
                      <div className="vital-stat-top">
                        <span className="vital-name">{vital.metricName}</span>
                        <span className={`badge ${
                          vital.statusIndicator === 'normal' ? 'badge-green' :
                          vital.statusIndicator === 'elevated' ? 'badge-orange' : 'badge-blue'
                        }`}>
                          {vital.statusIndicator}
                        </span>
                      </div>
                      <div className="vital-value-display">
                        <span className="vital-value">{vital.value}</span>
                        <span className="vital-unit">{vital.unit}</span>
                      </div>
                      <div className="vital-meta">
                        <span>Ref: {vital.referenceRange || 'Standard'}</span>
                        <span>{vital.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today's Medicines Schedule List */}
          {isModuleEnabled('today_schedules') && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">
                  <Pill size={20} color="var(--primary)" />
                  {t('todaysDoses') || "Today's Medicine Schedule"}
                </h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveView('medicines')}
                >
                  Manage Schedule <ArrowUpRight size={14} />
                </button>
              </div>

              {todaySchedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  <p>No medicines scheduled for today.</p>
                  <button className="btn btn-primary btn-sm" onClick={onAddPrescription} style={{ marginTop: '10px' }}>
                    + Add Prescription
                  </button>
                </div>
              ) : (
                <div>
                  {todaySchedules.map((med) => (
                    <div key={med.id} className={`med-schedule-item ${med.status}`}>
                      <div className="med-schedule-time">
                        <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {med.scheduledTime}
                      </div>
                      <div className="med-schedule-info">
                        <div className="med-schedule-name">{med.medicineName}</div>
                        <div className="med-schedule-dose">
                          {med.dosage} • {med.instructions || 'After food'}
                        </div>
                      </div>
                      <div>
                        {med.status === 'taken' || med.status === 'Verified' ? (
                          <span className="badge badge-green">
                            <CheckCircle size={12} /> VERIFIED
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setTrackingTargetSchedule(med)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Camera size={13} /> {t('trackPillIntake') || 'Track Intake'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Data-driven Health Status Summary */}
          {isModuleEnabled('health_status') && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <ShieldCheck size={20} color="var(--primary)" />
                  Data-Driven Health Summary
                </h3>
                <span className="badge badge-demo">VERIFIED METRICS</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                  {summaryPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
                <div style={{ marginTop: '12px', fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                  Notice: Data summary is generated strictly from uploaded document records without synthetic clinical diagnoses.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Adherence Card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <CalendarCheck size={18} color="var(--primary)" />
                {t('adherence') || 'Medication Adherence'}
              </h3>
              <span className="badge badge-green">THIS WEEK</span>
            </div>

            <div className="adherence-gauge">
              <div className="adherence-score">{adherence?.adherencePercentage ?? 100}%</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Taken: <strong>{adherence?.takenCount ?? 0}</strong> • Missed: <strong>{adherence?.missedCount ?? 0}</strong>
              </p>

              {/* 7-Day Dot Calendar */}
              <div className="weekly-dots">
                {(adherence?.weeklyCalendar || []).map((day, i) => (
                  <div key={i} className="day-dot-item">
                    <span className="day-label">{day.day}</span>
                    <span className={`dot-indicator dot-${day.status}`} title={`${day.date}: ${day.status}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Reports List */}
          {isModuleEnabled('recent_reports') && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <FileText size={18} color="var(--primary)" />
                  {t('healthReports') || 'Recent Reports'}
                </h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveView('reports')}
                >
                  All Reports
                </button>
              </div>

              {recentReports.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                  No reports uploaded yet.
                </p>
              ) : (
                <div>
                  {recentReports.map(rep => (
                    <div
                      key={rep.id}
                      onClick={() => onViewReport ? onViewReport(rep) : setActiveView('reports')}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy)' }}>
                          {rep.reportType}
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                          V{rep.version || 1}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rep.labName} • {rep.reportDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real Camera Pill Consumption Tracking HUD Modal */}
      <PillConsumptionTrackerModal
        isOpen={!!trackingTargetSchedule}
        schedule={trackingTargetSchedule}
        onClose={() => setTrackingTargetSchedule(null)}
        onVerified={() => {
          fetchDashboard();
        }}
        onRefused={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
};
