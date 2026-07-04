const express = require('express');
const router = express.Router();
const {
    getAllParents,
    createParent,
    getParent,
    updateParent,
    getWardDashboard,
    getWardAttendance,
    getWardFees,
    getWardMarks,
    getWardLeaves,
    linkStudent,
} = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Parent routes
router.get('/ward-dashboard', authorize('parent'), getWardDashboard);
router.get('/ward/:studentId/attendance', authorize('parent'), getWardAttendance);
router.get('/ward/:studentId/fees', authorize('parent'), getWardFees);
router.get('/ward/:studentId/marks', authorize('parent'), getWardMarks);
router.get('/ward/:studentId/leaves', authorize('parent'), getWardLeaves);

// Admin only routes
router.get('/', authorize('admin'), getAllParents);
router.post('/', authorize('admin'), createParent);
router.get('/:id', authorize('admin', 'parent'), getParent);
router.put('/:id', authorize('admin', 'parent'), updateParent);
router.post('/:id/link-student', authorize('admin'), linkStudent);

module.exports = router;
