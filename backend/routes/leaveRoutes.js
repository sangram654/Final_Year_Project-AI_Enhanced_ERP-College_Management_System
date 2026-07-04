const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    getPendingLeaves,
    reviewLeave,
    cancelLeave,
    getLeaveAnalytics,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Student, Teacher, Admin, and Super Admin can apply
router.post('/', authorize('student', 'teacher', 'admin', 'super_admin'), uploadMiddleware('multipleDocuments'), applyLeave);
router.get('/my-leaves', getMyLeaves);
router.put('/:id/cancel', cancelLeave);

// Leave review routes for Teacher/Admin/Super Admin
router.get('/', authorize('teacher', 'admin', 'super_admin'), getAllLeaves);
router.get('/pending', authorize('teacher', 'admin', 'super_admin'), getPendingLeaves);
router.put('/:id/review', authorize('teacher', 'admin', 'super_admin'), reviewLeave);
router.get('/analytics', authorize('admin', 'super_admin'), getLeaveAnalytics);

module.exports = router;
