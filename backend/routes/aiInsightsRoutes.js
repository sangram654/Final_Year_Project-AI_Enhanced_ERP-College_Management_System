const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { getInsights } = require('../controllers/aiInsightsController');
const { protect, authorize } = require('../middleware/auth');

// Rate limit AI insights — it's an expensive operation
const insightsRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    message: { success: false, message: 'Too many analysis requests. Please wait 5 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   GET /api/ai/insights
// @desc    Run AI-powered ERP analytics (live data + LLM analysis)
// @access  Private — admin and super_admin only
router.get('/insights', protect, authorize('admin', 'super_admin'), insightsRateLimit, getInsights);

module.exports = router;
