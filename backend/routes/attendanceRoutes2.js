const express = require('express');
const router = express.Router();
const attendanceController2 = require('../controllers/attendanceController2');
const Attendance2 = require('../models/Attendance2');
const { protect, authorize } = require('../middleware/auth');

// 🔥 ESP32 yaha hit karega Attendance mark karne ke liye
// Endpoint: POST /api/attendance2/mark
router.post('/mark', attendanceController2.saveBiometricAttendance);

// ESP32 ke liye command lene ka route
router.get('/getCommand', attendanceController2.getCommand);

// Website ke liye command set karne ka route
router.post('/setCommand', attendanceController2.setCommand);

// 🔥 ESP32 yaha hit karega Device Status update karne ke liye (Jaise: "Sensor Ready", "Place Finger")
// Endpoint: POST /api/attendance2/status
router.post('/status', attendanceController2.updateDeviceStatus);

// Get shift-wise biometric attendance report
router.get('/shift-report', protect, attendanceController2.getShiftAttendanceReport);

// @desc    Dashboard ya Student page ke liye saari biometric attendance fetch karna
// @route   GET /api/attendance2
router.get('/', async (req, res) => {
    try {
        // Latest 50 records dikhane ke liye
        const data = await Attendance2.find()
            .sort({ time: -1 })
            .limit(50);
            
        res.json(data);
    } catch (err) {
        console.error("Error fetching biometric data:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
});

// @desc    Specific user ki attendance history dekhne ke liye (Optional)
router.get('/user/:userId', async (req, res) => {
    try {
        const data = await Attendance2.find({ user: req.params.userId })
            .sort({ time: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;