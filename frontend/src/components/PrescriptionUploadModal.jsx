import React, { useState } from 'react';
import { Upload, Camera, FileText, Check, Plus, Trash2, AlertCircle, X, Sparkles } from 'lucide-react';
import { api } from '../api/apiClient';
import { CameraCaptureModal } from './CameraCaptureModal';
import { useTranslation } from '../i18n/LanguageContext';

export const PrescriptionUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'verify'
  const [file, setFile] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Draft prescription verification state
  const [draft, setDraft] = useState({
    doctorName: '',
    clinicName: '',
    prescriptionDate: '',
    originalFilename: '',
    filePath: '',
    rawOcrText: '',
    medicines: []
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
        res = await api.uploadPrescription(payloadOverride);
      } else if (file) {
        const formData = new FormData();
        formData.append('document', file);
        res = await api.uploadPrescription(formData);
      } else {
        throw new Error(t('choosePrescriptionFile'));
      }

      setDraft({
        doctorName: res.draft.doctorName || 'Dr. Sarah Lin, MD',
        clinicName: res.draft.clinicName || 'Specialty Care Clinic',
        prescriptionDate: res.draft.prescriptionDate || new Date().toISOString().split('T')[0],
        originalFilename: res.draft.originalFilename || 'prescription.png',
        filePath: res.draft.filePath || '',
        rawOcrText: res.draft.rawOcrText || '',
        medicines: res.draft.medicines || []
      });

      setStep('verify');
    } catch (err) {
      console.error('Prescription processing error:', err);
      setErrorMsg(err.message || 'Unable to process prescription document.');
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
      handleProcessUpload({ sampleText: samples.samplePrescriptionText });
    } catch (err) {
      setErrorMsg('Failed to load sample text.');
    }
  };

  // Verification Screen Helpers
  const handleMedChange = (index, field, value) => {
    setDraft(prev => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleRemoveMed = (index) => {
    setDraft(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleAddMed = () => {
    setDraft(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicineName: '',
          dosage: '500 mg',
          frequency: 'Once daily',
          intakeTimes: ['08:00 AM'],
          duration: '7 days',
          instructions: 'After food',
          status: 'MANUALLY ADDED',
          confidence: 'high'
        }
      ]
    }));
  };

  const handleConfirmVerification = async () => {
    setErrorMsg('');
    if (draft.medicines.length === 0) {
      setErrorMsg('Please keep or add at least one medication before confirming.');
      return;
    }

    try {
      setIsProcessing(true);
      await api.verifyPrescription(draft);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setErrorMsg('Failed to save verified prescription: ' + err.message);
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
        <div className="modal-content" style={{ maxWidth: step === 'verify' ? '880px' : '620px' }}>
          <div className="modal-header">
            <h3 className="card-title">
              <Upload size={20} color="var(--primary)" />
              {step === 'verify' ? t('verifyExtractedPrescription') : t('uploadPrescription')}
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
                  {t('prescriptionUploadHelp')}
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
                    {file ? file.name : t('choosePrescriptionFile')}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {t('supportedPrescriptionFormats')}
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
                    <Camera size={16} /> {t('captureViaCamera')}
                  </button>
                  <button className="btn btn-secondary" onClick={handleUseSample}>
                    <Sparkles size={16} color="var(--primary)" /> {t('useSamplePrescription')}
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
                  {t('analyzingPrescription')}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {t('runningOcrExtraction')}
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
                    <strong>{t('verificationRequired')}:</strong> {t('prescriptionVerificationWarning')}
                  </span>
                </div>

                <div className="grid-3" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('doctorName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={draft.doctorName}
                      onChange={(e) => setDraft({ ...draft, doctorName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('clinicHospital')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={draft.clinicName}
                      onChange={(e) => setDraft({ ...draft, clinicName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('prescriptionDate')}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={draft.prescriptionDate}
                      onChange={(e) => setDraft({ ...draft, prescriptionDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--navy)' }}>{t('extractedMedicationsCount', { count: draft.medicines.length })}</h4>
                  <button className="btn btn-secondary btn-sm" onClick={handleAddMed}>
                    <Plus size={14} /> {t('addMedicine')}
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="verification-table">
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>{t('medName')}</th>
                        <th style={{ width: '14%' }}>{t('dosage')}</th>
                        <th style={{ width: '18%' }}>{t('frequency')}</th>
                        <th style={{ width: '14%' }}>{t('duration')}</th>
                        <th style={{ width: '20%' }}>{t('instructions')}</th>
                        <th style={{ width: '12%' }}>{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.medicines.map((med, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              value={med.medicineName}
                              onChange={(e) => handleMedChange(idx, 'medicineName', e.target.value)}
                              placeholder="e.g. Metformin"
                            />
                            <div style={{ marginTop: '4px' }}>
                              <span className={`badge ${med.status === 'AI EXTRACTED' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: '0.65rem' }}>
                                {med.status || 'AI EXTRACTED'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                              placeholder="e.g. 500 mg"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                              placeholder="e.g. Twice daily"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                              placeholder="e.g. 30 days"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                              placeholder="e.g. After food"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{ color: 'var(--status-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              onClick={() => handleRemoveMed(idx)}
                              title="Remove item"
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
                  {t('processPrescription')}
                </button>
              </>
            )}

            {step === 'verify' && (
              <>
                <button className="btn btn-secondary" onClick={() => setStep('upload')} disabled={isProcessing}>
                  {t('backToUpload')}
                </button>
                <button className="btn btn-success" onClick={handleConfirmVerification} disabled={isProcessing}>
                  <Check size={16} /> {t('confirmVerifiedPrescription')}
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
        title={t('captureViaCamera')}
      />
    </>
  );
};
