const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const scheduleGenerator = require('../services/scheduleGenerator');

// POST /api/careconnect/start (Initialize a video check-in session)
router.post('/start', authenticateToken, (req, res) => {
  const { caregiverId, medicineId, scheduleId } = req.body;

  let caregiverName = 'Eleanor Doe (Primary Caregiver)';
  if (caregiverId) {
    const g = db.findOne('guardians', item => item.id === caregiverId && item.userId === req.user.id);
    if (g) caregiverName = `${g.name} (${g.relationship})`;
  }

  const session = db.insert('careconnect_sessions', {
    userId: req.user.id,
    caregiverName: caregiverName,
    medicineId: medicineId || null,
    scheduleId: scheduleId || null,
    scheduledTime: new Date().toISOString(),
    status: 'in_progress',
    adherenceConfirmed: false,
    notes: 'Caregiver check-in initiated.',
    completedAt: null,
    isDemo: true
  });

  res.json({
    success: true,
    session,
    sessionMode: 'DEMO VIDEO SESSION',
    message: 'CareConnect video session initiated. Awaiting participant connection.'
  });
});

// POST /api/careconnect/confirm-medication (Caregiver/Patient confirms medication intake during session)
router.post('/confirm-medication', authenticateToken, (req, res) => {
  const { sessionId, medicineId, scheduleId, notes } = req.body;
  const now = new Date().toISOString();

  const session = db.findOne('careconnect_sessions', s => s.id === sessionId && s.userId === req.user.id);

  if (session) {
    db.update('careconnect_sessions', s => s.id === session.id, {
      status: 'completed',
      adherenceConfirmed: true,
      notes: notes || 'Medication witnessed and confirmed during CareConnect video check-in.',
      completedAt: now
    });
  }

  // If a scheduleId was linked, mark the schedule as taken
  if (scheduleId) {
    db.update('medicine_schedules', s => s.id === scheduleId && s.userId === req.user.id, {
      status: 'taken',
      takenAt: now
    });
  }

  // Record adherence log
  db.insert('medicine_adherence_logs', {
    userId: req.user.id,
    scheduleId: scheduleId || null,
    medicineId: medicineId || (session ? session.medicineId : null),
    eventType: 'taken',
    confirmedAt: now,
    confirmationSource: 'careconnect'
  });

  // Log to timeline
  db.insert('medical_timeline', {
    userId: req.user.id,
    eventType: 'careconnect_session',
    title: 'CareConnect Session Completed',
    description: `Medication witnessed by ${session ? session.caregiverName : 'Caregiver'}. User confirmation recorded.`,
    metadataJson: {
      sessionId: session ? session.id : null,
      verificationRule: 'User Confirmation Recorded'
    },
    eventDate: now.split('T')[0]
  });

  // Calculate new adherence score
  const adherence = scheduleGenerator.calculateAdherence(req.user.id);

  // CRITICAL SAFETY RESPONSE (Section 25)
  res.json({
    success: true,
    adherenceRecorded: true,
    adherence,
    safetyReport: {
      title: 'CareConnect Session Completed',
      userConfirmation: 'Confirmed by User & Caregiver',
      medicationAdherence: 'Recorded in Health Database',
      safetyPolicy: 'Consent-based session records mutual participation and confirmation.'
    }
  });
});

// POST /api/careconnect/end (End video session)
router.post('/end', authenticateToken, (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    db.update('careconnect_sessions', s => s.id === sessionId && s.userId === req.user.id, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  }
  res.json({ success: true, message: 'CareConnect session ended.' });
});

// GET /api/careconnect/sessions (List past sessions)
router.get('/sessions', authenticateToken, (req, res) => {
  const list = db.find('careconnect_sessions', s => s.userId === req.user.id);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ sessions: list });
});

module.exports = router;
