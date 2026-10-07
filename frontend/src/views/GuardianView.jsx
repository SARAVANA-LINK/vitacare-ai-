import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, ShieldCheck, Check, X, Shield } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const GuardianView = () => {
  const { t } = useTranslation();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newGuardianForm, setNewGuardianForm] = useState({
    name: '',
    relationship: 'Family Member',
    phoneNumber: '',
    email: '',
    allowMedicationEscalation: true,
    allowEmergencyNotification: true,
    allowCareConnectAccess: true,
    allowHealthView: false
  });

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const res = await api.getGuardians();
      setGuardians(res.guardians || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const handleAddGuardian = async (e) => {
    e.preventDefault();
    try {
      await api.addGuardian(newGuardianForm);
      setIsAddModalOpen(false);
      setNewGuardianForm({
        name: '',
        relationship: 'Family Member',
        phoneNumber: '',
        email: '',
        allowMedicationEscalation: true,
        allowEmergencyNotification: true,
        allowCareConnectAccess: true,
        allowHealthView: false
      });
      fetchGuardians();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>{t('guardianManagementTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('guardianManagementSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> {t('addDesignatedGuardian')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          {t('loadingGuardians')}
        </div>
      ) : guardians.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4 }} />
          <h3>{t('noGuardiansConfigured')}</h3>
          <p style={{ margin: '8px 0 20px 0' }}>{t('noGuardiansHelp')}</p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            {t('addDesignatedGuardian')}
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {guardians.map(g => (
            <div key={g.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-dark)',
                    fontWeight: 700
                  }}>
                    {g.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)' }}>{g.name}</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{g.relationship}</span>
                  </div>
                </div>
                <span className="badge badge-green">{t('authorizedBadge')}</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontWeight: 600 }}>
                    <Phone size={14} color="var(--primary)" />
                    <span>🔒 {g.phoneNumber && g.phoneNumber.length > 4 ? g.phoneNumber.slice(0, 3) + '*** ***' + g.phoneNumber.slice(-2) : '***-***-****'}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('maskedForPrivacy')}</span>
                </div>
                {g.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--primary)" /> {g.email}
                  </div>
                )}
              </div>

              {/* Granular Permission Checklist */}
              <div style={{
                background: 'var(--bg-alt)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                fontSize: '0.8rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                  {t('grantedPermissions')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: g.allowMedicationEscalation ? '#166534' : '#94a3b8' }}>
                    <ShieldCheck size={14} /> {t('permMedicationEscalation')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: g.allowEmergencyNotification ? '#166534' : '#94a3b8' }}>
                    <ShieldCheck size={14} /> {t('permEmergencySos')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: g.allowCareConnectAccess ? '#166534' : '#94a3b8' }}>
                    <ShieldCheck size={14} /> {t('permCareConnect')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: g.allowHealthView ? '#166534' : '#94a3b8' }}>
                    <ShieldCheck size={14} /> {t('permHealthView')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Guardian Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="card-title">{t('addDesignatedGuardian')}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddGuardian}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={t('guardianNamePlaceholder')}
                    value={newGuardianForm.name}
                    onChange={(e) => setNewGuardianForm({ ...newGuardianForm, name: e.target.value })}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('relationship')}</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder={t('guardianRelPlaceholder')}
                      value={newGuardianForm.relationship}
                      onChange={(e) => setNewGuardianForm({ ...newGuardianForm, relationship: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('phoneNumber')}</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={newGuardianForm.phoneNumber}
                      onChange={(e) => setNewGuardianForm({ ...newGuardianForm, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('emailOptional')}</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={newGuardianForm.email}
                    onChange={(e) => setNewGuardianForm({ ...newGuardianForm, email: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label className="form-label">{t('permissionsGranted')}</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newGuardianForm.allowMedicationEscalation}
                      onChange={(e) => setNewGuardianForm({ ...newGuardianForm, allowMedicationEscalation: e.target.checked })}
                    />
                    <span>{t('permMedicationEscalationAlerts')}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newGuardianForm.allowEmergencyNotification}
                      onChange={(e) => setNewGuardianForm({ ...newGuardianForm, allowEmergencyNotification: e.target.checked })}
                    />
                    <span>{t('permEmergencyNotifications')}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newGuardianForm.allowCareConnectAccess}
                      onChange={(e) => setNewGuardianForm({ ...newGuardianForm, allowCareConnectAccess: e.target.checked })}
                    />
                    <span>{t('permCareConnectAccess')}</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('saveGuardianProfile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
