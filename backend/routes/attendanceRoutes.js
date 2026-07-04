const express = require('express');
const router = express.Router();

const {
    markAttendance,
    getClassAttendance,
    getStudentAttendance,
    getAttendanceSummary,
    getAttendanceAnalytics,
    updateAttendance,
    selfMarkAttendance,
    selfMarkFaceAttendance,
    getFingerprintSensorStatus,
    deviceMarkAttendance,
    getAllAttendance, // 🔥 ADD THIS
} = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');


// 🔥 DEVICE ROUTE (ESP32 / Fingerprint - NO AUTH)
router.post('/device-mark', deviceMarkAttendance);


// 🔐 All routes below protected
router.use(protect);


// ================= TEACHER ROUTES =================
router.post('/mark', authorize('teacher'), markAttendance);
router.put('/:id', authorize('teacher', 'admin'), updateAttendance);


// ================= STUDENT ROUTES =================
router.post('/self-mark', authorize('student'), selfMarkAttendance);

router.post(
    '/self-mark-face',
    authorize('student'),
    uploadMiddleware('faceCapture'),
    selfMarkFaceAttendance
);

router.get(
    '/sensor-status',
    authorize('student'),
    getFingerprintSensorStatus
);


// ================= TEACHER + ADMIN =================
router.get(
    '/class',
    authorize('teacher', 'admin'),
    getClassAttendance
);

router.get(
    '/analytics',
    authorize('teacher', 'admin'),
    getAttendanceAnalytics
);


// ================= COMMON =================
router.get('/all', authorize('admin','super_admin'), getAllAttendance);
router.get('/student/:studentId', getStudentAttendance);
router.get('/summary/:studentId', getAttendanceSummary);


module.exports = router;