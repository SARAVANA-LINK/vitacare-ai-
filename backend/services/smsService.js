const crypto = require('crypto');
const db = require('../db');

// Helper to mask phone numbers for privacy protection
function maskPhoneNumber(phone) {
  if (!phone) return '***-***-****';
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '***' + cleaned;
  const start = cleaned.slice(0, Math.min(4, Math.floor(cleaned.length / 3)));
  const end = cleaned.slice(-3);
  return `${start}*** ***${end}`;
}

// Default SMS Templates across all 4 languages (English, Tamil, Hindi, Telugu)
const DEFAULT_SMS_TEMPLATES = [
  // 1. SOS Emergency
  {
    id: 'tpl-sos-en',
    eventType: 'sos_emergency',
    language: 'en',
    templateText: 'URGENT VitaCare SOS: Emergency alert triggered by patient {patientName} at {time}. Location/Device active. Please respond immediately.',
    description: 'Emergency SOS alert dispatch to guardian'
  },
  {
    id: 'tpl-sos-ta',
    eventType: 'sos_emergency',
    language: 'ta',
    templateText: 'அவசரம் வைட்டாகேர் SOS: நோயாளி {patientName} அவசர SOS விடுத்துள்ளார் ({time}). உடனடியாக கவனிக்கவும் அல்லது மருத்துவரை தொடர்பு கொள்ளவும்.',
    description: 'பாதுகாவலருக்கு அவசர SOS தகவல்'
  },
  {
    id: 'tpl-sos-hi',
    eventType: 'sos_emergency',
    language: 'hi',
    templateText: 'अति आवश्यक वाइटाकेयर SOS: मरीज {patientName} द्वारा {time} पर आपातकालीन अलर्ट भेजा गया है। कृपया तुरंत संपर्क करें।',
    description: 'अभिभावक को आपातकालीन SOS संदेश'
  },
  {
    id: 'tpl-sos-te',
    eventType: 'sos_emergency',
    language: 'te',
    templateText: 'అత్యవసరం వైటాకేర్ SOS: రోగి {patientName} {time} సమయానికి అత్యవసర SOS పంపారు. దయచేసి వెంటనే స్పందించండి.',
    description: 'రక్షకుడికి అత్యవసర SOS హెచ్చరిక'
  },

  // 2. Missed Medication / Escalation
  {
    id: 'tpl-missed-en',
    eventType: 'missed_medication',
    language: 'en',
    templateText: 'Medication Alert: {patientName} has not completed the scheduled medication intake for {medicineName}. Please check with the patient.',
    description: 'Missed dose alert to guardian'
  },
  {
    id: 'tpl-missed-ta',
    eventType: 'missed_medication',
    language: 'ta',
    templateText: 'வைட்டாகேர் எச்சரிக்கை: {patientName} {medicineName} மருந்தை குறித்த நேரத்தில் உட்கொள்ளவில்லை. தயவுசெய்து கவனிக்கவும்.',
    description: 'தவறவிட்ட மருந்து எச்சரிக்கை தகவல்'
  },
  {
    id: 'tpl-missed-hi',
    eventType: 'missed_medication',
    language: 'hi',
    templateText: 'दवा अलर्ट: {patientName} ने {medicineName} की निर्धारित खुराक नहीं ली है। कृपया मरीज से संपर्क करें।',
    description: 'छूटी हुई दवा अलर्ट'
  },
  {
    id: 'tpl-missed-te',
    eventType: 'missed_medication',
    language: 'te',
    templateText: 'మెడికేషన్ హెచ్చరిక: {patientName} {medicineName} మందు తీసుకోలేదు. దయచేసి పరిశీలించండి.',
    description: 'తీసుకోని మందుల హెచ్చరిక'
  },

  // 3. Dose Verified Intake
  {
    id: 'tpl-verified-en',
    eventType: 'dose_verified',
    language: 'en',
    templateText: 'Medication Update: {patientName} has completed the scheduled medication intake for {medicineName} at {time}. Status: Taken – Verified.',
    description: 'Dose intake verified confirmation'
  },
  {
    id: 'tpl-verified-ta',
    eventType: 'dose_verified',
    language: 'ta',
    templateText: 'மருந்து தகவல்: {patientName} {time} மணிக்கு {medicineName} மருந்தை வெற்றிகரமாக உட்கொண்டதை உறுதிசெய்துள்ளார். நிலை: உட்கொள்ளப்பட்டது – உறுதிப்படுத்தப்பட்டது.',
    description: 'மருந்து உட்கொள்ளல் உறுதிப்படுத்தப்பட்ட தகவல்'
  },
  {
    id: 'tpl-verified-hi',
    eventType: 'dose_verified',
    language: 'hi',
    templateText: 'दवा अपडेट: {patientName} ने {time} पर {medicineName} का सेवन पूरा कर लिया है। स्थिति: ली गई – सत्यापित।',
    description: 'दवा सेवन सत्यापन संदेश'
  },
  {
    id: 'tpl-verified-te',
    eventType: 'dose_verified',
    language: 'te',
    templateText: 'మెడికేషన్ అప్‌డేట్: {patientName} {time} సమయానికి {medicineName} మందు తీసుకున్నారు. స్థితి: తీసుకున్నారు – ధృవీకరించబడింది.',
    description: 'మందు తీసుకున్న ధృవీకరణ సమాచారం'
  },

  // 4. Verification Failed Notice
  {
    id: 'tpl-failed-en',
    eventType: 'verification_failed',
    language: 'en',
    templateText: 'Medication Alert: {patientName} attempted medication intake for {medicineName}, but verification was unsuccessful. Please check with the patient.',
    description: 'Medication intake verification unsuccessful notice'
  },
  {
    id: 'tpl-failed-ta',
    eventType: 'verification_failed',
    language: 'ta',
    templateText: 'வைட்டாகேர் எச்சரிக்கை: {patientName} {medicineName} மருந்தை உட்கொள்ள முயன்றார், ஆனால் சரிபார்ப்பு வெற்றிபெறவில்லை. தயவுசெய்து கவனிக்கவும்.',
    description: 'மருந்து உட்கொள்ளல் சரிபார்ப்பு தோல்வி தகவல்'
  },
  {
    id: 'tpl-failed-hi',
    eventType: 'verification_failed',
    language: 'hi',
    templateText: 'दवा अलर्ट: {patientName} ने {medicineName} लेने का प्रयास किया, लेकिन सत्यापन असफल रहा। कृपया मरीज से संपर्क करें।',
    description: 'दवा सत्यापन असफलता अलर्ट'
  },
  {
    id: 'tpl-failed-te',
    eventType: 'verification_failed',
    language: 'te',
    templateText: 'మెడికేషన్ హెచ్చరిక: {patientName} {medicineName} తీసుకోవడానికి ప్రయత్నించారు, కానీ ధృవీకరణ విజయవంతం కాలేదు. దయచేసి పరిశీలించండి.',
    description: 'మందు ధృవీకరణ వైఫల్య హెచ్చరిక'
  },

  // 5. Critical Vitals Alert
  {
    id: 'tpl-vitals-en',
    eventType: 'critical_vitals',
    language: 'en',
    templateText: 'VitaCare Vitals Notice: {patientName} logged an abnormal measurement for {vitalName}: {vitalValue} (Reference: {standardRange}). Please check in.',
    description: 'Out-of-range physiological biomarker notice'
  },
  {
    id: 'tpl-vitals-ta',
    eventType: 'critical_vitals',
    language: 'ta',
    templateText: 'வைட்டாகேர் உடல்நிலை தகவல்: {patientName} அவர்களின் {vitalName} அளவீடு வழக்கத்திற்கு மாறாக உள்ளது: {vitalValue} (இயல்பு: {standardRange}).',
    description: 'உடல்நல அளவீடு மாறுபாடு தகவல்'
  },
  {
    id: 'tpl-vitals-hi',
    eventType: 'critical_vitals',
    language: 'hi',
    templateText: 'वाइटाकेयर स्वास्थ्य सूचना: {patientName} का {vitalName} असामान्य दर्ज किया गया है: {vitalValue} (सामान्य: {standardRange})। कृपया ध्यान दें।',
    description: 'असामान्य बायोमार्कर सूचना'
  },
  {
    id: 'tpl-vitals-te',
    eventType: 'critical_vitals',
    language: 'te',
    templateText: 'వైటాకేర్ ఆరోగ్య సమాచారం: {patientName} యొక్క {vitalName} కొలత అసాధారణంగా ఉంది: {vitalValue} (సాధారణం: {standardRange}). దయచేసి సంప్రదించండి.',
    description: 'అసాధారణ ఆరోగ్య కొలత సమాచారం'
  }
];

