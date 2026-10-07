const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const scheduleGenerator = require('../services/scheduleGenerator');

// Protect ALL routes in this file with Admin Authorization
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/overview (System Metrics for Admin Dashboard)
router.get('/overview', (req, res) => {
  const users = db.find('users');
  const patientUsers = users.filter(u => u.role !== 'admin');
  const medicines = db.find('medicines', m => m.isActive);
  const schedules = db.find('medicine_schedules');
  const reports = db.find('health_reports');
  const prescriptions = db.find('prescriptions');
  const careConnect = db.find('careconnect_sessions');
  const alerts = db.find('medicine_alerts_history');
  const guardians = db.find('guardians');

  // Count Verified, Pending, Missed
  const verifiedCount = schedules.filter(s => s.status === 'Verified' || s.status === 'taken').length;
  const pendingCount = schedules.filter(s => s.status === 'Pending' || s.status === 'upcoming' || s.status === 'due_now').length;
  const missedCount = schedules.filter(s => s.status === 'Missed' || s.status === 'missed').length;

  res.json({
    metrics: {
      totalRegisteredUsers: patientUsers.length,
      activeUsers: patientUsers.length,
      totalMedicines: medicines.length,
      totalSchedules: schedules.length,
      verifiedMedicines: verifiedCount,
      pendingMedicines: pendingCount,
      missedMedicines: missedCount,
      guardianAlertsCount: alerts.length,
      careConnectSessionsCount: careConnect.length,
      uploadedReportsCount: reports.length,
      prescriptionsCount: prescriptions.length,
      guardiansCount: guardians.length
    }
  });
});

// GET /api/admin/users (List all patients)
router.get('/users', (req, res) => {
  const users = db.find('users').filter(u => u.role !== 'admin');
  const sanitized = users.map(u => {
    const profile = db.findOne('user_profiles', p => p.userId === u.id);
    const userMeds = db.find('medicines', m => m.userId === u.id && m.isActive);
    const userSchedules = db.find('medicine_schedules', s => s.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'patient',
      age: u.age,
      gender: u.gender,
      bloodGroup: u.bloodGroup,
      emergencyPhone: u.emergencyPhone,
      preferredLanguage: u.preferredLanguage || 'en',
      createdAt: u.createdAt,
      medicinesCount: userMeds.length,
      schedulesCount: userSchedules.length,
      profile: profile || {}
    };
  });
  res.json({ users: sanitized });
});

// PUT /api/admin/users/:id (Edit Patient)
router.put('/users/:id', (req, res) => {
  const { name, email, age, gender, bloodGroup, emergencyPhone, preferredLanguage } = req.body;
  const updated = db.update('users', u => u.id === req.params.id, {
    name, email, age: age ? parseInt(age, 10) : undefined, gender, bloodGroup, emergencyPhone, preferredLanguage
  });
  if (updated.length === 0) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: updated[0] });
});

// DELETE /api/admin/users/:id (Delete User and Associated Data)
router.delete('/users/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete the active administrator account.' });
  }
  const userId = req.params.id;
  // Cascade clean
  db.delete('users', u => u.id === userId);
  db.delete('user_profiles', p => p.userId === userId);
  db.delete('medicines', m => m.userId === userId);
  db.delete('medicine_schedules', s => s.userId === userId);
  db.delete('health_reports', r => r.userId === userId);
  db.delete('extracted_health_values', v => v.userId === userId);
  db.delete('vitals', v => v.userId === userId);
  db.delete('prescriptions', p => p.userId === userId);
  db.delete('guardians', g => g.userId === userId);
  db.delete('medicine_alerts_history', a => a.userId === userId);
  db.delete('medical_timeline', t => t.userId === userId);
  res.json({ success: true, message: 'User and all associated medical data permanently removed.' });
});

// GET /api/admin/medicines (List all medicines)
router.get('/medicines', (req, res) => {
  const medicines = db.find('medicines');
  const enriched = medicines.map(m => {
    const user = db.findById('users', m.userId);
    return {
      ...m,
      patientName: user ? user.name : 'Unknown Patient',
      patientEmail: user ? user.email : ''
    };
  });
  res.json({ medicines: enriched });
});

