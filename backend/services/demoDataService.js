const db = require('../db');
const scheduleGenerator = require('./scheduleGenerator');

class DemoDataService {
  /**
   * Resets and loads rich sample data for testing and hackathon presentation
   * Clearly marked as DEMO DATA.
   */
  loadDemoData(userId) {
    // Clean existing records for this user (except the user account itself)
    const collectionsToClean = [
      'prescriptions', 'prescription_items', 'medicines', 'medicine_schedules',
      'medicine_adherence_logs', 'health_reports', 'report_versions',
      'extracted_health_values', 'vitals', 'medical_timeline',
      'careconnect_sessions', 'notifications'
    ];

    for (const col of collectionsToClean) {
      db.delete(col, item => item.userId === userId);
    }

    const today = new Date().toISOString().split('T')[0];
    const prevDate = '2026-07-15';
    const recentDate = '2026-10-02';

    // 1. Health Report 1 (3 Months Ago - Baseline)
    const report1 = db.insert('health_reports', {
      userId: userId,
      reportType: 'Comprehensive Health Checkup (Baseline)',
      labName: 'Metropolis Clinical Diagnostic Laboratory',
      doctorName: 'Dr. Sarah Lin, MD',
      reportDate: prevDate,
      originalFilename: 'demo_lab_report_july2026.pdf',
      filePath: 'uploads/demo_lab_report_july2026.pdf',
      version: 1,
      status: 'verified',
      isDemo: true,
      rawOcrText: `METROPOLIS CLINICAL DIAGNOSTIC LABORATORY\nPatient: Johnathan Doe | Date: 2026-07-15\nReferred by: Dr. Sarah Lin\n\nFasting Blood Glucose: 114 mg/dL (Ref: 70 - 99)\nHbA1c: 6.5 % (Ref: 4.0 - 5.6)\nHemoglobin: 12.8 g/dL (Ref: 13.0 - 17.5)\nBlood Pressure: 134/86 mmHg (Ref: <120/80)\nTotal Cholesterol: 210 mg/dL (Ref: <200)\nLDL Cholesterol: 128 mg/dL (Ref: <100)\nHDL Cholesterol: 44 mg/dL (Ref: >40)\nTriglycerides: 165 mg/dL (Ref: <150)`
    });

    const v1Values = [
      { metricKey: 'fasting_glucose', metricName: 'Fasting Blood Glucose', value: '114', numericValue: 114, unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', statusIndicator: 'elevated', date: prevDate },
      { metricKey: 'hba1c', metricName: 'HbA1c (Glycated Hemoglobin)', value: '6.5', numericValue: 6.5, unit: '%', referenceRange: '4.0 - 5.6 %', statusIndicator: 'elevated', date: prevDate },
      { metricKey: 'hemoglobin', metricName: 'Hemoglobin (Hb)', value: '12.8', numericValue: 12.8, unit: 'g/dL', referenceRange: '13.0 - 17.5 g/dL', statusIndicator: 'low', date: prevDate },
      { metricKey: 'blood_pressure', metricName: 'Blood Pressure', value: '134/86', unit: 'mmHg', referenceRange: '< 120/80 mmHg', statusIndicator: 'elevated', date: prevDate },
      { metricKey: 'cholesterol_total', metricName: 'Total Cholesterol', value: '210', numericValue: 210, unit: 'mg/dL', referenceRange: '< 200 mg/dL', statusIndicator: 'elevated', date: prevDate },
      { metricKey: 'cholesterol_ldl', metricName: 'LDL Cholesterol', value: '128', numericValue: 128, unit: 'mg/dL', referenceRange: '< 100 mg/dL', statusIndicator: 'elevated', date: prevDate },
      { metricKey: 'cholesterol_hdl', metricName: 'HDL Cholesterol', value: '44', numericValue: 44, unit: 'mg/dL', referenceRange: '> 40 mg/dL', statusIndicator: 'normal', date: prevDate }
    ];

    for (const val of v1Values) {
      db.insert('extracted_health_values', {
        ...val,
        reportId: report1.id,
        userId: userId,
        confidence: 'high',
        verificationStatus: 'confirmed',
        isDemo: true
      });
      db.insert('vitals', {
        ...val,
        sourceReportId: report1.id,
        userId: userId,
        isDemo: true
      });
    }

    // 2. Health Report 2 (Recent - Improved Trends)
    const report2 = db.insert('health_reports', {
      userId: userId,
      reportType: 'Comprehensive Metabolic & Lipid Panel',
      labName: 'Metropolis Clinical Diagnostic Laboratory',
      doctorName: 'Dr. Sarah Lin, MD',
      reportDate: recentDate,
      originalFilename: 'demo_lab_report_oct2026.pdf',
      filePath: 'uploads/demo_lab_report_oct2026.pdf',
      version: 1,
      status: 'verified',
      isDemo: true,
      rawOcrText: `METROPOLIS CLINICAL DIAGNOSTIC LABORATORY\nPatient: Johnathan Doe | Date: 2026-10-02\nReferred by: Dr. Sarah Lin\n\nFasting Blood Glucose: 108 mg/dL (Ref: 70 - 99)\nHbA1c: 6.2 % (Ref: 4.0 - 5.6)\nHemoglobin: 13.2 g/dL (Ref: 13.0 - 17.5)\nBlood Pressure: 128/82 mmHg (Ref: <120/80)\nTotal Cholesterol: 195 mg/dL (Ref: <200)\nLDL Cholesterol: 116 mg/dL (Ref: <100)\nHDL Cholesterol: 48 mg/dL (Ref: >40)\nTriglycerides: 142 mg/dL (Ref: <150)`
    });

    const v2Values = [
      { metricKey: 'fasting_glucose', metricName: 'Fasting Blood Glucose', value: '108', numericValue: 108, unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', statusIndicator: 'elevated', date: recentDate },
      { metricKey: 'hba1c', metricName: 'HbA1c (Glycated Hemoglobin)', value: '6.2', numericValue: 6.2, unit: '%', referenceRange: '4.0 - 5.6 %', statusIndicator: 'elevated', date: recentDate },
      { metricKey: 'hemoglobin', metricName: 'Hemoglobin (Hb)', value: '13.2', numericValue: 13.2, unit: 'g/dL', referenceRange: '13.0 - 17.5 g/dL', statusIndicator: 'normal', date: recentDate },
      { metricKey: 'blood_pressure', metricName: 'Blood Pressure', value: '128/82', unit: 'mmHg', referenceRange: '< 120/80 mmHg', statusIndicator: 'elevated', date: recentDate },
      { metricKey: 'cholesterol_total', metricName: 'Total Cholesterol', value: '195', numericValue: 195, unit: 'mg/dL', referenceRange: '< 200 mg/dL', statusIndicator: 'normal', date: recentDate },
      { metricKey: 'cholesterol_ldl', metricName: 'LDL Cholesterol', value: '116', numericValue: 116, unit: 'mg/dL', referenceRange: '< 100 mg/dL', statusIndicator: 'elevated', date: recentDate },
      { metricKey: 'cholesterol_hdl', metricName: 'HDL Cholesterol', value: '48', numericValue: 48, unit: 'mg/dL', referenceRange: '> 40 mg/dL', statusIndicator: 'normal', date: recentDate }
    ];

    for (const val of v2Values) {
      db.insert('extracted_health_values', {
        ...val,
        reportId: report2.id,
        userId: userId,
        confidence: 'high',
        verificationStatus: 'confirmed',
        isDemo: true
      });
      db.insert('vitals', {
        ...val,
        sourceReportId: report2.id,
        userId: userId,
        isDemo: true
      });
    }

    // 3. Prescription
    const rx = db.insert('prescriptions', {
      userId: userId,
      doctorName: 'Dr. Sarah Lin, MD',
      clinicName: 'St. Jude Specialty Care Clinic',
      prescriptionDate: recentDate,
      originalFilename: 'demo_prescription_oct2026.png',
      filePath: 'uploads/demo_prescription_oct2026.png',
      status: 'verified',
      isDemo: true,
      confidenceScore: 96,
      rawOcrText: `Dr. Sarah Lin, MD - St. Jude Specialty Care Clinic\nPatient: Johnathan Doe | Date: 2026-10-02\n\n1. Tab. Metformin 500 mg - Twice daily (08:00 AM, 08:00 PM) x 30 days - After food\n2. Tab. Lisinopril 10 mg - Once daily in morning (08:00 AM) x 30 days - With water\n3. Tab. Atorvastatin 20 mg - Once daily at bedtime (09:00 PM) x 30 days - After food`
    });

    // 4. Medicines
    const med1 = db.insert('medicines', {
      userId: userId,
      prescriptionId: rx.id,
      name: 'Metformin',
      dosage: '500 mg',
      frequency: 'Twice daily',
      intakeTimes: ['08:00 AM', '08:00 PM'],
      duration: '30 days',
      instructions: 'Take after meals with water',
      startDate: recentDate,
      endDate: '2026-11-01',
      isActive: true,
      isDemo: true
    });

    const med2 = db.insert('medicines', {
      userId: userId,
      prescriptionId: rx.id,
      name: 'Lisinopril',
      dosage: '10 mg',
      frequency: 'Once daily',
      intakeTimes: ['08:00 AM'],
      duration: '30 days',
      instructions: 'Take in morning with full glass of water',
      startDate: recentDate,
      endDate: '2026-11-01',
      isActive: true,
      isDemo: true
    });

    const med3 = db.insert('medicines', {
      userId: userId,
      prescriptionId: rx.id,
      name: 'Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once daily at bedtime',
      intakeTimes: ['09:00 PM'],
      duration: '30 days',
      instructions: 'Take after dinner before sleep',
      startDate: recentDate,
      endDate: '2026-11-01',
      isActive: true,
      isDemo: true
    });

    // 5. Generate Schedules
    scheduleGenerator.generateScheduleForMedicine(med1);
    scheduleGenerator.generateScheduleForMedicine(med2);
    scheduleGenerator.generateScheduleForMedicine(med3);

    // Mark previous days' doses as taken to demonstrate 92% adherence
    const pastSchedules = db.find('medicine_schedules', s => s.userId === userId && s.scheduledDate < today);
    pastSchedules.forEach((s, idx) => {
      // Intentionally simulate 1 missed dose for authentic adherence calculation
      if (idx === 3) {
        db.update('medicine_schedules', item => item.id === s.id, {
          status: 'missed',
          notes: 'Dose not taken within 4-hour window'
        });
      } else {
        db.update('medicine_schedules', item => item.id === s.id, {
          status: 'taken',
          takenAt: `${s.scheduledDate}T${s.scheduledTime === '08:00 AM' ? '08:04:12' : '20:11:05'}.000Z`
        });
      }
    });

    // Today's schedule status setup:
    // Mark 08:00 AM doses as taken, and 08:00 PM / 09:00 PM as upcoming
    const todaySchedules = db.find('medicine_schedules', s => s.userId === userId && s.scheduledDate === today);
    todaySchedules.forEach(s => {
      if (s.scheduledTime === '08:00 AM') {
        db.update('medicine_schedules', item => item.id === s.id, {
          status: 'taken',
          takenAt: `${today}T08:03:45.000Z`
        });
        db.insert('medicine_adherence_logs', {
          userId: userId,
          scheduleId: s.id,
          medicineId: s.medicineId,
          eventType: 'taken',
          confirmedAt: `${today}T08:03:45.000Z`,
          confirmationSource: 'app'
        });
      } else {
        db.update('medicine_schedules', item => item.id === s.id, {
          status: 'upcoming'
        });
      }
    });

    // 6. CareConnect Sample Session
    db.insert('careconnect_sessions', {
      userId: userId,
      caregiverName: 'Eleanor Doe (Primary Caregiver)',
      scheduledTime: `${today}T08:00:00.000Z`,
      status: 'completed',
      medicineId: med1.id,
      adherenceConfirmed: true,
      notes: 'Morning dose witnessed and confirmed via CareConnect check-in.',
      completedAt: `${today}T08:04:00.000Z`,
      isDemo: true
    });

    // 7. Medical Timeline
    const timelineEntries = [
      {
        userId: userId,
        eventType: 'report_uploaded',
        title: 'Diagnostic Lab Report Uploaded',
        description: 'Comprehensive Health Checkup (Baseline) processed via OCR.',
        metadataJson: { lab: 'Metropolis Diagnostics', reportId: report1.id },
        eventDate: prevDate,
        createdAt: `${prevDate}T09:30:00.000Z`
      },
      {
        userId: userId,
        eventType: 'prescription_added',
        title: 'Prescription Added & Verified',
        description: 'Prescription by Dr. Sarah Lin verified. Generated 3 medications.',
        metadataJson: { doctor: 'Dr. Sarah Lin', rxId: rx.id },
        eventDate: recentDate,
        createdAt: `${recentDate}T10:15:00.000Z`
      },
      {
        userId: userId,
        eventType: 'report_uploaded',
        title: 'Follow-up Metabolic Panel Uploaded',
        description: 'Latest blood test verified: Glucose 108 mg/dL, HbA1c 6.2%.',
        metadataJson: { lab: 'Metropolis Diagnostics', reportId: report2.id },
        eventDate: recentDate,
        createdAt: `${recentDate}T11:00:00.000Z`
      },
      {
        userId: userId,
        eventType: 'careconnect_session',
        title: 'CareConnect Video Check-in Completed',
        description: 'Morning medication check-in completed with Eleanor Doe.',
        metadataJson: { caregiver: 'Eleanor Doe', status: 'confirmed' },
        eventDate: today,
        createdAt: `${today}T08:05:00.000Z`
      },
      {
        userId: userId,
        eventType: 'medication_confirmed',
        title: 'Medication Dose Confirmed',
        description: 'Metformin 500 mg & Lisinopril 10 mg taken successfully.',
        metadataJson: { adherenceScore: '92%' },
        eventDate: today,
        createdAt: `${today}T08:06:00.000Z`
      }
    ];

    for (const t of timelineEntries) {
      db.insert('medical_timeline', { ...t, isDemo: true });
    }

    // 8. Notifications
    const sampleNotifications = [
      {
        userId: userId,
        title: 'Medicine Due: Metformin 500 mg',
        message: 'Scheduled dose at 08:00 PM tonight. Please take with food.',
        type: 'medicine_reminder',
        isDemo: true,
        isRead: false
      },
      {
        userId: userId,
        title: 'Health Trend Alert: Hemoglobin Normalized',
        message: 'Your hemoglobin improved from 12.8 g/dL to 13.2 g/dL into normal reference range.',
        type: 'report_verified',
        isDemo: true,
        isRead: false
      },
      {
        userId: userId,
        title: 'Caregiver Check-in Logged',
        message: 'Eleanor Doe logged morning CareConnect video adherence confirmation.',
        type: 'careconnect_reminder',
        isDemo: true,
        isRead: true
      }
    ];

    for (const n of sampleNotifications) {
      db.insert('notifications', n);
    }

    return {
      success: true,
      message: 'Demo medical dataset successfully populated for user.',
      reportsCreated: 2,
      medicinesCreated: 3,
      vitalsCreated: 14
    };
  }
}

module.exports = new DemoDataService();
