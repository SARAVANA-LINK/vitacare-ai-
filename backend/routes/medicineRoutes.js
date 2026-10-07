const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const scheduleGenerator = require('../services/scheduleGenerator');
const alertEscalationService = require('../services/alertEscalationService');
const smsService = require('../services/smsService');
const callService = require('../services/callService');
const consumptionTrackerService = require('../services/consumptionTrackerService');
const medicineStateMachine = require('../services/medicineStateMachine');

// GET /api/medicines (List active medicines for authenticated user)
router.get('/', authenticateToken, (req, res) => {
  const medicines = db.find('medicines', m => m.userId === req.user.id && m.isActive);
  res.json({ medicines });
});

// POST /api/medicines (Manual medicine entry)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, dosage, frequency, intakeTimes, duration, instructions, startDate, userId } = req.body;

    // TEST 11: Reject userId manipulation
    if (userId && userId !== req.user.id) {
      return res.status(403).json({ error: 'API ID manipulation detected: userId does not match authenticated patient.' });
    }

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Medicine name and dosage are required.' });
    }

    const newMed = db.insert('medicines', {
      userId: req.user.id,
      prescriptionId: null,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency || 'Once daily',
      intakeTimes: Array.isArray(intakeTimes) && intakeTimes.length > 0 ? intakeTimes : ['08:00 AM'],
      duration: duration || '7 days',
      instructions: instructions || 'Take after food',
      startDate: startDate || new Date().toISOString().split('T')[0],
      isActive: true
    });

    const schedules = scheduleGenerator.generateScheduleForMedicine(newMed);

    // Add to Timeline
    db.insert('medical_timeline', {
      userId: req.user.id,
      eventType: 'medicine_scheduled',
      title: `Added Medication: ${newMed.name} (${newMed.dosage})`,
      description: `Course scheduled for ${newMed.duration} with daily timing: ${newMed.intakeTimes.join(', ')}.`,
      metadataJson: { medicineId: newMed.id, scheduledEventsCount: schedules.length },
      eventDate: newMed.startDate
    });

    res.status(201).json({
      success: true,
      medicine: newMed,
      schedulesCount: schedules.length,
      message: 'Medication added and schedule generated.'
    });
  } catch (err) {
    console.error('Add medicine error:', err);
    res.status(500).json({ error: 'Failed to add medicine: ' + err.message });
  }
});

// PUT /api/medicines/:id (User Isolation - TEST 10)
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.findById('medicines', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medicine not found.' });
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Cannot modify another patient\'s medication.' });
  }

  // TEST 11: Reject manipulated userId
  if (req.body.userId && req.body.userId !== req.user.id) {
    return res.status(403).json({ error: 'API ID manipulation detected: userId mismatch.' });
  }

  const { name, dosage, frequency, intakeTimes, instructions, isActive } = req.body;
  const updated = db.update('medicines', m => m.id === req.params.id && m.userId === req.user.id, {
    name, dosage, frequency, intakeTimes, instructions, isActive
  });

  res.json({ medicine: updated[0] });
});

// DELETE /api/medicines/:id (User Isolation - TEST 10)
router.delete('/:id', authenticateToken, (req, res) => {
  const existing = db.findById('medicines', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medicine not found.' });
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Cannot deactivate another patient\'s medication.' });
  }

  db.update('medicines', m => m.id === req.params.id && m.userId === req.user.id, {
    isActive: false
  });
  res.json({ success: true, message: 'Medicine deactivated.' });
});

// GET /api/medicines/today (Today's medicine schedule & status)
router.get('/today', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const schedules = db.find('medicine_schedules', s => s.userId === req.user.id && s.scheduledDate === today);

  // Normalize status for display
  const normalizedSchedules = schedules.map(s => {
    const raw = (s.status || 'PENDING').toUpperCase();
    let displayStatus = 'Pending';
    if (raw === 'VERIFIED' || raw === 'TAKEN') displayStatus = 'Verified';
    else if (raw === 'MISSED') displayStatus = 'Missed';
    else if (raw === 'PATIENT_REFUSED' || raw === 'REFUSED') displayStatus = 'Refused';
    else if (raw === 'TRACKING_FAILED') displayStatus = 'Tracking Failed';
    else if (raw === 'NO_RESPONSE') displayStatus = 'No Response';
    else if (raw === 'CALL_ATTEMPT_1') displayStatus = 'Call #1 Active';
    else if (raw === 'CALL_ATTEMPT_2') displayStatus = 'Call #2 Active';
    else if (raw === 'GUARDIAN_ESCALATION') displayStatus = 'Guardian Escalated';

    return {
      ...s,
      status: displayStatus,
      rawStatus: s.status
    };
  });

  normalizedSchedules.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const nextMed = scheduleGenerator.getNextMedicine(req.user.id);
  const adherence = scheduleGenerator.calculateAdherence(req.user.id);

  res.json({
    date: today,
    schedules: normalizedSchedules,
    nextMedicine: nextMed,
    adherence
  });
});

