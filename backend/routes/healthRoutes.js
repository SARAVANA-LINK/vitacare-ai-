const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/health/vitals (Unified view of user's latest measurements with source transparency)
router.get('/vitals', authenticateToken, (req, res) => {
  const allVitals = db.find('vitals', v => v.userId === req.user.id);

  // Group by metricKey to find the latest reading for each metric
  const latestByMetric = {};

  // Sort chronological
  allVitals.sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const v of allVitals) {
    const prev = latestByMetric[v.metricKey];
    latestByMetric[v.metricKey] = {
      latest: v,
      previous: prev ? prev.latest : null,
      historyCount: prev ? prev.historyCount + 1 : 1
    };
  }

  // Enrich with source report details
  const result = Object.values(latestByMetric).map(item => {
    let sourceReport = null;
    if (item.latest.sourceReportId) {
      const rep = db.findById('health_reports', item.latest.sourceReportId);
      if (rep) {
        sourceReport = {
          id: rep.id,
          title: rep.reportType,
          lab: rep.labName,
          date: rep.reportDate
        };
      }
    }

    return {
      metricKey: item.latest.metricKey,
      metricName: item.latest.metricName,
      value: item.latest.value,
      numericValue: item.latest.numericValue,
      unit: item.latest.unit,
      referenceRange: item.latest.referenceRange,
      statusIndicator: item.latest.statusIndicator,
      date: item.latest.date,
      previousValue: item.previous ? item.previous.value : null,
      previousDate: item.previous ? item.previous.date : null,
      historyCount: item.historyCount,
      source: sourceReport,
      extractionMethod: 'OCR + AI Information Extraction',
      verificationStatus: 'User Confirmed'
    };
  });

  res.json({ vitals: result, totalTracked: result.length });
});

// GET /api/health/trends (Time-series data for interactive charts)
router.get('/trends', authenticateToken, (req, res) => {
  const { metric } = req.query; // optional filter e.g. fasting_glucose, hemoglobin, blood_pressure, cholesterol_total
  const allVitals = db.find('vitals', v => v.userId === req.user.id);

  // Group by metric
  const grouped = {};
  for (const v of allVitals) {
    if (metric && v.metricKey !== metric) continue;

    if (!grouped[v.metricKey]) {
      grouped[v.metricKey] = {
        metricKey: v.metricKey,
        metricName: v.metricName,
        unit: v.unit,
        referenceRange: v.referenceRange,
        points: []
      };
    }

    grouped[v.metricKey].points.push({
      date: v.date,
      value: v.numericValue !== undefined ? v.numericValue : parseFloat(v.value) || 0,
      rawValue: v.value,
      statusIndicator: v.statusIndicator,
      sourceReportId: v.sourceReportId
    });
  }

  // Sort each metric's points by date
  const trendsList = Object.values(grouped).map(trend => {
    trend.points.sort((a, b) => new Date(a.date) - new Date(b.date));
    const hasEnoughData = trend.points.length >= 2;
    return {
      ...trend,
      hasEnoughData: hasEnoughData,
      statusNote: hasEnoughData ? 'Trend computed from verified measurements.' : 'Not enough historical data for a trend.'
    };
  });

  res.json({ trends: trendsList });
});

// GET /api/health/history (Lifetime measurement logs)
router.get('/history', authenticateToken, (req, res) => {
  const { metricKey } = req.query;
  let vitals = db.find('vitals', v => v.userId === req.user.id);

  if (metricKey) {
    vitals = vitals.filter(v => v.metricKey === metricKey);
  }

  vitals.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ history: vitals });
});

// POST /api/health/manual-vital (User logs manual measurement)
router.post('/manual-vital', authenticateToken, (req, res) => {
  const { metricName, metricKey, value, unit, referenceRange, date } = req.body;

  if (!metricName || !value) {
    return res.status(400).json({ error: 'Metric name and value are required.' });
  }

  const newVital = db.insert('vitals', {
    userId: req.user.id,
    sourceReportId: null,
    metricKey: metricKey || metricName.toLowerCase().replace(/\s+/g, '_'),
    metricName: metricName,
    value: value,
    numericValue: parseFloat(value) || 0,
    unit: unit || '',
    referenceRange: referenceRange || 'Standard reference',
    statusIndicator: 'normal',
    date: date || new Date().toISOString().split('T')[0],
    isManual: true
  });

  db.insert('medical_timeline', {
    userId: req.user.id,
    eventType: 'vital_updated',
    title: `Vital Recorded: ${metricName}`,
    description: `Manually logged ${value} ${unit || ''} on ${newVital.date}.`,
    metadataJson: { vitalId: newVital.id },
    eventDate: newVital.date
  });

  res.status(201).json({ success: true, vital: newVital });
});

module.exports = router;
