const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/timeline (List chronological health timeline events)
router.get('/', authenticateToken, (req, res) => {
  const { type, limit } = req.query;
  let events = db.find('medical_timeline', t => t.userId === req.user.id);

  if (type && type !== 'all') {
    events = events.filter(t => t.eventType === type);
  }

  // Sort descending by eventDate / createdAt
  events.sort((a, b) => new Date(b.createdAt || b.eventDate) - new Date(a.createdAt || a.eventDate));

  if (limit) {
    events = events.slice(0, parseInt(limit, 10));
  }

  res.json({ timeline: events });
});

module.exports = router;
