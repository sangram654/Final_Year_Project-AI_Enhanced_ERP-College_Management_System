const express = require('express');
const router = express.Router();
const {
    getMyMeetings,
    getAllTeachers,
    getTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    assignSubjects,
    assignClass,
    getTeachersByDepartment,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// --- STATIC ROUTES PEHLE (Important) ---

router.get('/my-meetings', authorize('teacher'), getMyMeetings);

// 2. Get teachers by department
router.get('/department/:department', getTeachersByDepartment);

// --- ADMIN ONLY ROUTES ---
router.post('/', authorize('admin'), createTeacher);
router.get('/', authorize('admin'), getAllTeachers);
router.delete('/:id', authorize('admin'), deleteTeacher);
router.post('/:id/subjects', authorize('admin'), assignSubjects);
router.post('/:id/classes', authorize('admin'), assignClass);

// --- DYNAMIC ROUTES LAST MEIN ---
router.get('/:id', getTeacher); 
router.put('/:id', authorize('admin', 'teacher'), updateTeacher);

module.exports = router;