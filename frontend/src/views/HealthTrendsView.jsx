import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Info, Calendar, Plus } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const HealthTrendsView = ({ onAddReport }) => {
  const { t } = useTranslation();
  const [trends, setTrends] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('fasting_glucose');
  const [timeRange, setTimeRange] = useState('all'); // 'daily' | 'weekly' | 'monthly' | 'all'
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const res = await api.getTrends();
      setTrends(res.trends || []);
      if (res.trends && res.trends.length > 0 && !res.trends.some(t => t.metricKey === selectedMetric)) {
        setSelectedMetric(res.trends[0].metricKey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const currentTrend = trends.find(t => t.metricKey === selectedMetric) || trends[0];

  // SVG Line Chart Component
  const renderChart = (points, unit) => {
    if (!points || points.length < 2) return null;

    const width = 700;
    const height = 280;
    const padding = 50;

    const numericPoints = points.map(p => ({
      ...p,
      num: typeof p.value === 'number' ? p.value : parseFloat(p.value) || 0
    }));

    const values = numericPoints.map(p => p.num);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const valRange = maxVal - minVal || 1;

    const getX = (index) => padding + (index / (points.length - 1)) * (width - 2 * padding);
    const getY = (val) => height - padding - ((val - minVal) / valRange) * (height - 2 * padding);

    const pathData = numericPoints.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.num);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    // Area fill under line
    const areaData = `${pathData} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = height - padding - pct * (height - 2 * padding);
          const gridVal = (minVal + pct * valRange).toFixed(1);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaData} fill="url(#trendGradient)" />

        {/* Line stroke */}
        <path d={pathData} fill="none" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {numericPoints.map((p, i) => {
          const x = getX(i);
          const y = getY(p.num);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
              <text x={x} y={y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
                {p.num} {unit}
              </text>
              <text x={x} y={height - padding + 22} textAnchor="middle" fontSize="11" fill="#64748b">
                {p.date}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>{t('trendsTitle') || 'Health Trends & Progression'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('trendsSubtitle') || 'Data-driven longitudinal trends computed exclusively from verified diagnostic reports.'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddReport}>
          <Plus size={16} /> + {t('addHealthReport') || 'Add Health Report'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {t('loading') || 'Loading trends...'}
        </div>
      ) : trends.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <TrendingUp size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4 }} />
          <h3>{t('noTrendsYet') || 'No historical data yet'}</h3>
          <p style={{ margin: '8px 0 20px 0' }}>{t('noTrendsSubtitle') || 'Upload additional reports to see trends.'}</p>
          <button className="btn btn-primary" onClick={onAddReport}>
            {t('addHealthReport') || '+ Add Health Report'}
          </button>
        </div>
      ) : (
        <div className="grid-main-side">
          {/* Main Chart Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title">
                  <TrendingUp size={20} color="var(--primary)" />
                  {currentTrend?.metricName} {t('trend') || 'Trend'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {t('standardReference') || 'Standard Target'}: {currentTrend?.referenceRange || (t('standardTarget') || 'Reference target')}
                </span>
              </div>

              {/* Time Range Filter Pills */}
              <div className="mode-pills">
                <button
                  className={`mode-pill-btn ${timeRange === 'daily' ? 'active' : ''}`}
                  onClick={() => setTimeRange('daily')}
                >
                  {t('daily') || 'Daily'}
                </button>
                <button
                  className={`mode-pill-btn ${timeRange === 'weekly' ? 'active' : ''}`}
                  onClick={() => setTimeRange('weekly')}
                >
                  {t('weekly') || 'Weekly'}
                </button>
                <button
                  className={`mode-pill-btn ${timeRange === 'monthly' ? 'active' : ''}`}
                  onClick={() => setTimeRange('monthly')}
                >
                  {t('monthly') || 'Monthly'}
                </button>
                <button
                  className={`mode-pill-btn ${timeRange === 'all' ? 'active' : ''}`}
                  onClick={() => setTimeRange('all')}
                >
                  {t('allHistory') || 'All History'}
                </button>
              </div>
            </div>

            {/* If not enough points, show exact message */}
            {!currentTrend?.hasEnoughData ? (
              <div style={{
                background: 'var(--bg-alt)',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '60px 20px',
                textAlign: 'center',
                margin: '20px 0'
              }}>
                <AlertCircle size={36} color="var(--status-orange)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '6px' }}>
                  {t('notEnoughData') || 'Not enough historical data for a trend.'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                  {t('notEnoughDataSubtitle') || 'A minimum of two verified measurements is required to construct a valid progression trend. We never synthesize dummy data.'}
                </p>
                <button className="btn btn-secondary btn-sm" onClick={onAddReport}>
                  {t('uploadNextReport') || 'Upload Next Report'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '20px 10px' }}>
                {renderChart(currentTrend.points, currentTrend.unit)}
              </div>
            )}

            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <Info size={14} />
              <span>{currentTrend?.statusNote}</span>
            </div>
          </div>

          {/* Metric Selector Sidebar */}
          <div>
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '14px' }}>
                {t('biomarkersTitle') || 'Tracked Biomarkers'} ({trends.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trends.map(tItem => {
                  const isSelected = selectedMetric === tItem.metricKey;
                  const latestPoint = tItem.points[tItem.points.length - 1];
                  return (
                    <div
                      key={tItem.metricKey}
                      onClick={() => setSelectedMetric(tItem.metricKey)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: isSelected ? 'var(--primary-subtle)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? 'var(--primary-dark)' : 'var(--navy)' }}>
                          {tItem.metricName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {tItem.points.length} {t('pts') || 'pts'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t('latest') || 'Latest'}: <strong>{latestPoint?.value} {tItem.unit}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
