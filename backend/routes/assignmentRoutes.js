const express = require('express');
const router = express.Router();
const {
    createAssignment,
    getTeacherAssignments,
    getStudentAssignments,
    getAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissions,
    gradeSubmission,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Teacher routes
router.post('/', authorize('teacher'), uploadMiddleware('assignmentFile'), createAssignment);
router.get('/teacher', authorize('teacher'), getTeacherAssignments);
router.delete('/:id', authorize('teacher'), deleteAssignment);
router.get('/:id/submissions', authorize('teacher'), getSubmissions);
router.put('/submissions/:id/grade', authorize('teacher'), gradeSubmission);

// Student routes
router.get('/student', authorize('student'), getStudentAssignments);
router.post('/:id/submit', authorize('student'), uploadMiddleware('submissionFile'), submitAssignment);

// Common routes
router.get('/:id', getAssignment);

module.exports = router;
