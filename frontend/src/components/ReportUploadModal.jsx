import React, { useState } from 'react';
import { Upload, Camera, FileText, Check, Plus, Trash2, AlertCircle, X, Sparkles } from 'lucide-react';
import { api } from '../api/apiClient';
import { CameraCaptureModal } from './CameraCaptureModal';
import { useTranslation } from '../i18n/LanguageContext';

export const ReportUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'verify'
  const [file, setFile] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [draft, setDraft] = useState({
    reportType: '',
    labName: '',
    doctorName: '',
    reportDate: '',
    originalFilename: '',
    filePath: '',
    rawOcrText: '',
    extractedValues: []
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleProcessUpload = async (payloadOverride = null) => {
    setErrorMsg('');
    setIsProcessing(true);
    setStep('processing');

    try {
      let res;
      if (payloadOverride) {
        res = await api.uploadReport(payloadOverride);
      } else if (file) {
        const formData = new FormData();
        formData.append('document', file);
        res = await api.uploadReport(formData);
      } else {
        throw new Error('Please select a health report document or capture a photo.');
      }

      setDraft({
        reportType: res.draft.reportType || 'Diagnostic Health Report',
        labName: res.draft.labName || 'Reference Pathology Laboratory',
        doctorName: res.draft.doctorName || 'Dr. Sarah Lin, MD',
        reportDate: res.draft.reportDate || new Date().toISOString().split('T')[0],
        originalFilename: res.draft.originalFilename || 'report.pdf',
        filePath: res.draft.filePath || '',
        rawOcrText: res.draft.rawOcrText || '',
        extractedValues: res.draft.extractedValues || []
      });

      setStep('verify');
    } catch (err) {
      console.error('Report processing error:', err);
      setErrorMsg(err.message || 'Unable to process health report.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = (base64) => {
    setIsCameraOpen(false);
    handleProcessUpload({ imageBase64: base64 });
  };

  const handleUseSample = async () => {
    try {
      const samples = await api.getDemoSamples();
      handleProcessUpload({ sampleText: samples.sampleLabReportText });
    } catch (err) {
      setErrorMsg('Failed to load sample lab report text.');
    }
  };

  // Verification Screen Helpers
  const handleValueChange = (index, field, value) => {
    setDraft(prev => {
      const updated = [...prev.extractedValues];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, extractedValues: updated };
    });
  };

  const handleRemoveValue = (index) => {
    setDraft(prev => ({
      ...prev,
      extractedValues: prev.extractedValues.filter((_, i) => i !== index)
    }));
  };

  const handleAddValue = () => {
    setDraft(prev => ({
      ...prev,
      extractedValues: [
        ...prev.extractedValues,
        {
          metricKey: 'custom_param',
          metricName: '',
          value: '',
          unit: 'mg/dL',
          referenceRange: 'Normal target',
          statusIndicator: 'normal',
          confidence: 'high'
        }
      ]
    }));
  };

  const handleConfirmVerification = async () => {
    setErrorMsg('');
    if (draft.extractedValues.length === 0) {
      setErrorMsg('Please keep or add at least one medical measurement before confirming.');
      return;
    }

    try {
      setIsProcessing(true);
      await api.verifyReport(draft);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setErrorMsg('Failed to save verified report: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: step === 'verify' ? '920px' : '620px' }}>
          <div className="modal-header">
            <h3 className="card-title">
              <Upload size={20} color="var(--primary)" />
              {step === 'verify' ? (t('verifyExtractedHealthData') || 'Verify Extracted Health Data') : (t('uploadReport') || 'Upload Health Report')}
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={handleClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {errorMsg && (
              <div style={{
                background: 'var(--status-red-bg)',
                border: '1px solid var(--status-red-border)',
                color: '#991b1b',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 'upload' && (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', fontSize: '0.9rem' }}>
                  {t('reportUploadHelp')}
                </p>

                <div style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-alt)',
                  marginBottom: '20px',
                  cursor: 'pointer'
                }}>
                  <FileText size={40} color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '4px' }}>
                    {file ? file.name : t('chooseLabReportFile')}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {t('supportedReportFormats')}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ marginTop: '16px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setIsCameraOpen(true)}>
                    <Camera size={16} /> {t('takePhotoCamera')}
                  </button>
                  <button className="btn btn-secondary" onClick={handleUseSample}>
                    <Sparkles size={16} color="var(--primary)" /> {t('useSampleReport')}
                  </button>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '4px solid var(--border-light)',
                  borderTopColor: 'var(--primary)',
                  margin: '0 auto 18px auto',
                  animation: 'spin 1s linear infinite'
                }} />
                <h4 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: '8px' }}>
                  {t('extractingLabMeasurements')}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {t('parsingDiagnosticMetrics')}
                </p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {step === 'verify' && (
              <div>
                <div style={{
                  background: 'var(--status-orange-bg)',
                  border: '1px solid var(--status-orange-border)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px',
                  fontSize: '0.85rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>
                    {t('reportVerificationWarning')}
                  </span>
                </div>

                <div className="grid-3" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('reportPanelTitle')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={draft.reportType}
                      onChange={(e) => setDraft({ ...draft, reportType: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('diagnosticLaboratory')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={draft.labName}
                      onChange={(e) => setDraft({ ...draft, labName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('reportDate')}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={draft.reportDate}
                      onChange={(e) => setDraft({ ...draft, reportDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--navy)' }}>{t('extractedBiomarkersCount', { count: draft.extractedValues.length })}</h4>
                  <button className="btn btn-secondary btn-sm" onClick={handleAddValue}>
                    <Plus size={14} /> {t('addParameter')}
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="verification-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>{t('investigationMetric')}</th>
                        <th style={{ width: '16%' }}>{t('resultValue')}</th>
                        <th style={{ width: '14%' }}>{t('unit')}</th>
                        <th style={{ width: '22%' }}>{t('referenceRange')}</th>
                        <th style={{ width: '12%' }}>{t('indicator')}</th>
                        <th style={{ width: '8%' }}>{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.extractedValues.map((val, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              value={val.metricName}
                              onChange={(e) => handleValueChange(idx, 'metricName', e.target.value)}
                              placeholder="e.g. Hemoglobin"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={val.value}
                              onChange={(e) => handleValueChange(idx, 'value', e.target.value)}
                              placeholder="e.g. 13.2"
                              style={{ fontWeight: 700 }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={val.unit}
                              onChange={(e) => handleValueChange(idx, 'unit', e.target.value)}
                              placeholder="g/dL"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={val.referenceRange}
                              onChange={(e) => handleValueChange(idx, 'referenceRange', e.target.value)}
                              placeholder="13.0 - 17.5 g/dL"
                            />
                          </td>
                          <td>
                            <select
                              className="form-select"
                              style={{ padding: '6px', fontSize: '0.8rem' }}
                              value={val.statusIndicator || 'normal'}
                              onChange={(e) => handleValueChange(idx, 'statusIndicator', e.target.value)}
                            >
                              <option value="normal">{t('normal')}</option>
                              <option value="elevated">{t('elevated')}</option>
                              <option value="low">{t('low')}</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{ color: 'var(--status-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              onClick={() => handleRemoveValue(idx)}
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {step === 'upload' && (
              <>
                <button className="btn btn-secondary" onClick={handleClose}>{t('cancel')}</button>
                <button className="btn btn-primary" onClick={() => handleProcessUpload()} disabled={!file || isProcessing}>
                  {t('processReport')}
                </button>
              </>
            )}

            {step === 'verify' && (
              <>
                <button className="btn btn-secondary" onClick={() => setStep('upload')} disabled={isProcessing}>
                  {t('backToUpload') || t('back')}
                </button>
                <button className="btn btn-success" onClick={handleConfirmVerification} disabled={isProcessing}>
                  <Check size={16} /> {t('confirmSaveHealthData')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title={t('captureReportDoc')}
      />
    </>
  );
};