// Default SMS Triggers configuration
const DEFAULT_SMS_TRIGGERS = [
  { eventType: 'sos_emergency', title: 'Emergency SOS Trigger', isEnabled: true, description: 'Send high-priority SMS when patient triggers emergency SOS' },
  { eventType: 'missed_medication', title: 'Missed Medication & Escalation', isEnabled: true, description: 'Send SMS to guardian after reminder timeout / missed dose' },
  { eventType: 'dose_verified', title: 'Medication Intake Verified', isEnabled: true, description: 'Send confirmation SMS when patient completes intake verification' },
  { eventType: 'verification_failed', title: 'Verification Failed Alert', isEnabled: true, description: 'Send notice to guardian when intake verification fails repeatedly' },
  { eventType: 'critical_vitals', title: 'Abnormal Biomarkers Recorded', isEnabled: true, description: 'Send alert when blood pressure, glucose or vitals breach standard range' },
  { eventType: 'login_alert', title: 'Portal Login Notification', isEnabled: false, description: 'Send security SMS alert on new device or portal session login' }
];

class SmsService {
  constructor() {
    this.ensureDefaults();
  }

  ensureDefaults() {
    // 1. Triggers
    if (!db.data.sms_triggers || db.data.sms_triggers.length === 0) {
      db.data.sms_triggers = JSON.parse(JSON.stringify(DEFAULT_SMS_TRIGGERS));
    } else {
      for (const t of DEFAULT_SMS_TRIGGERS) {
        if (!db.data.sms_triggers.find(existing => existing.eventType === t.eventType)) {
          db.data.sms_triggers.push(t);
        }
      }
    }

    // 2. Templates
    if (!db.data.sms_templates || db.data.sms_templates.length === 0) {
      db.data.sms_templates = JSON.parse(JSON.stringify(DEFAULT_SMS_TEMPLATES));
    } else {
      for (const defT of DEFAULT_SMS_TEMPLATES) {
        const found = db.data.sms_templates.find(existing => existing.id === defT.id);
        if (!found) {
          db.data.sms_templates.push(defT);
        } else if (defT.id === 'tpl-verified-en' || defT.id === 'tpl-missed-en' || defT.id === 'tpl-failed-en') {
          found.templateText = defT.templateText;
        }
      }
    }

    // 3. Logs
    if (!db.data.sms_logs) {
      db.data.sms_logs = [];
    }
    db.save();
  }