// GET /api/medicines/schedules/all (For Health Tracker medicine verification view)
router.get('/schedules/all', authenticateToken, (req, res) => {
  const { status, date } = req.query;
  let schedules = db.find('medicine_schedules', s => s.userId === req.user.id);

  if (date) {
    schedules = schedules.filter(s => s.scheduledDate === date);
  }

  const normalized = schedules.map(s => {
    const raw = (s.status || 'PENDING').toUpperCase();
    let displayStatus = 'Pending';
    if (raw === 'VERIFIED' || raw === 'TAKEN') displayStatus = 'Verified';
    else if (raw === 'MISSED') displayStatus = 'Missed';
    else if (raw === 'PATIENT_REFUSED' || raw === 'REFUSED') displayStatus = 'Refused';
    else if (raw === 'TRACKING_FAILED') displayStatus = 'Tracking Failed';
    else if (raw === 'NO_RESPONSE') displayStatus = 'No Response';

    return {
      ...s,
      status: displayStatus,
      rawStatus: s.status
    };
  });

  if (status) {
    schedules = normalized.filter(s => s.status.toLowerCase() === status.toLowerCase() || (s.rawStatus && s.rawStatus.toLowerCase() === status.toLowerCase()));
  } else {
    schedules = normalized;
  }

  schedules.sort((a, b) => {
    if (a.scheduledDate === b.scheduledDate) {
      return a.scheduledTime.localeCompare(b.scheduledTime);
    }
    return new Date(b.scheduledDate) - new Date(a.scheduledDate);
  });

  res.json({ schedules });
});



/**
 * TEST 2: MANUAL VERIFICATION ATTACK PREVENTION
 * Patient must NOT manually verify medicine intake.
 * Remove / reject any manual "take", "verify", or direct status overrides.
 */
router.post('/schedules/:id/take', authenticateToken, (req, res) => {
  return res.status(403).json({
    error: 'Manual verification is strictly prohibited. Medication intake can ONLY be verified via camera-based pill consumption tracking.',
    code: 'MANUAL_VERIFICATION_PROHIBITED'
  });
});

/**
 * 4. REAL BACKEND CONSUMPTION VERIFICATION ENDPOINT
 * POST /api/medicines/schedules/:id/consumption-event
 * Validates session, confidence score, gesture milestones, enforces ownership & idempotency.
 */
router.post('/schedules/:id/consumption-event', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;

    // Check User Isolation (TEST 10)
    const targetSchedule = db.findById('medicine_schedules', scheduleId);
    if (!targetSchedule) {
      return res.status(404).json({ error: 'Medicine schedule record not found.' });
    }
    if (targetSchedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Cannot verify consumption for another patient\'s medication.' });
    }

    // Check API ID Manipulation (TEST 11)
    if (req.body.userId && req.body.userId !== req.user.id) {
      return res.status(403).json({ error: 'API ID manipulation detected: userId does not match authenticated patient.' });
    }
    if (req.body.scheduleId && req.body.scheduleId !== scheduleId) {
      return res.status(400).json({ error: 'API ID manipulation detected: scheduleId mismatch.' });
    }
    if (req.body.medicineId && targetSchedule.medicineId !== req.body.medicineId) {
      return res.status(400).json({ error: 'API ID manipulation detected: medicineId does not match schedule.' });
    }

    // Direct status injection attempt without valid tracking event
    if (req.body.status === 'VERIFIED' && (!req.body.confidenceScore || !req.body.milestones)) {
      return res.status(403).json({
        error: 'Manual verification attack rejected. Direct status update to VERIFIED is prohibited without verified camera tracking telemetry.',
        code: 'MANUAL_VERIFICATION_ATTACK'
      });
    }

    const result = await consumptionTrackerService.processConsumptionEvent({
      userId: req.user.id,
      scheduleId,
      eventData: req.body
    });

    const adherence = scheduleGenerator.calculateAdherence(req.user.id);

    if (!result.verified && !result.isDuplicate) {
      return res.status(400).json({
        ...result,
        adherence
      });
    }

    return res.json({
      ...result,
      adherence
    });
  } catch (err) {
    console.error('Consumption event error:', err);
    return res.status(err.statusCode || 500).json({
      error: err.message || 'Internal server error validating consumption event.',
      code: err.code || 'CONSUMPTION_VERIFICATION_ERROR'
    });
  }
});

