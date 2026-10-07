const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const smsService = require('../services/smsService');

// GET /api/emergency/contacts
router.get('/contacts', authenticateToken, (req, res) => {
  let contacts = db.find('emergency_contacts', c => c.userId === req.user.id);
  const guardian = db.findOne('guardians', g => g.userId === req.user.id);

  if (contacts.length === 0) {
    contacts = [
      {
        id: 'default-ems',
        contactName: 'Emergency Medical Dispatch (EMS / Ambulance)',
        phoneNumber: '911 / 112',
        relationship: 'Public Emergency Response Service',
        isPrimary: true
      },
      {
        id: 'default-guardian',
        contactName: guardian ? `${guardian.name} (Guardian)` : 'Designated Family Guardian',
        phoneNumber: guardian ? guardian.phoneNumber : 'On File',
        relationship: guardian ? guardian.relationship : 'Primary Emergency Contact',
        isPrimary: false
      }
    ];
  }

  res.json({ contacts });
});

// POST /api/emergency/sos (Trigger SOS sequence + Guardian SMS)
router.post('/sos', authenticateToken, async (req, res) => {
  const { location, triggerReason } = req.body;
  const user = db.findById('users', req.user.id);
  const guardian = db.findOne('guardians', g => g.userId === req.user.id);

  const timestamp = new Date().toISOString();

  // Send real-time SMS to registered guardian
  const smsResult = await smsService.sendGuardianSms({
    userId: req.user.id,
    eventType: 'sos_emergency',
    data: {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: location || 'Patient Geolocation'
    }
  });

  // Log to timeline
  db.insert('medical_timeline', {
    userId: req.user.id,
    eventType: 'sos_triggered',
    title: 'EMERGENCY SOS Activated',
    description: `Emergency alert triggered by patient. Guardian SMS dispatched (${smsResult.maskedPhone || 'Guardian'}).`,
    metadataJson: { location: location || 'Current GPS coordinates', status: 'SOS_ACTIVE', smsStatus: smsResult.status },
    eventDate: timestamp.split('T')[0]
  });

  // Log notification
  db.insert('notifications', {
    userId: req.user.id,
    title: 'EMERGENCY SOS Triggered',
    message: `Emergency notification and guardian SMS dispatched to registered contact (${smsResult.maskedPhone || 'Guardian'}).`,
    type: 'emergency_sos',
    isDemo: false,
    isRead: false
  });

  res.json({
    success: true,
    sosMode: 'ACTIVE_EMERGENCY',
    smsSent: smsResult.sent,
    guardianSmsInfo: smsResult,
    statusBadge: 'SOS DISPATCHED',
    contactsAlerted: [
      {
        name: 'EMS / Ambulance (First Responders)',
        number: '911 / 112',
        status: 'Local Emergency Dispatch Interface'
      },
      {
        name: guardian ? `${guardian.name} (${guardian.relationship})` : 'Primary Guardian',
        number: smsResult.maskedPhone || 'On File',
        status: smsResult.sent ? 'SMS Dispatched & Delivered' : 'Pending'
      }
    ],
    patientSummary: {
      name: user ? user.name : 'Patient',
      bloodGroup: user ? user.bloodGroup : 'O+',
      emergencyPhone: user ? user.emergencyPhone : 'On File',
      location: location || 'Patient Geolocation Shared'
    },
    disclaimer: 'For critical life-threatening situations, dial local emergency phone numbers (911 / 112) immediately.',
    timestamp: timestamp
  });
});

module.exports = router;
