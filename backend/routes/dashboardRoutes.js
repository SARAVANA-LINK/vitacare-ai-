const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const scheduleGenerator = require('../services/scheduleGenerator');

// GET /api/dashboard/overview
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.findById('users', userId);
    const profile = db.findOne('user_profiles', p => p.userId === userId);

    // Latest Vitals
    const allVitals = db.find('vitals', v => v.userId === userId);
    allVitals.sort((a, b) => new Date(a.date) - new Date(b.date));

    const latestVitalsMap = {};
    for (const v of allVitals) {
      latestVitalsMap[v.metricKey] = v;
    }
    const latestVitals = Object.values(latestVitalsMap);

    // Today's Medicines
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = db.find('medicine_schedules', s => s.userId === userId && s.scheduledDate === today);
    todaySchedules.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // Next Medicine
    const nextMedicine = scheduleGenerator.getNextMedicine(userId);

    // Adherence
    const adherence = scheduleGenerator.calculateAdherence(userId);

    // Recent Reports
    const reports = db.find('health_reports', r => r.userId === userId);
    reports.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
    const recentReports = reports.slice(0, 4);

    // Recent Timeline Activity
    const timeline = db.find('medical_timeline', t => t.userId === userId);
    timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentActivity = timeline.slice(0, 5);

    // Data-driven Health Status Summary (Section 5: NO unsupported diagnoses)
    const summaryPoints = [];
    if (latestVitals.length === 0 && reports.length === 0) {
      summaryPoints.push('No verified health reports uploaded yet. Upload a report to start tracking.');
    } else {
      const glucose = latestVitalsMap['fasting_glucose'] || latestVitalsMap['glucose'];
      if (glucose) {
        summaryPoints.push(`Fasting Glucose: ${glucose.value} ${glucose.unit} recorded on ${glucose.date} (${glucose.statusIndicator === 'normal' ? 'within reference range' : 'outside standard range'}).`);
      }

      const bp = latestVitalsMap['blood_pressure'];
      if (bp) {
        summaryPoints.push(`Blood Pressure: ${bp.value} ${bp.unit} recorded on ${bp.date}.`);
      }

      const hb = latestVitalsMap['hemoglobin'];
      if (hb) {
        summaryPoints.push(`Hemoglobin: ${hb.value} ${hb.unit} recorded on ${hb.date} (${hb.statusIndicator === 'normal' ? 'standard physiological range' : hb.statusIndicator}).`);
      }

      const spo2 = latestVitalsMap['spo2'];
      if (spo2) {
        summaryPoints.push(`Oxygen Saturation: ${spo2.value} ${spo2.unit} on ${spo2.date}.`);
      }

      if (summaryPoints.length === 0) {
        summaryPoints.push(`${latestVitals.length} individual health parameters recorded and verified.`);
      }
    }

    res.json({
      user: {
        id: user ? user.id : userId,
        name: user ? user.name : 'Patient',
        email: user ? user.email : '',
        bloodGroup: user ? user.bloodGroup : 'O+',
        age: user ? user.age : null,
        emergencyPhone: user ? user.emergencyPhone : ''
      },
      profile: profile || {},
      latestVitals,
      todaySchedules,
      nextMedicine,
      adherence,
      recentReports,
      recentActivity,
      healthStatusSummary: {
        points: summaryPoints,
        disclaimer: 'Summary reflects verified document measurements without clinical diagnosis.'
      }
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: 'Failed to load dashboard: ' + err.message });
  }
});

// GET /api/dashboard/cms-config (Public / Authenticated Dynamic Content Configuration)
router.get('/cms-config', (req, res) => {
  try {
    const modules = db.find('cms_modules').sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const cards = db.find('cms_cards').filter(c => c.isVisible !== false).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const announcements = db.find('cms_announcements').filter(a => a.isPublished !== false).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const contentList = db.find('cms_content');
    const settings = db.findOne('system_settings', s => s.id === 'system-config-1') || {};

    const contentMap = {};
    for (const item of contentList) {
      contentMap[item.key] = item.value;
    }

    const translations = db.find('translations');

    res.json({
      modules,
      cards,
      announcements,
      content: contentMap,
      translations,
      settings: {
        websiteName: settings.websiteName || 'VitaCare AI',
        supportPhone: settings.supportPhone || '+1 (800) 555-VITA',
        supportEmail: settings.supportEmail || 'support@vitacare.ai',
        defaultLanguage: settings.defaultLanguage || 'en',
        careConnectEnabled: settings.careConnectEnabled !== false
      }
    });
  } catch (err) {
    console.error('Failed to load cms-config:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
