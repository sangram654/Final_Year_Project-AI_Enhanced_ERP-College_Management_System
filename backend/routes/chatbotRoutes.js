const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { sendChatMessage } = require('../controllers/chatbotController');
const { protect, optionalAuth } = require('../middleware/auth');

// Rate limiting — prevent abuse
const chatbotRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 15,
    message: { success: false, message: 'Too many requests. Please wait a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    message: { success: false, message: 'Rate limit exceeded. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(strictRateLimit);
router.use(chatbotRateLimit);

// Use optionalAuth: if user is logged in they get full agent capabilities,
// unauthenticated users still get general Q&A (no tool access)
// @route   POST /api/chatbot/chat
router.post('/chat', optionalAuth, sendChatMessage);

module.exports = router;