// Alias: POST /api/medicines/:medicineId/consumption-event (for conceptual API support)
router.post('/:medicineId/consumption-event', authenticateToken, async (req, res) => {
  try {
    const medicineId = req.params.medicineId;
    // Find active pending schedule for this medicine
    const schedule = db.findOne('medicine_schedules', s => s.medicineId === medicineId && s.userId === req.user.id && s.status !== 'Verified' && s.status !== 'VERIFIED');
    if (!schedule) {
      return res.status(404).json({ error: 'No active pending schedule found for this medication.' });
    }

    const result = await consumptionTrackerService.processConsumptionEvent({
      userId: req.user.id,
      scheduleId: schedule.id,
      eventData: req.body
    });

    const adherence = scheduleGenerator.calculateAdherence(req.user.id);
    return res.json({ ...result, adherence });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * 6. PATIENT REFUSES MEDICINE
 * POST /api/medicines/schedules/:id/refuse
 * Transitions status to PATIENT_REFUSED and immediately starts patient call #1
 */
router.post('/schedules/:id/refuse', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = db.findById('medicine_schedules', scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Medicine schedule record not found.' });
    }
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Cannot refuse another patient\'s medication.' });
    }

    const { reason = 'Patient explicitly refused dose' } = req.body;
    const result = await consumptionTrackerService.processRefusal({
      userId: req.user.id,
      scheduleId,
      reason
    });

    res.json(result);
  } catch (err) {
    console.error('Refusal error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * 7 & 8. CALL RESPONSE & ESCALATION CONTROL
 * POST /api/medicines/schedules/:id/call-respond
 * Status: 'ANSWERED' | 'NO_ANSWER' | 'DECLINED'
 */
router.post('/schedules/:id/call-respond', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = db.findById('medicine_schedules', scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { status = 'ANSWERED', callId } = req.body;
    const result = await callService.handleCallResponse({
      callId,
      scheduleId,
      status
    });

    res.json(result);
  } catch (err) {
    console.error('Call respond error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/medicines/schedules/:id/warning-call
 * Triggers patient warning call #1 or #2, stopping duplicate calls and handling escalation
 */
router.post('/schedules/:id/warning-call', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = db.findById('medicine_schedules', scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Execute call via CallService
    const result = await callService.callPatient({
      userId: req.user.id,
      scheduleId
    });

    if (result.attemptsExhausted) {
      // Escalate to guardian
      const guardianResult = await callService.callGuardian({
        userId: req.user.id,
        scheduleId,
        reason: 'Patient did not answer warning call attempts.'
      });
      return res.json({
        ...guardianResult,
        action: 'guardian_escalated'
      });
    }

    res.json({
      ...result,
      attemptCount: result.attemptNumber
    });
  } catch (err) {
    console.error('Warning call error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 11. ALERT & ESCALATION HISTORY
 * GET /api/medicines/alerts/history
 * Returns chronological timeline of tracking, calls, refusals, and guardian alerts
 */
router.get('/alerts/history', authenticateToken, (req, res) => {
  // Merge medicine_alerts_history and call_logs for complete audit trail
  const alerts = db.find('medicine_alerts_history', a => a.userId === req.user.id);
  const consumptionEvents = db.find('consumption_events', c => c.userId === req.user.id);
  const callLogs = db.find('call_logs', c => c.userId === req.user.id);

  // Unified chronological history
  const history = [...alerts];

  // Include consumption events
  for (const ce of consumptionEvents) {
    const sched = db.findById('medicine_schedules', ce.scheduleId);
    history.push({
      id: ce.id,
      userId: ce.userId,
      scheduleId: ce.scheduleId,
      medicineName: sched?.medicineName || 'Medication',
      dosage: sched?.dosage || '',
      alertType: ce.status === 'VERIFIED' ? 'consumption_verified' : 'consumption_failed',
      status: ce.status.toLowerCase(),
      recipientType: 'system_camera',
      attemptNumber: 0,
      messageContent: ce.status === 'VERIFIED'
        ? `Computer-vision tracking verified intake. Confidence: ${(ce.confidenceScore * 100).toFixed(1)}%. Milestones: ${ce.milestones.join(' -> ')}`
        : `Tracking attempt failed: ${ce.failureReason || 'Incomplete gesture'}`,
      createdAt: ce.createdAt
    });
  }

  // Deduplicate and sort chronologically (most recent first)
  const uniqueHistory = Array.from(new Map(history.map(item => [item.id, item])).values());
  uniqueHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    history: uniqueHistory,
    alerts: uniqueHistory,
    totalCount: uniqueHistory.length
  });
});

// POST /api/medicines/schedules/:id/skip (Skip dose)
router.post('/schedules/:id/skip', authenticateToken, (req, res) => {
  const schedule = db.findOne('medicine_schedules', s => s.id === req.params.id && s.userId === req.user.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule entry not found.' });

  const now = new Date().toISOString();
  db.update('medicine_schedules', s => s.id === schedule.id, {
    status: 'Skipped',
    notes: req.body.reason || 'Patient skipped dose'
  });

  db.insert('medicine_adherence_logs', {
    userId: req.user.id,
    scheduleId: schedule.id,
    medicineId: schedule.medicineId,
    eventType: 'skipped',
    confirmedAt: now,
    confirmationSource: 'app'
  });

  const adherence = scheduleGenerator.calculateAdherence(req.user.id);

  res.json({
    success: true,
    status: 'Skipped',
    message: `Marked dose as Skipped.`,
    adherence
  });
});

// POST /api/medicines/schedules/:id/remind-later (Snooze reminder)
router.post('/schedules/:id/remind-later', authenticateToken, (req, res) => {
  const schedule = db.findOne('medicine_schedules', s => s.id === req.params.id && s.userId === req.user.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule entry not found.' });

  db.insert('notifications', {
    userId: req.user.id,
    title: `Pending Reminder: ${schedule.medicineName}`,
    message: `Reminder snoozed for 15 minutes. Scheduled dose: ${schedule.dosage} (${schedule.scheduledTime}).`,
    type: 'medicine_reminder',
    isDemo: false,
    isRead: false
  });

  res.json({
    success: true,
    message: 'Reminder snoozed for 15 minutes.'
  });
});

// GET /api/medicines/notification-history (Simple Notification History for Guardian/Family Updates)
router.get('/notification-history', authenticateToken, (req, res) => {
  try {
    const history = smsService.getUserNotificationHistory(req.user.id, 100);
    res.json({
      success: true,
      history,
      totalCount: history.length
    });
  } catch (err) {
    console.error('Notification history error:', err);
    res.status(500).json({ error: 'Failed to retrieve notification history: ' + err.message });
  }
});

// POST /api/medicines/schedules/:id/failed-verification (Handles repeated verification failure & guardian alert)
router.post('/schedules/:id/failed-verification', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = db.findById('medicine_schedules', scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Medicine schedule record not found.' });
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Cannot access another patient\'s schedule.' });
    }

    const now = new Date();
    const timeFormatted = schedule.scheduledTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const user = db.findById('users', req.user.id);
    const patientName = user?.name || 'Patient';

    // Do NOT mark medicine as taken
    db.update('medicine_schedules', s => s.id === schedule.id, {
      status: 'TRACKING_FAILED',
      lastTrackingFailedAt: now.toISOString()
    });

    // Send notification to guardian stating verification was unsuccessful
    let smsRes = { sent: false };
    try {
      smsRes = await smsService.sendGuardianSms({
        userId: req.user.id,
        eventType: 'verification_failed',
        data: {
          patientName,
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          time: timeFormatted
        }
      });
    } catch (smsErr) {
      console.warn('Verification failed SMS warning:', smsErr.message);
    }

    // Insert alert history
    const guardian = db.findOne('guardians', g => g.userId === req.user.id);
    const guardianName = guardian?.name || 'Primary Guardian';
    const guardianPhone = guardian?.phoneNumber || 'On File';

    db.insert('medicine_alerts_history', {
      userId: req.user.id,
      scheduleId: schedule.id,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: 'verification_failed',
      recipient: `${guardianName} (${guardianPhone})`,
      recipientType: 'guardian',
      attemptNumber: 0,
      messageContent: `Medication Alert: ${patientName} attempted medication intake for ${schedule.medicineName}, but verification was unsuccessful. Please check with the patient.`,
      status: smsRes.sent ? 'sent' : 'failed',
      createdAt: now.toISOString()
    });

    db.insert('notifications', {
      userId: req.user.id,
      title: 'Medication Intake Verification Unsuccessful',
      message: 'Medication intake could not be verified. Please try again.',
      type: 'tracking_failed',
      isDemo: false,
      isRead: false
    });

    res.json({
      success: true,
      verified: false,
      status: 'TRACKING_FAILED',
      message: 'Medication intake could not be verified. Please try again.',
      guardianNotified: smsRes.sent
    });
  } catch (err) {
    console.error('Failed verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/medicines/schedules/:id/mark-missed (Marks schedule as Missed / Not Verified & notifies guardian)
router.post('/schedules/:id/mark-missed', authenticateToken, async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = db.findById('medicine_schedules', scheduleId);
    if (!schedule) return res.status(404).json({ error: 'Medicine schedule record not found.' });
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Cannot access another patient\'s schedule.' });
    }

    const now = new Date();
    const timeFormatted = schedule.scheduledTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const user = db.findById('users', req.user.id);
    const patientName = user?.name || 'Patient';

    // Mark status as Missed / Not Verified
    db.update('medicine_schedules', s => s.id === schedule.id, {
      status: 'Missed',
      missedAt: now.toISOString()
    });

    // Send SMS to registered guardian/family contact
    let smsRes = { sent: false };
    try {
      smsRes = await smsService.sendGuardianSms({
        userId: req.user.id,
        eventType: 'missed_medication',
        data: {
          patientName,
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          time: timeFormatted
        }
      });
    } catch (smsErr) {
      console.warn('Missed dose SMS warning:', smsErr.message);
    }

    // Insert alert history
    const guardian = db.findOne('guardians', g => g.userId === req.user.id);
    const guardianName = guardian?.name || 'Primary Guardian';
    const guardianPhone = guardian?.phoneNumber || 'On File';

    db.insert('medicine_alerts_history', {
      userId: req.user.id,
      scheduleId: schedule.id,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: 'missed_medication',
      recipient: `${guardianName} (${guardianPhone})`,
      recipientType: 'guardian',
      attemptNumber: 0,
      messageContent: `Medication Alert: ${patientName} has not completed the scheduled medication intake for ${schedule.medicineName}. Please check with the patient.`,
      status: smsRes.sent ? 'sent' : 'pending',
      createdAt: now.toISOString()
    });

    db.insert('notifications', {
      userId: req.user.id,
      title: 'Medication Missed / Not Verified',
      message: `Medication Alert: Scheduled intake for ${schedule.medicineName} was missed. Guardian has been notified.`,
      type: 'missed_medicine',
      isDemo: false,
      isRead: false
    });

    const adherence = scheduleGenerator.calculateAdherence(req.user.id);

    res.json({
      success: true,
      status: 'Missed',
      displayStatus: 'Missed / Not Verified',
      message: 'Medication marked as Missed / Not Verified. Guardian notified.',
      guardianNotified: smsRes.sent,
      adherence
    });
  } catch (err) {
    console.error('Mark missed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines/adherence (Adherence Dashboard metrics)
router.get('/adherence', authenticateToken, (req, res) => {
  const adherence = scheduleGenerator.calculateAdherence(req.user.id);
  res.json({ adherence });
});

// GET /api/medicines/:id (Retrieve single medicine with User Isolation - TEST 10)
router.get('/:id', authenticateToken, (req, res) => {
  const medicine = db.findById('medicines', req.params.id);
  if (!medicine) {
    return res.status(404).json({ error: 'Medicine not found.' });
  }
  if (medicine.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied: Cannot access another patient\'s medication.' });
  }
  res.json({ medicine });
});

module.exports = router;
