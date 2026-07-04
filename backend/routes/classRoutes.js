const express = require('express');
const router = express.Router();
const {
    getAllClasses,
    getClass,
    createClass,
    updateClass,
    deleteClass,
    getClassStudents,
    syncClassesFromStudents,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Admin: Sync classes from student data (auto-generate)
router.post('/sync-from-students', authorize('admin'), syncClassesFromStudents);

// Get students in a class
router.get('/:id/students', getClassStudents);

// Admin routes
router.route('/')
    .get(getAllClasses)
    .post(authorize('admin'), createClass);

router.route('/:id')
    .get(getClass)
    .put(authorize('admin'), updateClass)
    .delete(authorize('admin'), deleteClass);

module.exports = router;