// POST /api/admin/medicines (Admin creates medicine for a patient)
router.post('/medicines', (req, res) => {
  const { userId, name, dosage, frequency, intakeTimes, duration, instructions, startDate } = req.body;
  if (!userId || !name || !dosage) {
    return res.status(400).json({ error: 'Patient ID, medicine name, and dosage are required.' });
  }

  const newMed = db.insert('medicines', {
    userId,
    prescriptionId: null,
    name: name.trim(),
    dosage: dosage.trim(),
    frequency: frequency || 'Once daily',
    intakeTimes: Array.isArray(intakeTimes) && intakeTimes.length > 0 ? intakeTimes : ['08:00 AM'],
    duration: duration || '30 days',
    instructions: instructions || 'Take after food',
    startDate: startDate || new Date().toISOString().split('T')[0],
    isActive: true
  });

  const schedules = scheduleGenerator.generateScheduleForMedicine(newMed);
  res.status(201).json({ success: true, medicine: newMed, schedulesCount: schedules.length });
});

// PUT /api/admin/medicines/:id
router.put('/medicines/:id', (req, res) => {
  const updated = db.update('medicines', m => m.id === req.params.id, {
    ...req.body
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Medicine not found.' });
  res.json({ medicine: updated[0] });
});

// DELETE /api/admin/medicines/:id
router.delete('/medicines/:id', (req, res) => {
  const medId = req.params.id;
  db.delete('medicines', m => m.id === medId);
  db.delete('medicine_schedules', s => s.medicineId === medId);
  res.json({ success: true, message: 'Medicine and associated schedules deleted.' });
});

// GET /api/admin/schedules
router.get('/schedules', (req, res) => {
  const { status, date } = req.query;
  let schedules = db.find('medicine_schedules');

  if (status) {
    schedules = schedules.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }
  if (date) {
    schedules = schedules.filter(s => s.scheduledDate === date);
  }

  const enriched = schedules.map(s => {
    const user = db.findById('users', s.userId);
    return {
      ...s,
      patientName: user ? user.name : 'Unknown Patient'
    };
  });

  res.json({ schedules: enriched });
});

// PUT /api/admin/schedules/:id
router.put('/schedules/:id', (req, res) => {
  const { scheduledTime, scheduledDate, status, notes } = req.body;
  const updated = db.update('medicine_schedules', s => s.id === req.params.id, {
    scheduledTime: scheduledTime !== undefined ? scheduledTime : undefined,
    scheduledDate: scheduledDate !== undefined ? scheduledDate : undefined,
    status: status !== undefined ? status : undefined,
    notes: notes !== undefined ? notes : undefined
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Schedule not found.' });
  res.json({ schedule: updated[0] });
});

// GET /api/admin/alerts (Alert and Escalation History)
router.get('/alerts', (req, res) => {
  const alerts = db.find('medicine_alerts_history');
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const enriched = alerts.map(a => {
    const user = db.findById('users', a.userId);
    return {
      ...a,
      patientName: user ? user.name : a.patientName || 'Patient'
    };
  });

  res.json({ alerts: enriched });
});

// GET /api/admin/guardians
router.get('/guardians', (req, res) => {
  const guardians = db.find('guardians');
  const enriched = guardians.map(g => {
    const user = db.findById('users', g.userId);
    return {
      ...g,
      patientName: user ? user.name : 'Unknown Patient'
    };
  });
  res.json({ guardians: enriched });
});

// PUT /api/admin/guardians/:id
router.put('/guardians/:id', (req, res) => {
  const updated = db.update('guardians', g => g.id === req.params.id, {
    ...req.body
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Guardian not found.' });
  res.json({ guardian: updated[0] });
});

// GET /api/admin/reports
router.get('/reports', (req, res) => {
  const reports = db.find('health_reports');
  const prescriptions = db.find('prescriptions');

  const enrichedReports = reports.map(r => {
    const user = db.findById('users', r.userId);
    return {
      ...r,
      docType: 'Health Report',
      patientName: user ? user.name : 'Unknown Patient'
    };
  });

  const enrichedPrescriptions = prescriptions.map(p => {
    const user = db.findById('users', p.userId);
    return {
      ...p,
      reportType: `Prescription (${p.doctorName})`,
      labName: p.clinicName,
      reportDate: p.prescriptionDate,
      docType: 'Prescription',
      patientName: user ? user.name : 'Unknown Patient'
    };
  });

  res.json({ documents: [...enrichedReports, ...enrichedPrescriptions] });
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', (req, res) => {
  const repId = req.params.id;
  db.delete('health_reports', r => r.id === repId);
  db.delete('prescriptions', p => p.id === repId);
  db.delete('extracted_health_values', v => v.reportId === repId);
  res.json({ success: true, message: 'Document removed.' });
});

// GET /api/admin/settings (Website & System Configuration)
router.get('/settings', (req, res) => {
  let settings = db.findOne('system_settings', s => s.id === 'system-config-1');
  if (!settings) {
    settings = {
      id: 'system-config-1',
      websiteName: 'VitaCare AI',
      logoUrl: '',
      supportPhone: '+1 (800) 555-VITA',
      supportEmail: 'support@vitacare.ai',
      warningCallAttempts: 2,
      warningTimeoutMinutes: 15,
      escalateToGuardian: true,
      defaultLanguage: 'en',
      careConnectEnabled: true,
      allowPatientRegistration: true
    };
  }
  res.json({ settings });
});

// PUT /api/admin/settings (Update Website Configuration)
router.put('/settings', (req, res) => {
  const current = db.findOne('system_settings', s => s.id === 'system-config-1') || {};
  const {
    websiteName,
    logoUrl,
    supportPhone,
    supportEmail,
    warningCallAttempts,
    warningTimeoutMinutes,
    escalateToGuardian,
    defaultLanguage,
    careConnectEnabled,
    allowPatientRegistration
  } = req.body;

  const updated = db.update('system_settings', s => s.id === 'system-config-1', {
    websiteName: websiteName !== undefined ? websiteName : (current.websiteName || 'VitaCare AI'),
    logoUrl: logoUrl !== undefined ? logoUrl : (current.logoUrl || ''),
    supportPhone: supportPhone !== undefined ? supportPhone : (current.supportPhone || '+1 (800) 555-VITA'),
    supportEmail: supportEmail !== undefined ? supportEmail : (current.supportEmail || 'support@vitacare.ai'),
    warningCallAttempts: warningCallAttempts !== undefined ? parseInt(warningCallAttempts, 10) : (current.warningCallAttempts || 2),
    warningTimeoutMinutes: warningTimeoutMinutes !== undefined ? parseInt(warningTimeoutMinutes, 10) : (current.warningTimeoutMinutes || 15),
    escalateToGuardian: escalateToGuardian !== undefined ? Boolean(escalateToGuardian) : (current.escalateToGuardian ?? true),
    defaultLanguage: defaultLanguage !== undefined ? defaultLanguage : (current.defaultLanguage || 'en'),
    careConnectEnabled: careConnectEnabled !== undefined ? Boolean(careConnectEnabled) : (current.careConnectEnabled ?? true),
    allowPatientRegistration: allowPatientRegistration !== undefined ? Boolean(allowPatientRegistration) : (current.allowPatientRegistration ?? true),
    updatedAt: new Date().toISOString()
  });

  res.json({ success: true, settings: updated[0] || {} });
});

// Multer storage for brand logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `brand-logo-${Date.now()}${ext}`);
  }
});
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/admin/settings/logo (Upload brand logo / photo)
router.post('/settings/logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file was provided.' });
  }
  const logoUrl = `/uploads/${req.file.filename}`;
  const updated = db.update('system_settings', s => s.id === 'system-config-1', {
    logoUrl,
    updatedAt: new Date().toISOString()
  });
  res.json({
    success: true,
    logoUrl,
    settings: updated[0] || {}
  });
});

