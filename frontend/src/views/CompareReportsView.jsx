import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus, Info, AlertCircle } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const CompareReportsView = ({ onBackToReports }) => {
  const { t, language } = useTranslation();
  const [reports, setReports] = useState([]);
  const [rep1Id, setRep1Id] = useState('');
  const [rep2Id, setRep2Id] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadReports();
  }, [language]);

  const loadReports = async () => {
    try {
      const res = await api.getReports();
      const list = res.reports || [];
      setReports(list);

      // Auto-select latest two reports if available
      if (list.length >= 2) {
        setRep1Id(list[1].id);
        setRep2Id(list[0].id);
        fetchComparison(list[1].id, list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComparison = async (id1, id2) => {
    if (!id1 || !id2) return;
    if (id1 === id2) {
      setErrorMsg(t('selectDistinctReports'));
      setComparisonData(null);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.compareReports(id1, id2, language);
      setComparisonData(res);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('networkError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareClick = () => {
    fetchComparison(rep1Id, rep2Id);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'Increased' || trend === t('trendIncreased')) return <TrendingUp size={16} color="var(--primary)" />;
    if (trend === 'Decreased' || trend === t('trendDecreased')) return <TrendingDown size={16} color="var(--status-orange)" />;
    return <Minus size={16} color="var(--text-muted)" />;
  };

  const getLocalizedTrend = (trend) => {
    if (trend === 'Increased') return t('trendIncreased');
    if (trend === 'Decreased') return t('trendDecreased');
    return t('trendStable');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>{t('compareMedicalReports')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('compareReportsSubtitle')}
          </p>
        </div>
        {onBackToReports && (
          <button className="btn btn-secondary" onClick={onBackToReports}>
            {t('allReports')}
          </button>
        )}
      </div>

      {/* Report Selection Dropdowns */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('previousBaselineReport')}</label>
            <select
              className="form-select"
              value={rep1Id}
              onChange={(e) => setRep1Id(e.target.value)}
            >
              <option value="">{t('selectBaselineReport')}</option>
              {reports.map(r => (
                <option key={r.id} value={r.id}>
                  {r.reportType} ({r.reportDate})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('currentReport')}</label>
            <select
              className="form-select"
              value={rep2Id}
              onChange={(e) => setRep2Id(e.target.value)}
            >
              <option value="">{t('selectCurrentReport')}</option>
              {reports.map(r => (
                <option key={r.id} value={r.id}>
                  {r.reportType} ({r.reportDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={handleCompareClick}
              disabled={loading || !rep1Id || !rep2Id}
              style={{ width: '100%' }}
            >
              <GitCompare size={16} /> {t('compareNow')}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: '14px', color: 'var(--status-red)', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Comparison Results Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {t('loading')}
        </div>
      ) : comparisonData ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="card-title">
              <GitCompare size={20} color="var(--primary)" />
              {t('compareMedicalReports')}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-blue">
                {comparisonData.previousReport.date} ➔ {comparisonData.currentReport.date}
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="verification-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>{t('clinicalBiomarker')}</th>
                  <th style={{ width: '18%' }}>
                    {t('baseline')} ({comparisonData.previousReport.date})
                  </th>
                  <th style={{ width: '18%' }}>
                    {t('currentReport')} ({comparisonData.currentReport.date})
                  </th>
                  <th style={{ width: '18%' }}>{t('deltaProgression')}</th>
                  <th style={{ width: '18%' }}>{t('trendStable')}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.comparison.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{row.metricName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t('standardReference')}: {row.referenceRange || 'Standard'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {row.previousValue} {row.unit}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--navy)' }}>
                      {row.currentValue} {row.unit}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {row.difference}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem' }}>
                        {getTrendIcon(row.trend)}
                        <span>{getLocalizedTrend(row.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Localized Disclaimer Note */}
          <div style={{
            background: 'var(--primary-subtle)',
            border: '1px solid #bae6fd',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginTop: '18px',
            fontSize: '0.82rem',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Info size={18} />
            <span>
              {comparisonData.summaryNote || t('comparisonNote')}
            </span>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <GitCompare size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <p>{t('selectDistinctReports')}</p>
        </div>
      )}
    </div>
  );
};
