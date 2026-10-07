const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
  const notifications = db.find('notifications', n => n.userId === req.user.id);
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = notifications.filter(n => !n.isRead).length;

  res.json({ notifications, unreadCount });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req, res) => {
  db.update('notifications', n => n.id === req.params.id && n.userId === req.user.id, {
    isRead: true
  });
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, (req, res) => {
  db.update('notifications', n => n.userId === req.user.id, {
    isRead: true
  });
  res.json({ success: true });
});

module.exports = router;
