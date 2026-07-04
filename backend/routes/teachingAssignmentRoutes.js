const express = require('express');
const router = express.Router();
const {
    getMyAssignments,
    getAssignmentStudents,
    getAllAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignment,
} = require('../controllers/teachingAssignmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Teacher-specific routes
router.get('/my-assignments', authorize('teacher'), getMyAssignments);
router.get('/:id/students', authorize('teacher'), getAssignmentStudents);

// Admin routes
router.route('/')
    .get(authorize('admin'), getAllAssignments)
    .post(authorize('admin'), createAssignment);

router.route('/:id')
    .get(authorize('admin', 'teacher'), getAssignment)
    .put(authorize('admin'), updateAssignment)
    .delete(authorize('admin'), deleteAssignment);

module.exports = router;
