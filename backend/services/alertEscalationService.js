const db = require('../db');

class AlertEscalationService {
  /**
   * Called when patient confirms taking a medicine.
   * Updates status to "Verified", sends guardian message, logs to alert history.
   */
  handleMedicineConfirmed(userId, scheduleId) {
    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) return null;

    const user = db.findById('users', userId);
    const patientName = user ? user.name : 'Patient';
    const guardian = db.findOne('guardians', g => g.userId === userId);
    const guardianPhone = guardian ? guardian.phoneNumber : (user ? user.emergencyPhone : 'On File');
    const guardianName = guardian ? guardian.name : 'Primary Guardian';

    const now = new Date();
    const timeFormatted = schedule.scheduledTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Status updated to "Verified"
    db.update('medicine_schedules', s => s.id === scheduleId, {
      status: 'Verified',
      takenAt: now.toISOString(),
      warningAttemptsCount: 0
    });

    // Requirement 5 Message:
    // "VitaCare Alert: [Patient Name] has taken [Medicine Name] at [Time]."
    const guardianMessage = `VitaCare Alert: ${patientName} has taken ${schedule.medicineName} at ${timeFormatted}.`;

    // Send notification to guardian / patient notification center
    db.insert('notifications', {
      userId: userId,
      title: 'Guardian Notified: Medicine Intake Verified',
      message: guardianMessage,
      type: 'medicine_verified',
      isDemo: false,
      isRead: false
    });

    // Store in Alert History (Requirement 5)
    const alertEntry = db.insert('medicine_alerts_history', {
      userId: userId,
      scheduleId: scheduleId,
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

    return {
      success: true,
      status: 'Verified',
      guardianMessage,
      alertEntry
    };
  }

  /**
   * Simulates/dispatches warning call attempt #1 or #2 to patient.
   * If attempts reach configured limit without confirmation, escalates to guardian!
   */
  handleWarningAttempt(userId, scheduleId) {
    const schedule = db.findOne('medicine_schedules', s => s.id === scheduleId && s.userId === userId);
    if (!schedule) throw new Error('Schedule record not found');

    const user = db.findById('users', userId);
    const patientName = user ? user.name : 'Patient';
    const patientPhone = user ? user.emergencyPhone || '+1 (555) 923-4411' : 'On File';

    const guardian = db.findOne('guardians', g => g.userId === userId);
    const guardianPhone = guardian ? guardian.phoneNumber : 'On File';
    const guardianName = guardian ? guardian.name : 'Designated Guardian';

    // Retrieve admin-configured warning attempts limit (default: 2)
    const settings = db.findOne('system_settings', s => s.id === 'system-config-1');
    const maxAttempts = settings && settings.warningCallAttempts ? settings.warningCallAttempts : 2;

    const currentAttempts = (schedule.warningAttemptsCount || 0) + 1;
    const now = new Date();

    if (currentAttempts <= maxAttempts) {
      // Step 2 & 3: Warning call to patient
      db.update('medicine_schedules', s => s.id === scheduleId, {
        status: 'Pending',
        warningAttemptsCount: currentAttempts
      });

      const warningMsg = `VitaCare Warning (Call Attempt #${currentAttempts} of ${maxAttempts}): ${patientName}, your scheduled dose of ${schedule.medicineName} (${schedule.dosage}) at ${schedule.scheduledTime} is currently pending. Please confirm intake.`;

      // Log notification
      db.insert('notifications', {
        userId: userId,
        title: `Pending Medicine Warning: Attempt #${currentAttempts}`,
        message: warningMsg,
        type: 'missed_medicine',
        isDemo: false,
        isRead: false
      });

      // Store in Alert History
      const alertLog = db.insert('medicine_alerts_history', {
        userId: userId,
        scheduleId: scheduleId,
        medicineId: schedule.medicineId,
        medicineName: schedule.medicineName,
        dosage: schedule.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDate: schedule.scheduledDate,
        alertType: `patient_warning_${currentAttempts}`,
        recipient: `${patientName} (${patientPhone})`,
        recipientType: 'patient',
        attemptNumber: currentAttempts,
        messageContent: warningMsg,
        status: 'unanswered',
        createdAt: now.toISOString()
      });

      return {
        success: true,
        escalated: false,
        attemptNumber: currentAttempts,
        maxAttempts: maxAttempts,
        message: warningMsg,
        status: 'Pending',
        alertLog
      };
    } else {
      // Step 5: Escalate to Guardian!
      db.update('medicine_schedules', s => s.id === scheduleId, {
        status: 'Missed',
        escalatedToGuardian: true,
        warningAttemptsCount: currentAttempts
      });

      const escalationMsg = `VitaCare Urgent Escalation: ${patientName} has NOT confirmed taking ${schedule.medicineName} (${schedule.dosage}) scheduled for ${schedule.scheduledTime} after ${maxAttempts} warning attempts. Please check in with the patient immediately.`;

      // Dispatch real SMS via smsService
      try {
        const smsService = require('./smsService');
        smsService.sendGuardianSms({
          userId: userId,
          eventType: 'missed_medication',
          data: {
            medicineName: schedule.medicineName,
            dosage: schedule.dosage,
            time: schedule.scheduledTime
          }
        }).catch(err => console.warn('Escalation SMS warning:', err.message));
      } catch (err) {
        console.warn('Escalation SMS require error:', err);
      }

      // Log Guardian Alert Notification
      db.insert('notifications', {
        userId: userId,
        title: 'Guardian Alert Dispatched (Dose Escalated)',
        message: escalationMsg,
        type: 'guardian_alert',
        isDemo: false,
        isRead: false
      });

      // Store in Alert History
      const alertLog = db.insert('medicine_alerts_history', {
        userId: userId,
        scheduleId: scheduleId,
        medicineId: schedule.medicineId,
        medicineName: schedule.medicineName,
        dosage: schedule.dosage,
        scheduledTime: schedule.scheduledTime,
        scheduledDate: schedule.scheduledDate,
        alertType: 'guardian_escalated',
        recipient: `${guardianName} (${guardianPhone})`,
        recipientType: 'guardian',
        attemptNumber: currentAttempts,
        messageContent: escalationMsg,
        status: 'sent',
        createdAt: now.toISOString()
      });

      return {
        success: true,
        escalated: true,
        attemptNumber: currentAttempts,
        maxAttempts: maxAttempts,
        guardianName,
        guardianPhone,
        message: escalationMsg,
        status: 'Missed',
        alertLog
      };
    }
  }

  /**
   * Retrieves alert history for a specific user
   */
  getUserAlertHistory(userId) {
    const history = db.find('medicine_alerts_history', a => a.userId === userId);
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return history;
  }
}

module.exports = new AlertEscalationService();