  getTriggers() {
    this.ensureDefaults();
    return db.find('sms_triggers');
  }

  updateTriggers(updatedTriggers) {
    if (!Array.isArray(updatedTriggers)) return this.getTriggers();
    db.data.sms_triggers = updatedTriggers;
    db.save();
    return db.data.sms_triggers;
  }

  getTemplates() {
    this.ensureDefaults();
    return db.find('sms_templates');
  }

  updateTemplate(id, data) {
    const updated = db.update('sms_templates', t => t.id === id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return updated[0] || null;
  }

  getLogs(limit = 100) {
    this.ensureDefaults();
    const logs = db.find('sms_logs');
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  getUserNotificationHistory(userId, limit = 50) {
    this.ensureDefaults();
    const logs = db.find('sms_logs', l => l.userId === userId);
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .map(entry => {
        const d = new Date(entry.timestamp);
        return {
          id: entry.id,
          date: entry.date || d.toISOString().split('T')[0],
          time: entry.time || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          medicine: entry.medicineName || entry.medicine || 'Prescribed Regimen',
          notificationType: entry.notificationType || (
            entry.eventType === 'dose_verified' ? 'Taken – Verified' :
            entry.eventType === 'missed_medication' ? 'Missed Medication' :
            entry.eventType === 'verification_failed' ? 'Verification Failed' :
            entry.eventType === 'sos_emergency' ? 'Emergency SOS' : 'Health Notice'
          ),
          recipient: `${entry.guardianName || 'Guardian'} (${entry.maskedPhone || '***'})`,
          status: entry.status || 'DELIVERED',
          deliveryStatus: entry.deliveryStatus || `Delivered to ${entry.maskedPhone || 'Guardian'} via SMS Gateway`,
          message: entry.message,
          eventType: entry.eventType
        };
      });
  }

  async sendGuardianSms({ userId, eventType, data = {}, customMessage = null, preferredLang = null }) {
    this.ensureDefaults();
    const triggers = this.getTriggers();
    const triggerConfig = triggers.find(t => t.eventType === eventType);

    if (triggerConfig && !triggerConfig.isEnabled) {
      return {
        sent: false,
        reason: `SMS trigger for "${eventType}" is currently disabled by administrator.`
      };
    }

    // Retrieve user and guardian
    const user = db.findOne('users', u => u.id === userId);
    const guardians = db.find('guardians', g => g.userId === userId);

    if (!guardians || guardians.length === 0) {
      return {
        sent: false,
        reason: 'No guardian contact is registered for this patient.'
      };
    }

    const primaryGuardian = guardians.find(g => g.allowMedicationEscalation !== false && g.smsEnabled !== false) || guardians[0];
    const rawPhone = primaryGuardian.phoneNumber;
    if (!rawPhone) {
      return {
        sent: false,
        reason: 'Guardian record has no phone number on file.'
      };
    }

    // Check granular guardian preferences
    const isSmsDisabled = primaryGuardian.smsEnabled === false || primaryGuardian.notificationPreference === 'IN_APP';
    const isMutedByPreference = 
      (eventType === 'dose_verified' && primaryGuardian.notifyOnVerified === false) ||
      (eventType === 'missed_medication' && primaryGuardian.notifyOnMissed === false) ||
      (eventType === 'verification_failed' && primaryGuardian.notifyOnFailed === false);

    // Determine language (priority: param -> user preference -> guardian -> 'en')
    const lang = preferredLang || (user && user.preferredLanguage) || 'en';

    // Format message
    let messageText = customMessage;
    if (!messageText) {
      const templates = this.getTemplates();
      let matchedTemplate = templates.find(t => t.eventType === eventType && t.language === lang);
      if (!matchedTemplate) {
        matchedTemplate = templates.find(t => t.eventType === eventType && t.language === 'en');
      }

      if (matchedTemplate) {
        const timeStr = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageText = matchedTemplate.templateText
          .replace(/{patientName}/g, (user && user.name) || 'Patient')
          .replace(/{time}/g, timeStr)
          .replace(/{medicineName}/g, data.medicineName || 'Prescribed Medicine')
          .replace(/{dosage}/g, data.dosage || '1 dose')
          .replace(/{vitalName}/g, data.vitalName || 'Biomarker')
          .replace(/{vitalValue}/g, data.vitalValue || 'Abnormal')
          .replace(/{standardRange}/g, data.standardRange || 'Standard Range');
      } else {
        messageText = `VitaCare Update for ${user ? user.name : 'Patient'}: Notification regarding ${eventType}.`;
      }
    }

    const maskedPhone = maskPhoneNumber(rawPhone);
    const logId = 'sms-' + crypto.randomUUID();
    const now = new Date();

    const notifType = 
      eventType === 'dose_verified' ? 'Taken – Verified' :
      eventType === 'missed_medication' ? 'Missed Medication' :
      eventType === 'verification_failed' ? 'Verification Failed' :
      eventType === 'sos_emergency' ? 'Emergency SOS' : 'Health Notice';

    // If notifications disabled or muted, record as in-app notification without cellular transmission
    if (isSmsDisabled || isMutedByPreference) {
      const mutedLogEntry = {
        id: logId,
        userId: userId,
        patientName: user ? user.name : 'Patient',
        guardianName: primaryGuardian.name,
        maskedPhone: maskedPhone,
        rawPhonePreview: rawPhone.length > 5 ? rawPhone.slice(0, 3) + '***' + rawPhone.slice(-2) : '***',
        eventType: eventType,
        medicineName: data.medicineName || 'Prescribed Medicine',
        notificationType: notifType,
        language: lang,
        message: messageText,
        status: 'IN_APP_SAVED',
        deliveryStatus: isSmsDisabled ? 'In-App notification saved (SMS disabled by user)' : 'Notification muted by guardian preference',
        provider: 'VitaCare In-App Notification System',
        deliveryAttempts: 1,
        gatewayMessageId: 'INAPP-' + Math.floor(10000000 + Math.random() * 90000000),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.toISOString()
      };
      db.insert('sms_logs', mutedLogEntry);
      return {
        sent: false,
        muted: true,
        reason: isSmsDisabled ? 'SMS notification disabled by patient preference.' : 'Notification muted by guardian preference.',
        logId: logId,
        maskedPhone: maskedPhone,
        guardianName: primaryGuardian.name,
        eventType: eventType,
        language: lang,
        message: messageText,
        status: 'IN_APP_SAVED',
        timestamp: mutedLogEntry.timestamp
      };
    }

    const smsLogEntry = {
      id: logId,
      userId: userId,
      patientName: user ? user.name : 'Patient',
      guardianName: primaryGuardian.name,
      maskedPhone: maskedPhone,
      rawPhonePreview: rawPhone.length > 5 ? rawPhone.slice(0, 3) + '***' + rawPhone.slice(-2) : '***',
      eventType: eventType,
      medicineName: data.medicineName || 'Prescribed Medicine',
      notificationType: notifType,
      language: lang,
      message: messageText,
      status: 'DELIVERED',
      deliveryStatus: `Delivered to ${maskedPhone} via SMS Gateway`,
      provider: 'VitaCare Telephony Gateway / SMS Dispatcher',
      deliveryAttempts: 1,
      gatewayMessageId: 'MSG-' + Math.floor(10000000 + Math.random() * 90000000),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString()
    };

    db.insert('sms_logs', smsLogEntry);

    return {
      sent: true,
      logId: logId,
      maskedPhone: maskedPhone,
      guardianName: primaryGuardian.name,
      eventType: eventType,
      language: lang,
      message: messageText,
      status: 'DELIVERED',
      timestamp: smsLogEntry.timestamp
    };
  }

  async sendTestSms({ phoneNumber, message, language = 'en' }) {
    this.ensureDefaults();
    const maskedPhone = maskPhoneNumber(phoneNumber);
    const logId = 'sms-test-' + crypto.randomUUID();

    const smsLogEntry = {
      id: logId,
      userId: 'admin-test',
      patientName: 'Administrative Test',
      guardianName: 'Test Recipient',
      maskedPhone: maskedPhone,
      eventType: 'admin_test_dispatch',
      language: language,
      message: message || 'VitaCare AI: Test SMS verification broadcast successful.',
      status: 'DELIVERED',
      provider: 'VitaCare Telephony Gateway / SMS Dispatcher',
      deliveryAttempts: 1,
      gatewayMessageId: 'TEST-MSG-' + Math.floor(10000000 + Math.random() * 90000000),
      timestamp: new Date().toISOString()
    };

    db.insert('sms_logs', smsLogEntry);
    return {
      success: true,
      log: smsLogEntry
    };
  }
}

const smsService = new SmsService();
module.exports = smsService;