// ==========================================
// CMS MODULES & CONTENT MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/cms/modules
router.get('/cms/modules', (req, res) => {
  const modules = db.find('cms_modules');
  modules.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json({ modules });
});

// POST /api/admin/cms/modules
router.post('/cms/modules', (req, res) => {
  const { key, title, description, isEnabled, orderIndex } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newMod = db.insert('cms_modules', {
    key: key || `mod_${Date.now()}`,
    title,
    description: description || '',
    isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
    orderIndex: orderIndex ? parseInt(orderIndex, 10) : 99,
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, module: newMod });
});

// PUT /api/admin/cms/modules/:id
router.put('/cms/modules/:id', (req, res) => {
  const { title, description, isEnabled, orderIndex } = req.body;
  const updated = db.update('cms_modules', m => m.id === req.params.id, {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
    ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex, 10) }),
    updatedAt: new Date().toISOString()
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Module not found' });
  res.json({ success: true, module: updated[0] });
});

// DELETE /api/admin/cms/modules/:id
router.delete('/cms/modules/:id', (req, res) => {
  db.delete('cms_modules', m => m.id === req.params.id);
  res.json({ success: true });
});

// GET /api/admin/cms/cards
router.get('/cms/cards', (req, res) => {
  const cards = db.find('cms_cards');
  cards.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json({ cards });
});

// POST /api/admin/cms/cards
router.post('/cms/cards', (req, res) => {
  const { title, subtitle, value, delta, badgeColor, isVisible, orderIndex } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newCard = db.insert('cms_cards', {
    key: `card_${Date.now()}`,
    title,
    subtitle: subtitle || '',
    value: value || '0',
    delta: delta || '',
    badgeColor: badgeColor || 'blue',
    isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
    orderIndex: orderIndex ? parseInt(orderIndex, 10) : 99,
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, card: newCard });
});

