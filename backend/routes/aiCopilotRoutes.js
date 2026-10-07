const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const aiCopilotService = require('../services/aiCopilotService');

// POST /api/ai/chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, mode = 'simple', preferred_language, language } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const requestedLang = preferred_language || language || req.user.preferredLanguage || 'en';
    const response = await aiCopilotService.generateResponse(req.user.id, message.trim(), mode, requestedLang);

    res.json({
      success: true,
      reply: response.reply,
      mode: response.mode,
      language: requestedLang,
      preferred_language: requestedLang,
      userDataCitations: response.userDataCitations || [],
      contextUsed: response.contextUsed || {},
      hasEmergencyWarning: response.hasEmergencyWarning || false,
      disclaimer: response.disclaimer
    });
  } catch (err) {
    console.error('AI Copilot error:', err);
    res.status(500).json({ error: 'Failed to generate copilot response: ' + err.message });
  }
});

// GET /api/ai/history
router.get('/history', authenticateToken, (req, res) => {
  const history = db.find('ai_conversations', c => c.userId === req.user.id);
  // Sort chronological
  history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json({ history: history.slice(-50) });
});

// DELETE /api/ai/history
router.delete('/history', authenticateToken, (req, res) => {
  db.delete('ai_conversations', c => c.userId === req.user.id);
  res.json({ success: true, message: 'Conversation history cleared.' });
});

module.exports = router;
