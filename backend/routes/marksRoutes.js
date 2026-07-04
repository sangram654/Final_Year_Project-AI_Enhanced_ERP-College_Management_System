const express = require('express');
const router = express.Router();
const {
    enterMarks,
    getStudentMarks,
    getClassMarks,
    getStudentBacklogs,
    registerBacklogExam,
    updateBacklogAttempt,
    getBacklogAnalytics,
    getPerformanceAnalytics,
    bulkEnterMarks,
    getMarksByFilter,
} = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Teacher routes
router.post('/', authorize('teacher', 'admin'), enterMarks);
router.post('/bulk', authorize('teacher', 'admin'), bulkEnterMarks);

// Get marks by filter (for teacher marks entry page)
router.get('/', authorize('teacher', 'admin'), getMarksByFilter);

// Teacher and Admin routes
router.get('/class', authorize('teacher', 'admin'), getClassMarks);
router.get('/analytics', authorize('teacher', 'admin'), getPerformanceAnalytics);
router.put('/backlogs/:id/attempt', authorize('admin'), updateBacklogAttempt);
router.get('/backlogs/analytics', authorize('admin'), getBacklogAnalytics);

// Student can view own and register for backlog
router.get('/student/:studentId', getStudentMarks);
router.get('/backlogs/:studentId', getStudentBacklogs);
router.post('/backlogs/:id/register', authorize('student'), registerBacklogExam);

module.exports = router;