// PUT /api/admin/cms/cards/:id
router.put('/cms/cards/:id', (req, res) => {
  const { title, subtitle, value, delta, badgeColor, isVisible, orderIndex } = req.body;
  const updated = db.update('cms_cards', c => c.id === req.params.id, {
    ...(title !== undefined && { title }),
    ...(subtitle !== undefined && { subtitle }),
    ...(value !== undefined && { value }),
    ...(delta !== undefined && { delta }),
    ...(badgeColor !== undefined && { badgeColor }),
    ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
    ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex, 10) }),
    updatedAt: new Date().toISOString()
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Card not found' });
  res.json({ success: true, card: updated[0] });
});

// DELETE /api/admin/cms/cards/:id
router.delete('/cms/cards/:id', (req, res) => {
  db.delete('cms_cards', c => c.id === req.params.id);
  res.json({ success: true });
});

// GET /api/admin/cms/announcements
router.get('/cms/announcements', (req, res) => {
  const announcements = db.find('cms_announcements');
  res.json({ announcements });
});

// POST /api/admin/cms/announcements
router.post('/cms/announcements', (req, res) => {
  const { title, message, alertType, isPublished, priority } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
  const newAnn = db.insert('cms_announcements', {
    title,
    message,
    alertType: alertType || 'info',
    isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    priority: priority ? parseInt(priority, 10) : 1,
    createdAt: new Date().toISOString()
  });
  res.json({ success: true, announcement: newAnn });
});

// PUT /api/admin/cms/announcements/:id
router.put('/cms/announcements/:id', (req, res) => {
  const { title, message, alertType, isPublished, priority } = req.body;
  const updated = db.update('cms_announcements', a => a.id === req.params.id, {
    ...(title !== undefined && { title }),
    ...(message !== undefined && { message }),
    ...(alertType !== undefined && { alertType }),
    ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
    ...(priority !== undefined && { priority: parseInt(priority, 10) }),
    updatedAt: new Date().toISOString()
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ success: true, announcement: updated[0] });
});

// DELETE /api/admin/cms/announcements/:id
router.delete('/cms/announcements/:id', (req, res) => {
  db.delete('cms_announcements', a => a.id === req.params.id);
  res.json({ success: true });
});

// GET /api/admin/cms/content
router.get('/cms/content', (req, res) => {
  const content = db.find('cms_content');
  res.json({ content });
});

// POST /api/admin/cms/content
router.post('/cms/content', (req, res) => {
  const { key, title, value, category } = req.body;
  if (!key || !title) return res.status(400).json({ error: 'Key and title are required' });
  const newContent = db.insert('cms_content', {
    key,
    title,
    value: value || '',
    category: category || 'General',
    updatedAt: new Date().toISOString()
  });
  res.json({ success: true, content: newContent });
});

