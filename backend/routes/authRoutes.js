const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');
const smsService = require('../services/smsService');

// POST /api/auth/register (User Registration with Guardian Details)
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      age, 
      gender, 
      bloodGroup, 
      emergencyPhone, 
      preferredLanguage = 'en',
      guardianName,
      guardianPhone,
      guardianRelationship = 'Parent / Primary Guardian'
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = db.insert('users', {
      email: email.toLowerCase(),
      passwordHash: passwordHash,
      name: name.trim(),
      role: 'patient',
      age: age ? parseInt(age, 10) : null,
      gender: gender || 'Unspecified',
      bloodGroup: bloodGroup || 'O+',
      preferredLanguage: preferredLanguage || 'en',
      emergencyPhone: emergencyPhone || ''
    });

    db.insert('user_profiles', {
      userId: user.id,
      allergies: [],
      chronicConditions: [],
      heightCm: null,
      weightKg: null,
      preferredLanguage: preferredLanguage || 'en',
      primaryPhysician: ''
    });

    // Save Guardian contact if provided
    let createdGuardian = null;
    if (guardianName && guardianPhone) {
      createdGuardian = db.insert('guardians', {
        userId: user.id,
        name: guardianName.trim(),
        relationship: guardianRelationship || 'Parent / Primary Guardian',
        phoneNumber: guardianPhone.trim(),
        email: '',
        allowMedicationEscalation: true,
        allowEmergencyNotification: true,
        allowCareConnectAccess: true,
        allowHealthView: true
      });

      // Dispatch welcome SMS to guardian
      try {
        await smsService.sendGuardianSms({
          userId: user.id,
          eventType: 'login_alert',
          customMessage: `VitaCare AI Notice: ${name} has designated you as their registered healthcare guardian. Emergency & adherence notifications are active.`
        });
      } catch (smsErr) {
        console.warn('Initial guardian SMS notice log warning:', smsErr.message);
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        preferredLanguage: user.preferredLanguage,
        emergencyPhone: user.emergencyPhone
      },
      guardian: createdGuardian
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const guardians = db.find('guardians', g => g.userId === user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'patient',
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        preferredLanguage: user.preferredLanguage || 'en',
        emergencyPhone: user.emergencyPhone
      },
      guardian: guardians[0] || null
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/admin-login (Secure Admin Portal Login)
router.post('/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and password are required.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    // Auto-promote recognized evaluation account if necessary
    if (user.email === 'admin@vitacare.ai' || user.email === 'saravanakumar.s16072007@gmail.com') {
      if (user.role !== 'admin') {
        db.update('users', u => u.id === user.id, { role: 'admin' });
        user.role = 'admin';
      }
    }

    // Strict Admin Authorization Check
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        error: `Access denied. The account (${user.email}) is a Patient account, not an Administrator. Please use administrator credentials (admin@vitacare.ai) or sign in to the User Portal.` 
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        preferredLanguage: user.preferredLanguage || 'en'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error during admin authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = db.findById('users', req.user.id);
  const profile = db.findOne('user_profiles', p => p.userId === req.user.id);
  const guardians = db.find('guardians', g => g.userId === req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'patient',
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      preferredLanguage: user.preferredLanguage || 'en',
      emergencyPhone: user.emergencyPhone
    },
    profile: profile || {},
    guardian: guardians[0] || null
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req, res) => {
  const { allergies, chronicConditions, heightCm, weightKg, primaryPhysician, preferredLanguage, emergencyPhone } = req.body;

  if (preferredLanguage || emergencyPhone) {
    db.update('users', u => u.id === req.user.id, {
      preferredLanguage: preferredLanguage || undefined,
      emergencyPhone: emergencyPhone || undefined
    });
  }

  const updated = db.update('user_profiles', p => p.userId === req.user.id, {
    allergies: allergies !== undefined ? allergies : undefined,
    chronicConditions: chronicConditions !== undefined ? chronicConditions : undefined,
    heightCm: heightCm !== undefined ? heightCm : undefined,
    weightKg: weightKg !== undefined ? weightKg : undefined,
    preferredLanguage: preferredLanguage || undefined,
    primaryPhysician: primaryPhysician !== undefined ? primaryPhysician : undefined
  });

  const refreshedUser = db.findById('users', req.user.id);

  res.json({
    user: {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      role: refreshedUser.role || 'patient',
      preferredLanguage: refreshedUser.preferredLanguage || 'en'
    },
    profile: updated[0] || {}
  });
});

// PUT /api/auth/language (Dedicated Language Preference Persistence)
router.put('/language', authenticateToken, (req, res) => {
  const { language } = req.body;
  if (!language) return res.status(400).json({ error: 'Language code required.' });

  db.update('users', u => u.id === req.user.id, { preferredLanguage: language });
  db.update('user_profiles', p => p.userId === req.user.id, { preferredLanguage: language });

  const updatedUser = db.findById('users', req.user.id);
  const userSafe = updatedUser ? { ...updatedUser } : { id: req.user.id, preferredLanguage: language };
  delete userSafe.passwordHash;

  res.json({ success: true, preferredLanguage: language, user: userSafe });
});

module.exports = router;
