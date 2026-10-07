const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const demoDataService = require('../services/demoDataService');

// POST /api/demo/load-sample (Loads full verified patient history for hackathon demo)
router.post('/load-sample', authenticateToken, (req, res) => {
  try {
    const result = demoDataService.loadDemoData(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Load demo data error:', err);
    res.status(500).json({ error: 'Failed to populate demo data: ' + err.message });
  }
});

// GET /api/demo/samples (Returns ready-to-test text and images for live testing)
router.get('/samples', authenticateToken, (req, res) => {
  const samplePrescriptionText = `Dr. Sarah Lin, MD - St. Jude Specialty Care Clinic
104 Medical Plaza, Suite 400
Date: 2026-10-02
Patient: Johnathan Doe | Age: 48

Rx:
1. Tab. Metformin 500 mg - Twice daily (08:00 AM, 08:00 PM) for 30 days - Take after food
2. Tab. Lisinopril 10 mg - Once daily in morning (08:00 AM) for 30 days - Take with water
3. Tab. Atorvastatin 20 mg - Once daily at bedtime (09:00 PM) for 30 days - Take after food

Instructions: Maintain low-sodium hydration. Follow up in 4 weeks with lipid panel.
Dr. Sarah Lin, MD`;

  const sampleLabReportText = `METROPOLIS CLINICAL DIAGNOSTIC LABORATORY
Accredited Reference Pathology Center
Patient Name: Johnathan Doe   Age: 48   Gender: Male
Ref. Doctor: Dr. Sarah Lin, MD
Date of Collection: 2026-10-02

================================================================================
INVESTIGATION                           RESULT    UNIT      BIOLOGICAL REF RANGE
================================================================================
Fasting Blood Glucose (FBS)             108       mg/dL     70 - 99
HbA1c (Glycated Hemoglobin)             6.2       %         4.0 - 5.6
Hemoglobin (Hb)                         13.2      g/dL      13.0 - 17.5
Blood Pressure                          128/82    mmHg      < 120/80
Heart Rate                              74        bpm       60 - 100
Oxygen Saturation (SpO2)                98        %         95 - 100
Total Cholesterol                       195       mg/dL     < 200
HDL Cholesterol                         48        mg/dL     > 40
LDL Cholesterol                         116       mg/dL     < 100
Triglycerides                           142       mg/dL     < 150
Serum Creatinine                        0.95      mg/dL     0.7 - 1.3
Platelet Count                          245000    /mcL      150,000 - 450,000
================================================================================
Report Status: Verified by Chief Pathologist`;

  res.json({
    samplePrescriptionText,
    sampleLabReportText
  });
});

module.exports = router;
