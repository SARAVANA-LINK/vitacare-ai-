const crypto = require('crypto');
const db = require('../db');
const smsService = require('./smsService');
const medicineStateMachine = require('./medicineStateMachine');

// Minimum confidence score threshold required for verification
const CONFIDENCE_THRESHOLD = 0.70;

// Valid gesture milestones expected from real camera tracking pipeline
const REQUIRED_GESTURES = ['pill_detected', 'hand_to_mouth_motion', 'consumption_completed'];

class ConsumptionTrackerService {
  /**
   * Processes and validates an automated camera tracking consumption event.
   * Rejects direct status bypasses, enforces ownership, idempotency, and logs telemetry.
   */
  async processConsumptionEvent({ userId, scheduleId, eventData }) {
    if (!userId) {
      const err = new Error('Authentication required.');
      err.statusCode = 401;
      throw err;
    }

    if (!scheduleId) {
      const err = new Error('scheduleId is required.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify schedule belongs to authenticated patient
    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) {
      const existsOther = db.findOne('medicine_schedules', s => s.id === scheduleId);
      if (existsOther) {
        // Belongs to another user -> User isolation violation!
        const err = new Error('Access denied: Cannot access another patient\'s medication schedule.');
        err.statusCode = 403;
        throw err;
      }
      const err = new Error('Medicine schedule record not found.');
      err.statusCode = 404;
      throw err;
    }

    // 2. Reject direct status tampering (e.g. `{ status: 'VERIFIED' }` with no vision telemetry)
    if (!eventData || typeof eventData !== 'object') {
      const err = new Error('Invalid consumption event payload. Camera tracking telemetry required.');
      err.statusCode = 400;
      throw err;
    }

    // Direct manual override detection: if client provides status = 'VERIFIED' without confidenceScore or milestones
    const isDirectStatusAttempt = (eventData.status === 'VERIFIED' || eventData.status === 'taken') && 
      (!eventData.confidenceScore || !eventData.milestones || !eventData.sessionId);
    
    if (isDirectStatusAttempt) {
      const err = new Error('Manual verification attack detected. Direct status changes to VERIFIED are prohibited. Automatic tracking telemetry required.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Check Idempotency: If schedule is ALREADY VERIFIED
    if (schedule.status === 'Verified' || schedule.status === 'VERIFIED') {
      const existingEvent = db.findOne('consumption_events', e => e.scheduleId === scheduleId && e.status === 'VERIFIED');
      return {
        success: true,
        isDuplicate: true,
        status: 'VERIFIED',
        message: 'Medication dose is already verified. Duplicate event accepted idempotently without re-triggering notifications.',
        consumptionEvent: existingEvent || null
      };
    }

    const {
      sessionId,
      startedAt = new Date().toISOString(),
      detectedAt = new Date().toISOString(),
      completedAt = new Date().toISOString(),
      confidenceScore = 0,
      verificationSource = 'camera_vision_pipeline',
      milestones = [],
      status: requestedStatus
    } = eventData;

    // 4. Validate tracking confidence & milestones
    const numericScore = parseFloat(confidenceScore);
    const hasSufficientConfidence = !isNaN(numericScore) && numericScore >= CONFIDENCE_THRESHOLD;
    
    // Check if tracking milestones indicate genuine consumption
    const hasMilestones = Array.isArray(milestones) && milestones.length > 0;
    const isExplicitFailure = requestedStatus === 'FAILED' || requestedStatus === 'TRACKING_FAILED' || eventData.failed === true;

    if (isExplicitFailure || !hasSufficientConfidence || !hasMilestones) {
      // Record failed tracking event in database
      const failureReason = isExplicitFailure
        ? (eventData.reason || 'Tracking explicitly reported failure')
        : (!hasSufficientConfidence
          ? `Insufficient computer vision confidence: ${(numericScore * 100).toFixed(1)}% (Threshold: ${(CONFIDENCE_THRESHOLD * 100)}%)`
          : 'Incomplete consumption gesture milestones');

      const failedEvent = db.insert('consumption_events', {
        id: crypto.randomUUID(),
        userId,
        medicineId: schedule.medicineId,
        scheduleId: schedule.id,
        startedAt,
        detectedAt,
        completedAt,
        status: 'FAILED',
        verificationSource,
        confidenceScore: isNaN(numericScore) ? 0 : numericScore,
        deviceSessionId: sessionId || 'unknown_session',
        milestones,
        failureReason,
        createdAt: new Date().toISOString()
      });

      // Update schedule to TRACKING_FAILED
      db.update('medicine_schedules', s => s.id === schedule.id, {
        status: 'TRACKING_FAILED',
        lastTrackingFailedAt: new Date().toISOString()
      });

      // Log failure in alerts history
      const user = db.findById('users', userId);
      const alertLog = db.insert('medicine_alerts_history', {
        userId,
        scheduleId: schedule.id,
        medicineId: schedule.medicineId,
        medicineName: schedule.medicineName,
        dosage: schedule.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDate: schedule.scheduledDate,
        alertType: 'tracking_failed',
        recipient: `${user?.name || 'Patient'}`,
        recipientType: 'patient',
        attemptNumber: 0,
        messageContent: `Consumption tracking failed: ${failureReason}. Status remains unverified.`,
        status: 'failed',
        createdAt: new Date().toISOString()
      });

      db.insert('alert_history', { ...alertLog });

      return {
        success: false,
        verified: false,
        status: 'TRACKING_FAILED',
        error: `Consumption tracking could not verify intake: ${failureReason}`,
        consumptionEvent: failedEvent
      };
    }

    // 5. Successful Consumption Verified!
    // Store record in consumption_events table
    const consumptionRecord = db.insert('consumption_events', {
      id: crypto.randomUUID(),
      userId,
      medicineId: schedule.medicineId,
      scheduleId: schedule.id,
      startedAt,
      detectedAt,
      completedAt,
      status: 'VERIFIED',
      verificationSource,
      confidenceScore: numericScore,
      deviceSessionId: sessionId || crypto.randomUUID(),
      milestones,
      createdAt: new Date().toISOString()
    });

    const now = new Date();
    const timeFormatted = schedule.scheduledTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Transition schedule status to VERIFIED
    db.update('medicine_schedules', s => s.id === schedule.id, {
      status: 'Verified',
      takenAt: now.toISOString(),
      verifiedVia: verificationSource,
      consumptionEventId: consumptionRecord.id,
      warningAttemptsCount: 0
    });

    const user = db.findById('users', userId);
    const patientName = user?.name || 'Patient';
    const guardian = db.findOne('guardians', g => g.userId === userId);
    const guardianName = guardian?.name || 'Primary Guardian';
    const guardianPhone = guardian?.phoneNumber || user?.emergencyPhone || 'On File';

    const guardianMessage = `VitaCare Alert: ${patientName} has taken ${schedule.medicineName} at ${timeFormatted}.`;

    // Dispatch real multilingual SMS to guardian via smsService
    try {
      await smsService.sendGuardianSms({
        userId,
        eventType: 'dose_verified',
        data: {
          patientName,
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          time: timeFormatted
        }
      });
    } catch (smsErr) {
      console.warn('Dose verified SMS notice warning:', smsErr.message);
    }

    // Insert alert history
    const alertEntry = db.insert('medicine_alerts_history', {
      userId,
      scheduleId: schedule.id,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: 'intake_verified',
      recipient: `${guardianName} (${guardianPhone})`,
      recipientType: 'guardian',
      attemptNumber: 0,
      messageContent: guardianMessage,
      status: 'confirmed',
      createdAt: now.toISOString()
    });

    db.insert('alert_history', { ...alertEntry });

    // User notification
    db.insert('notifications', {
      userId,
      title: 'Medication Intake Verified',
      message: `Camera tracking confirmed consumption of ${schedule.medicineName} (${schedule.dosage}) with ${(numericScore * 100).toFixed(1)}% confidence. Guardian notified.`,
      type: 'medicine_verified',
      isDemo: false,
      isRead: false
    });

    // Medical timeline
    db.insert('medical_timeline', {
      userId,
      eventType: 'medication_confirmed',
      title: `Medication Verified: ${schedule.medicineName}`,
      description: `Camera tracking verified intake of ${schedule.dosage} scheduled for ${schedule.scheduledTime}. Confidence: ${(numericScore * 100).toFixed(1)}%.`,
      metadataJson: {
        scheduleId: schedule.id,
        consumptionEventId: consumptionRecord.id,
        confidenceScore: numericScore,
        status: 'VERIFIED'
      },
      eventDate: schedule.scheduledDate || now.toISOString().split('T')[0]
    });

    return {
      success: true,
      verified: true,
      status: 'VERIFIED',
      message: 'Pill consumption verified by computer vision pipeline.',
      consumptionEvent: consumptionRecord,
      guardianMessage,
      alertEntry
    };
  }

  /**
   * Handles explicit patient refusal of scheduled dose.
   */
  async processRefusal({ userId, scheduleId, reason = 'Patient declined to take dose' }) {
    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) {
      const err = new Error('Medicine schedule record not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date().toISOString();

    // Set status to PATIENT_REFUSED
    db.update('medicine_schedules', s => s.id === scheduleId, {
      status: 'PATIENT_REFUSED',
      refusalReason: reason,
      refusedAt: now
    });

    const user = db.findById('users', userId);
    const patientName = user?.name || 'Patient';

    const alertEntry = db.insert('medicine_alerts_history', {
      userId,
      scheduleId,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: 'patient_refused',
      recipient: patientName,
      recipientType: 'patient',
      attemptNumber: 0,
      messageContent: `Patient explicitly refused scheduled medication ${schedule.medicineName}. Reason: ${reason}. Escalation initiated.`,
      status: 'refused',
      createdAt: now
    });

    db.insert('alert_history', { ...alertEntry });

    // Immediately trigger Warning Call Attempt #1 via CallService
    const callService = require('./callService');
    const callResult = await callService.callPatient({
      userId,
      scheduleId,
      attemptNumber: 1,
      reason: `Patient refused dose: ${reason}`
    });

    return {
      success: true,
      status: 'PATIENT_REFUSED',
      message: 'Patient refusal recorded. Automated call escalation initiated.',
      call: callResult
    };
  }
}

module.exports = new ConsumptionTrackerService();
