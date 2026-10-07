const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded medical documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users/profile', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/timeline', require('./routes/timelineRoutes'));
app.use('/api/careconnect', require('./routes/careconnectRoutes'));
app.use('/api/guardians', require('./routes/guardianRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/ai', require('./routes/aiCopilotRoutes'));
app.use('/api/demo', require('./routes/demoRoutes'));

// Public system branding & configuration endpoint (No auth required)
app.get('/api/settings/public', (req, res) => {
  const db = require('./db');
  let settings = db.findOne('system_settings', s => s.id === 'system-config-1');
  if (!settings) {
    settings = {
      websiteName: 'VitaCare AI',
      logoUrl: '',
      defaultLanguage: 'en',
      supportPhone: '+1 (800) 555-VITA',
      supportEmail: 'support@vitacare.ai',
      careConnectEnabled: true
    };
  }
  res.json({
    websiteName: settings.websiteName || 'VitaCare AI',
    logoUrl: settings.logoUrl || '',
    defaultLanguage: settings.defaultLanguage || 'en',
    supportPhone: settings.supportPhone || '+1 (800) 555-VITA',
    supportEmail: settings.supportEmail || 'support@vitacare.ai',
    careConnectEnabled: settings.careConnectEnabled ?? true
  });
});

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'online',
    system: 'VitaCare AI Backend',
    tagline: 'Your Health. Organized. Intelligent. Connected.',
    timestamp: new Date().toISOString()
  });
});

// Download Complete Project Archive
const fs = require('fs');
app.get(['/download', '/download-project', '/api/download/project'], (req, res) => {
  const zipPath = path.join(__dirname, 'uploads', 'vitacare-ai-complete.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="vitacare-ai-complete.zip"');
    return res.download(zipPath, 'vitacare-ai-complete.zip');
  }
  res.status(404).json({ error: 'Project archive not found.' });
});

// Serve frontend static build on Render production deployment
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/download')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload received.' });
  }
  console.error(`Unhandled server error [${req.method} ${req.originalUrl || req.url}]:`, err.stack || err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`VitaCare AI Server running on http://localhost:${PORT}`);
});
