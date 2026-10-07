import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, GitCompare, Eye, Trash2, Calendar, Building, X, CheckCircle } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';
import { ReportViewerModal } from '../components/ReportViewerModal';

export const ReportsView = ({ onAddReport, onCompareReports }) => {
  const { t, language } = useTranslation();
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports({ search: searchTerm, type: typeFilter });
      setReports(res.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchTerm, typeFilter, language]);

  const handleOpenDetails = async (rep) => {
    setSelectedReport(rep);
    try {
      setDetailsLoading(true);
      const res = await api.getReportDetails(rep.id);
      setReportDetails(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(t('delete') + '?')) {
      try {
        await api.deleteReport(id);
        fetchReports();
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>{t('healthReports')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('reportsSubtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onCompareReports}>
            <GitCompare size={16} /> {t('compare')}
          </button>
          <button className="btn btn-primary" onClick={onAddReport}>
            <Plus size={16} /> {t('addHealthReport')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">{t('allTypes')}</option>
              <option value="metabolic">Metabolic Panel</option>
              <option value="lipid">Lipid Profile</option>
              <option value="blood">Blood Count (CBC)</option>
              <option value="checkup">Comprehensive Checkup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {t('loading')}
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3>{t('emptyStateNoReports')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 20px 0' }}>
            {t('reportsSubtitle')}
          </p>
          <button className="btn btn-primary" onClick={onAddReport}>
            <Plus size={16} /> {t('addHealthReport')}
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              onClick={() => handleOpenDetails(rep)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-blue">VERSION {rep.version || 1}</span>
                  <span className="badge badge-green">
                    <CheckCircle size={10} /> {t('verified')}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '6px' }}>
                  {rep.reportType}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} /> {rep.labName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {rep.reportDate}
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {rep.metricsCount || 0} {t('vitalsTracked')}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title={t('view')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(rep);
                    }}
                  >
                    <Eye size={14} /> {t('view')}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--status-red)', background: 'transparent', border: 'none' }}
                    onClick={(e) => handleDelete(rep.id, e)}
                    title={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Health Report & Multi-Page Document Viewer Modal */}
      {selectedReport && (
        <ReportViewerModal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          reportId={selectedReport.id}
          reportSummary={selectedReport}
        />
      )}
    </div>
  );
};
