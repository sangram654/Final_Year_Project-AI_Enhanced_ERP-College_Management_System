const express = require('express');
const router = express.Router();
const {
    createMeeting,
    getAllMeetings,
    getMyMeetings,
    getMyClassMeetings,
    getUpcomingMeetings,
    getMeeting,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    getMeetingAnalytics
} = require('../controllers/meetingController');

const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// ====================== ROUTES ======================

// Create Meeting (SuperAdmin, Admin, Teacher)
router.post('/', authorize('superadmin', 'admin', 'teacher'), createMeeting);

// Teacher specific routes
router.get('/my-meetings', authorize('teacher'), getMyMeetings);
router.get('/my-class-meetings', authorize('teacher'), getMyClassMeetings);

// Student & Parent routes
router.get('/upcoming', authorize('student', 'parent'), getUpcomingMeetings);

// Admin routes
router.get('/analytics', authorize('admin'), getMeetingAnalytics);
router.get('/', authorize('admin', 'superadmin'), getAllMeetings);   // ← superadmin bhi allow kiya

// Common routes - Ye sabse LAST mein hone chahiye
router.get('/:id', getMeeting);
router.put('/:id', authorize('superadmin', 'admin', 'teacher'), updateMeeting);
router.delete('/:id', authorize('admin', 'teacher'), deleteMeeting);
router.post('/:id/join', joinMeeting);

module.exports = router;