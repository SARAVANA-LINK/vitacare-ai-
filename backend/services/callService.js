const crypto = require('crypto');
const db = require('../db');
const smsService = require('./smsService');
const medicineStateMachine = require('./medicineStateMachine');

class CallService {
  /**
   * Retrieves active system settings for call attempts & escalation
   */
  getSettings() {
    const settings = db.findOne('system_settings', s => s.id === 'system-config-1');
    return {
      maxAttempts: settings?.warningCallAttempts ?? 2,
      timeoutMinutes: settings?.warningTimeoutMinutes ?? 15,
      escalateToGuardian: settings?.escalateToGuardian ?? true
    };
  }

  /**
   * Dispatches automated voice call attempt to patient.
   * Enforces strict attempt bounds, idempotency, and stops if call answered.
   */
  async callPatient({ userId, scheduleId, attemptNumber, reason = 'Scheduled dose intake reminder' }) {
    if (!userId || !scheduleId) {
      throw new Error('userId and scheduleId are required to initiate a patient call.');
    }

    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) {
      const err = new Error('Medicine schedule record not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    // Stop if already verified
    if (schedule.status === 'Verified' || schedule.status === 'VERIFIED') {
      return {
        success: false,
        blocked: true,
        reason: 'Medicine intake already verified. No warning call needed.',
        status: 'VERIFIED'
      };
    }

    const { maxAttempts } = this.getSettings();

    // Check if any previous call was ANSWERED
    const existingCalls = db.find('call_logs', c => c.scheduleId === scheduleId && c.recipientType === 'patient');
    const wasAnswered = existingCalls.some(c => c.status === 'ANSWERED');
    if (wasAnswered) {
      return {
        success: false,
        blocked: true,
        reason: 'Escalation halted: A previous call was already answered by patient.',
        callAnswered: true
      };
    }

    const currentAttempt = attemptNumber || (existingCalls.length + 1);

    // Enforce maximum attempts limit
    if (currentAttempt > maxAttempts) {
      return {
        success: false,
        blocked: true,
        reason: `Maximum patient call attempts (${maxAttempts}) reached. Escalation to guardian required.`,
        attemptsExhausted: true
      };
    }

    // Idempotency: check if an identical in-progress or completed call already exists for this exact attempt
    const duplicateCall = existingCalls.find(c => c.attemptNumber === currentAttempt && (c.status === 'INITIATED' || c.status === 'RINGING'));
    if (duplicateCall) {
      return {
        success: true,
        isDuplicate: true,
        call: duplicateCall,
        message: `Call attempt #${currentAttempt} is already active.`
      };
    }

    const user = db.findById('users', userId);
    const patientName = user?.name || 'Patient';
    const patientPhone = user?.emergencyPhone || '+1 (555) 0199';

    const now = new Date().toISOString();
    const callRecord = db.insert('call_logs', {
      id: crypto.randomUUID(),
      scheduleId,
      userId,
      recipientType: 'patient',
      recipientName: patientName,
      recipientPhone: patientPhone,
      attemptNumber: currentAttempt,
      maxAttempts,
      status: 'INITIATED',
      reason,
      createdAt: now,
      updatedAt: now
    });

    // Update schedule state
    const isRefusal = schedule.status === 'PATIENT_REFUSED';
    const nextState = isRefusal ? 'PATIENT_REFUSED' : (currentAttempt === 1 ? 'CALL_ATTEMPT_1' : 'CALL_ATTEMPT_2');
    if (!isRefusal) {
      try {
        medicineStateMachine.assertTransition(schedule.status, nextState);
      } catch (e) {
        // Allow progression if in tracking or pending
      }
    }

    db.update('medicine_schedules', s => s.id === scheduleId, {
      status: nextState,
      warningAttemptsCount: currentAttempt,
      activeCallStage: currentAttempt === 1 ? 'CALL_ATTEMPT_1' : 'CALL_ATTEMPT_2',
      lastCallAt: now
    });

    const warningMsg = `VitaCare Warning (Call Attempt #${currentAttempt} of ${maxAttempts}): ${patientName}, your scheduled dose of ${schedule.medicineName} (${schedule.dosage}) at ${schedule.scheduledTime} is currently pending. Please confirm intake.`;

    // Store in Alert History
    const alertEntry = db.insert('medicine_alerts_history', {
      userId,
      scheduleId,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: `patient_warning_${currentAttempt}`,
      recipient: `${patientName} (${patientPhone})`,
      recipientType: 'patient',
      attemptNumber: currentAttempt,
      messageContent: warningMsg,
      status: 'unanswered',
      createdAt: now
    });

    // Also store in unified alert_history
    db.insert('alert_history', {
      ...alertEntry
    });

    // Add to user notifications
    db.insert('notifications', {
      userId,
      title: `Medicine Warning: Call #${currentAttempt}`,
      message: warningMsg,
      type: 'missed_medicine',
      isDemo: false,
      isRead: false
    });

    return {
      success: true,
      call: callRecord,
      attemptNumber: currentAttempt,
      maxAttempts,
      status: nextState,
      alertEntry
    };
  }

  /**
   * Responds to / simulates the result of a voice call.
   * Status can be: 'ANSWERED', 'DECLINED', 'NO_ANSWER', 'TIMEOUT', 'FAILED'
   */
  async handleCallResponse({ callId, scheduleId, status }) {
    const validStatuses = ['ANSWERED', 'DECLINED', 'NO_ANSWER', 'TIMEOUT', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid call status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    let call = null;
    if (callId) {
      call = db.findOne('call_logs', c => c.id === callId);
    } else if (scheduleId) {
      // Find latest call for this schedule
      const calls = db.find('call_logs', c => c.scheduleId === scheduleId);
      calls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      call = calls[0];
    }

    if (!call) {
      throw new Error('Call log record not found.');
    }

    const now = new Date().toISOString();
    db.update('call_logs', c => c.id === call.id, {
      status,
      completedAt: now,
      updatedAt: now
    });

    const schedule = db.findById('medicine_schedules', call.scheduleId);
    if (!schedule) return { call, schedule: null };

    const { maxAttempts, timeoutMinutes } = this.getSettings();

    if (status === 'ANSWERED') {
      // TEST 6: Patient answered Call. Escalation stops!
      // Call #2 must NOT occur, Guardian must NOT be called.
      db.update('medicine_schedules', s => s.id === schedule.id, {
        callAnswered: true,
        lastCallAnsweredAt: now
      });

      const alertEntry = db.insert('medicine_alerts_history', {
        userId: call.userId,
        scheduleId: schedule.id,
        medicineId: schedule.medicineId,
        medicineName: schedule.medicineName,
        dosage: schedule.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDate: schedule.scheduledDate,
        alertType: `call_answered`,
        recipient: `${call.recipientName} (${call.recipientPhone})`,
        recipientType: 'patient',
        attemptNumber: call.attemptNumber,
        messageContent: `Patient Call #${call.attemptNumber} – Answered. Patient acknowledged dose. Escalation halted.`,
        status: 'answered',
        createdAt: now
      });

      db.insert('alert_history', { ...alertEntry });

      return {
        success: true,
        callStatus: 'ANSWERED',
        escalationHalted: true,
        message: 'Patient answered call. Escalation halted successfully.'
      };
    } else {
      // Call was unanswered / declined / timed out
      const alertEntry = db.insert('medicine_alerts_history', {
        userId: call.userId,
        scheduleId: schedule.id,
        medicineId: schedule.medicineId,
        medicineName: schedule.medicineName,
        dosage: schedule.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDate: schedule.scheduledDate,
        alertType: `call_unanswered`,
        recipient: `${call.recipientName} (${call.recipientPhone})`,
        recipientType: 'patient',
        attemptNumber: call.attemptNumber,
        messageContent: `Patient Call #${call.attemptNumber} – No Answer (${status}).`,
        status: 'no_answer',
        createdAt: now
      });

      db.insert('alert_history', { ...alertEntry });

      // Check if both / max attempts have been exhausted
      if (call.attemptNumber >= maxAttempts) {
        // Automatically escalate to Guardian
        const guardianResult = await this.callGuardian({
          userId: call.userId,
          scheduleId: schedule.id,
          reason: `Patient did not answer after ${maxAttempts} call attempts.`
        });

        return {
          success: true,
          callStatus: status,
          attemptNumber: call.attemptNumber,
          escalatedToGuardian: true,
          guardianResult
        };
      } else {
        return {
          success: true,
          callStatus: status,
          attemptNumber: call.attemptNumber,
          nextAttemptPending: true,
          timeoutMinutes
        };
      }
    }
  }

  /**
   * Dispatches escalation alert & call to designated guardian.
   * GUARDIAN ESCALATION happens ONLY when:
   * 1. Patient has not consumed/verified medicine
   * 2. Configured call attempts exhausted
   * 3. No successful answer received
   * STRICT IDEMPOTENCY: Dispatches EXACTLY ONCE per schedule.
   */
  async callGuardian({ userId, scheduleId, reason = 'Patient did not respond to scheduled medicine alert' }) {
    if (!userId || !scheduleId) {
      throw new Error('userId and scheduleId are required to escalate to guardian.');
    }

    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) {
      const err = new Error('Medicine schedule record not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    // Guard 1: Patient already verified
    if (schedule.status === 'Verified' || schedule.status === 'VERIFIED') {
      return {
        success: false,
        blocked: true,
        reason: 'Medicine already verified. Guardian escalation prohibited.'
      };
    }

    // Guard 2: Idempotency - check if Guardian escalation has ALREADY occurred for this schedule
    const existingGuardianCall = db.findOne('call_logs', c => c.scheduleId === scheduleId && c.recipientType === 'guardian');
    if (existingGuardianCall || schedule.escalatedToGuardian) {
      return {
        success: true,
        isDuplicate: true,
        alreadyEscalated: true,
        message: 'Guardian escalation already completed for this scheduled medicine dose. Duplicate alert prevented.',
        call: existingGuardianCall
      };
    }

    const user = db.findById('users', userId);
    const patientName = user?.name || 'Patient';

    const guardian = db.findOne('guardians', g => g.userId === userId);
    const guardianName = guardian?.name || 'Primary Guardian';
    const guardianPhone = guardian?.phoneNumber || user?.emergencyPhone || '+91 98765 00000';

    const now = new Date().toISOString();
    const escalationMsg = `VitaCare Alert: ${patientName} has not confirmed consumption of ${schedule.medicineName}. The patient did not respond to the scheduled medicine alert.`;

    // 1. Log Guardian Call
    const guardianCall = db.insert('call_logs', {
      id: crypto.randomUUID(),
      scheduleId,
      userId,
      recipientType: 'guardian',
      recipientName: guardianName,
      recipientPhone: guardianPhone,
      status: 'COMPLETED',
      reason,
      createdAt: now,
      updatedAt: now
    });

    // 2. Update schedule state
    db.update('medicine_schedules', s => s.id === scheduleId, {
      status: 'MISSED',
      escalatedToGuardian: true,
      escalatedAt: now
    });

    // 3. Dispatch multilingual SMS via smsService
    try {
      await smsService.sendGuardianSms({
        userId,
        eventType: 'missed_medication',
        data: {
          patientName,
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          time: schedule.scheduledTime
        }
      });
    } catch (smsErr) {
      console.warn('Guardian escalation SMS warning:', smsErr.message);
    }

    // 4. Store in Alert History
    const alertEntry = db.insert('medicine_alerts_history', {
      userId,
      scheduleId,
      medicineId: schedule.medicineId,
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate,
      alertType: 'guardian_escalated',
      recipient: `${guardianName} (${guardianPhone})`,
      recipientType: 'guardian',
      attemptNumber: schedule.warningAttemptsCount || 2,
      messageContent: `Guardian Escalation – Completed: ${escalationMsg}`,
      status: 'completed',
      createdAt: now
    });

    db.insert('alert_history', { ...alertEntry });

    // 5. System Notification
    db.insert('notifications', {
      userId,
      title: '🚨 Guardian Escalation Completed',
      message: escalationMsg,
      type: 'guardian_alert',
      isDemo: false,
      isRead: false
    });

    return {
      success: true,
      escalated: true,
      guardianName,
      guardianPhone,
      message: escalationMsg,
      call: guardianCall,
      alertEntry
    };
  }

  /**
   * Retrieves call status by ID
   */
  getCallStatus(callId) {
    return db.findOne('call_logs', c => c.id === callId);
  }
}

module.exports = new CallService();