// PUT /api/admin/cms/content/:id
router.put('/cms/content/:id', (req, res) => {
  const { value, title, category } = req.body;
  const updated = db.update('cms_content', c => c.id === req.params.id, {
    ...(value !== undefined && { value }),
    ...(title !== undefined && { title }),
    ...(category !== undefined && { category }),
    updatedAt: new Date().toISOString()
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Content entry not found' });
  res.json({ success: true, content: updated[0] });
});

// DELETE /api/admin/cms/content/:id
router.delete('/cms/content/:id', (req, res) => {
  db.delete('cms_content', c => c.id === req.params.id);
  res.json({ success: true });
});

// ==========================================
// TRANSLATIONS MANAGEMENT (Requirement 1 & 5)
// ==========================================

// GET /api/admin/translations
router.get('/translations', (req, res) => {
  if (!db.data.translations || db.data.translations.length === 0) {
    db.seedInitialTranslations();
  }
  res.json({ translations: db.find('translations') });
});

// POST /api/admin/translations
router.post('/translations', (req, res) => {
  const { key, en, ta, te, ml, kn, hi, bn, mr, category } = req.body;
  if (!key) return res.status(400).json({ error: 'Translation key is required.' });

  const existing = db.findOne('translations', t => t.key === key);
  if (existing) {
    return res.status(409).json({ error: 'Translation key already exists.' });
  }

  const newEntry = db.insert('translations', {
    key: key.trim(),
    en: en || key,
    ta: ta || '',
    te: te || '',
    ml: ml || '',
    kn: kn || '',
    hi: hi || '',
    bn: bn || '',
    mr: mr || '',
    category: category || 'General',
    updatedAt: new Date().toISOString()
  });

  res.status(201).json({ success: true, translation: newEntry });
});

// PUT /api/admin/translations/:key
router.put('/translations/:key', (req, res) => {
  const { en, ta, te, ml, kn, hi, bn, mr, category } = req.body;
  const targetKey = req.params.key;

  const updated = db.update('translations', t => t.key === targetKey, {
    ...(en !== undefined && { en }),
    ...(ta !== undefined && { ta }),
    ...(te !== undefined && { te }),
    ...(ml !== undefined && { ml }),
    ...(kn !== undefined && { kn }),
    ...(hi !== undefined && { hi }),
    ...(bn !== undefined && { bn }),
    ...(mr !== undefined && { mr }),
    ...(category !== undefined && { category }),
    updatedAt: new Date().toISOString()
  });

  if (updated.length === 0) {
    // If not found, insert
    const inserted = db.insert('translations', {
      key: targetKey,
      en: en || targetKey,
      ta: ta || '',
      te: te || '',
      ml: ml || '',
      kn: kn || '',
      hi: hi || '',
      bn: bn || '',
      mr: mr || '',
      category: category || 'General',
      updatedAt: new Date().toISOString()
    });
    return res.json({ success: true, translation: inserted });
  }

  res.json({ success: true, translation: updated[0] });
});

// DELETE /api/admin/translations/:key
router.delete('/translations/:key', (req, res) => {
  db.delete('translations', t => t.key === req.params.key);
  res.json({ success: true });
});

// ==========================================
// GUARDIAN & SMS MANAGEMENT (Requirement 2 & 5)
// ==========================================

const smsService = require('../services/smsService');

// GET /api/admin/sms/triggers
router.get('/sms/triggers', (req, res) => {
  res.json({ triggers: smsService.getTriggers() });
});

// PUT /api/admin/sms/triggers
router.put('/sms/triggers', (req, res) => {
  const { triggers } = req.body;
  const updated = smsService.updateTriggers(triggers);
  res.json({ success: true, triggers: updated });
});

// GET /api/admin/sms/templates
router.get('/sms/templates', (req, res) => {
  res.json({ templates: smsService.getTemplates() });
});

// PUT /api/admin/sms/templates/:id
router.put('/sms/templates/:id', (req, res) => {
  const { templateText, description, language } = req.body;
  const updated = smsService.updateTemplate(req.params.id, {
    templateText,
    description,
    language
  });
  if (!updated) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true, template: updated });
});

// GET /api/admin/sms/logs
router.get('/sms/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  res.json({ logs: smsService.getLogs(limit) });
});

// POST /api/admin/sms/test
router.post('/sms/test', async (req, res) => {
  const { phoneNumber, message, language } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });
  const result = await smsService.sendTestSms({ phoneNumber, message, language });
  res.json(result);
});

// GET /api/admin/guardians (List all registered guardians with masked numbers)
router.get('/guardians', (req, res) => {
  const allGuardians = db.find('guardians');
  const sanitized = allGuardians.map(g => {
    const user = db.findById('users', g.userId);
    const phone = g.phoneNumber || '';
    const masked = phone.length > 4 ? phone.slice(0, 3) + '*** ***' + phone.slice(-2) : '***';
    return {
      ...g,
      patientName: user ? user.name : 'Unknown Patient',
      patientEmail: user ? user.email : '',
      maskedPhone: masked,
      phoneNumber: undefined // Protect raw phone
    };
  });
  res.json({ guardians: sanitized });
});

// ==========================================
// DATABASE RESET / CLEAR USER DATA (Step 0)
// ==========================================

// POST /api/admin/database/reset-dev (Step 0 Development Data Reset)
router.post('/database/reset-dev', (req, res) => {
  try {
    const report = db.resetDevelopmentDatabase();
    res.json(report);
  } catch (err) {
    console.error('Error during database reset:', err);
    res.status(403).json({ error: err.message });
  }
});

// POST /api/admin/database/reset-empty (Completely Cleans All Stored Records to Empty State)
router.post('/database/reset-empty', (req, res) => {
  try {
    const report = db.resetToCleanEmptyState();
    res.json(report);
  } catch (err) {
    console.error('Error during database clean-empty reset:', err);
    res.status(403).json({ error: err.message });
  }
});

// POST /api/admin/database/clear-user-data (Clear user data to empty state)
router.post('/database/clear-user-data', (req, res) => {
  try {
    const report = db.resetToCleanEmptyState();
    res.json(report);
  } catch (err) {
    console.error('Error during database reset:', err);
    res.status(403).json({ error: err.message });
  }
});

module.exports = router;

