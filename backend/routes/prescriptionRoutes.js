const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const ocrService = require('../services/ocrService');
const extractionService = require('../services/extractionService');
const scheduleGenerator = require('../services/scheduleGenerator');

// Configure Multer storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `rx-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/prescriptions/upload (File or Base64 camera capture)
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    let filePath = '';
    let originalName = 'prescription_capture.png';
    let mimeType = 'image/png';

    if (req.file) {
      filePath = req.file.path;
      originalName = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
      // Process camera capture base64
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 camera image payload.' });
      }
      mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `rx-cam-${Date.now()}.png`;
      filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      originalName = 'camera_capture_prescription.png';
    } else if (req.body.sampleText) {
      // Direct sample/demo text processing
      const filename = `rx-sample-${Date.now()}.txt`;
      filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.body.sampleText);
      originalName = 'sample_prescription.txt';
      mimeType = 'text/plain';
    } else {
      return res.status(400).json({ error: 'Please upload a prescription file or capture a photo.' });
    }

    // Step 1: Run OCR Text Extraction
    let ocrResult = { text: '', confidence: 85 };
    if (mimeType === 'text/plain') {
      ocrResult.text = fs.readFileSync(filePath, 'utf-8');
      ocrResult.confidence = 98;
    } else {
      try {
        ocrResult = await ocrService.extractText(filePath, mimeType);
      } catch (ocrErr) {
        console.warn('OCR engine failed, using fallback parser:', ocrErr.message);
        // If OCR on blank/unsupported file fails, provide actionable error
        return res.status(422).json({
          error: 'Unable to process this document. Please upload a clearer image or PDF with legible handwriting/printed text.'
        });
      }
    }

    // Step 2: Run AI Medical Entity Extraction
    const extractedData = extractionService.extractPrescription(ocrResult.text);

    // Save temporary prescription draft
    const draftRx = {
      tempId: `draft-${Date.now()}`,
      userId: req.user.id,
      filePath: path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/'),
      originalFilename: originalName,
      rawOcrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      doctorName: extractedData.doctorName,
      clinicName: extractedData.clinicName,
      prescriptionDate: extractedData.prescriptionDate,
      medicines: extractedData.medicines,
      extractionStatus: extractedData.extractionStatus
    };

    res.json({
      success: true,
      draft: draftRx,
      message: 'Prescription processed. Please review and verify extracted medications before saving.'
    });
  } catch (err) {
    console.error('Prescription processing error:', err);
    res.status(500).json({ error: 'Failed to process prescription: ' + err.message });
  }
});

// POST /api/prescriptions/verify (User confirms/edits extracted medicines)
router.post('/verify', authenticateToken, (req, res) => {
  try {
    const {
      doctorName,
      clinicName,
      prescriptionDate,
      originalFilename,
      filePath,
      rawOcrText,
      medicines = []
    } = req.body;

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ error: 'Prescription must contain at least one verified medicine.' });
    }

    // Save permanent verified prescription
    const savedRx = db.insert('prescriptions', {
      userId: req.user.id,
      doctorName: doctorName || 'Physician',
      clinicName: clinicName || 'Medical Clinic',
      prescriptionDate: prescriptionDate || new Date().toISOString().split('T')[0],
      originalFilename: originalFilename || 'prescription.pdf',
      filePath: filePath || '',
      rawOcrText: rawOcrText || '',
      status: 'verified',
      confidenceScore: 95
    });

    // Auto-create medicines in database
    const createdMedicines = [];
    const createdSchedules = [];

    for (const med of medicines) {
      const newMed = db.insert('medicines', {
        userId: req.user.id,
        prescriptionId: savedRx.id,
        name: med.medicineName,
        dosage: med.dosage || 'Standard dose',
        frequency: med.frequency || 'Once daily',
        intakeTimes: Array.isArray(med.intakeTimes) && med.intakeTimes.length > 0 ? med.intakeTimes : ['08:00 AM'],
        duration: med.duration || '7 days',
        instructions: med.instructions || 'After meals',
        startDate: prescriptionDate || new Date().toISOString().split('T')[0],
        isActive: true
      });

      createdMedicines.push(newMed);

      // Automatically generate daily schedules for this medicine
      const schedules = scheduleGenerator.generateScheduleForMedicine(newMed);
      createdSchedules.push(...schedules);
    }

    // Add to Medical Timeline
    db.insert('medical_timeline', {
      userId: req.user.id,
      eventType: 'prescription_added',
      title: `Prescription Verified (${createdMedicines.length} Medicines)`,
      description: `Prescribed by ${savedRx.doctorName} at ${savedRx.clinicName}. Generated ${createdSchedules.length} scheduled doses.`,
      metadataJson: { prescriptionId: savedRx.id, medicineCount: createdMedicines.length },
      eventDate: savedRx.prescriptionDate
    });

    // Add notification
    db.insert('notifications', {
      userId: req.user.id,
      title: 'Prescription Verified & Schedules Created',
      message: `Successfully scheduled ${createdMedicines.length} medications from Dr. ${savedRx.doctorName}.`,
      type: 'report_verified',
      isDemo: false,
      isRead: false
    });

    res.status(201).json({
      success: true,
      prescription: savedRx,
      medicines: createdMedicines,
      schedulesGenerated: createdSchedules.length,
      message: 'Prescription verified and active medication schedules generated.'
    });
  } catch (err) {
    console.error('Prescription verification error:', err);
    res.status(500).json({ error: 'Failed to verify prescription: ' + err.message });
  }
});

// GET /api/prescriptions (List user's prescriptions with isolation)
router.get('/', authenticateToken, (req, res) => {
  const list = db.find('prescriptions', r => r.userId === req.user.id);
  res.json({ prescriptions: list });
});

// GET /api/prescriptions/:id
router.get('/:id', authenticateToken, (req, res) => {
  const rx = db.findOne('prescriptions', r => r.id === req.params.id && r.userId === req.user.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found.' });

  const meds = db.find('medicines', m => m.prescriptionId === rx.id && m.userId === req.user.id);
  res.json({ prescription: rx, medicines: meds });
});

module.exports = router;
