const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const smsService = require('../services/smsService');

// GET /api/guardians (List user's configured guardians)
router.get('/', authenticateToken, (req, res) => {
  const guardians = db.find('guardians', g => g.userId === req.user.id);
  res.json({ guardians });
});

// POST /api/guardians (Add new guardian)
router.post('/', authenticateToken, async (req, res) => {
  const {
    name,
    relationship,
    phoneNumber,
    email,
    allowMedicationEscalation = true,
    allowEmergencyNotification = true,
    allowCareConnectAccess = true,
    allowHealthView = false,
    notificationPreference = 'SMS',
    smsEnabled = true,
    notifyOnVerified = true,
    notifyOnMissed = true,
    notifyOnFailed = true,
    consentGiven = true
  } = req.body;

  if (!name || !phoneNumber) {
    return res.status(400).json({ error: 'Guardian name and phone number are required.' });
  }

  const guardian = db.insert('guardians', {
    userId: req.user.id,
    name: name.trim(),
    relationship: relationship || 'Family Member',
    phoneNumber: phoneNumber.trim(),
    email: email || '',
    allowMedicationEscalation,
    allowEmergencyNotification,
    allowCareConnectAccess,
    allowHealthView,
    notificationPreference,
    smsEnabled,
    notifyOnVerified,
    notifyOnMissed,
    notifyOnFailed,
    consentGiven
  });

  // Send greeting SMS via service
  try {
    await smsService.sendGuardianSms({
      userId: req.user.id,
      eventType: 'login_alert',
      customMessage: `VitaCare Notice: ${req.user.name || 'Patient'} has added you as their healthcare guardian with SMS notifications enabled.`
    });
  } catch (err) {
    console.warn('SMS dispatch on guardian add warning:', err.message);
  }

  res.status(201).json({ success: true, guardian });
});

// PUT /api/guardians/:id
router.put('/:id', authenticateToken, (req, res) => {
  const updated = db.update('guardians', g => g.id === req.params.id && g.userId === req.user.id, {
    ...req.body
  });
  if (updated.length === 0) return res.status(404).json({ error: 'Guardian not found.' });
  res.json({ guardian: updated[0] });
});

// POST /api/guardians/escalate (Missed medicine escalation alert + SMS dispatch)
router.post('/escalate', authenticateToken, async (req, res) => {
  const { medicineName, scheduledTime, guardianId } = req.body;
  const guardians = db.find('guardians', g => g.userId === req.user.id && g.allowMedicationEscalation);

  const targetGuardian = guardianId
    ? guardians.find(g => g.id === guardianId)
    : guardians[0];

  const guardianName = targetGuardian ? targetGuardian.name : 'Primary Guardian';
  const guardianPhone = targetGuardian ? targetGuardian.phoneNumber : '';

  // Trigger SMS via smsService
  const smsResult = await smsService.sendGuardianSms({
    userId: req.user.id,
    eventType: 'missed_medication',
    data: {
      medicineName: medicineName || 'Scheduled Regimen Dose',
      dosage: '1 dose',
      time: scheduledTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  });

  // Record notification in user log
  db.insert('notifications', {
    userId: req.user.id,
    title: `Guardian SMS Escalation Dispatched`,
    message: `SMS alert dispatched to ${guardianName} (${smsResult.maskedPhone || 'Guardian'}) for missed dose of ${medicineName || 'Medication'}.`,
    type: 'guardian_alert',
    isDemo: false,
    isRead: false
  });

  res.json({
    success: true,
    smsDispatched: smsResult.sent,
    maskedPhone: smsResult.maskedPhone || 'On File',
    guardianContacted: guardianName,
    medicine: medicineName || 'Prescribed Dose',
    scheduledTime: scheduledTime || 'Today',
    escalationMessage: smsResult.message || `Automated missed medication escalation SMS sent to ${guardianName}.`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
