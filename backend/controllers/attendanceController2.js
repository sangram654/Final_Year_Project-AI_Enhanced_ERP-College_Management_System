// controllers/attendanceController2.js
const Attendance2 = require('../models/Attendance2');
const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent');
// Global variable command store karne ke liye
let deviceCommand = { mode: "ATTENDANCE", enrollId: null };

// 1. Ye function Website par "Status" dikhane ke liye hai
exports.updateDeviceStatus = async (req, res) => {
    try {
        const { message } = req.body;
        const io = req.app.get('socketio');
        
        if (io) {
            io.emit('device-status-update', { 
                text: message, 
                timestamp: new Date().toLocaleTimeString() 
            });
            console.log("📟 Device Status Updated:", message);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 1. Device Status Update (Socket.io ke liye)
exports.updateDeviceStatus = async (req, res) => {
    try {
        const { message } = req.body;
        const io = req.app.get('socketio');
        if (io) {
            io.emit('device-status-update', { 
                text: message, 
                timestamp: new Date().toLocaleTimeString() 
            });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Attendance Save Karne ka Logic
exports.saveBiometricAttendance = async (req, res) => {
    try {
        const { user, deviceId, status, time } = req.body;
        
        const scanTime = time ? new Date(time) : new Date();
        const m = scanTime.getHours() * 60 + scanTime.getMinutes();
        
        let determinedDeviceId = deviceId;
        
        // Determine the device ID dynamically based on the scan time:
        if (!determinedDeviceId) {
            if (m >= 990) { // 4:30 PM (990 mins) or later -> Gate OUT Attendance
                determinedDeviceId = "MAIN_GATE";
            } else if (m < 600) { // Before 10:00 AM -> Gate IN Attendance
                determinedDeviceId = "MAIN_GATE";
            } else { // Shift Attendance
                determinedDeviceId = "ESP32_STATION";
            }
        }
        
        // Note: Model ka naam wahi use karein jo upar import kiya hai
        const newAttendance = new Attendance2({
            user: user,
            deviceId: determinedDeviceId,
            status: status || "Present",
            time: scanTime
        });
        await newAttendance.save();

        const io = req.app.get('socketio');

        // Resolve user by enrollId (user parameter from biometric scanner) and log the activity
        try {
            const foundUser = await User.findOne({ enrollId: Number(user) });
            if (foundUser) {
                const { logAttendanceActivity } = require('../utils/activityLogger');
                await logAttendanceActivity(io, foundUser, status || "Present", determinedDeviceId || "Biometric Device");
            } else {
                console.log(`⚠️ User with enrollId: ${user} not found in database for activity logging.`);
            }
        } catch (logErr) {
            console.error("❌ Error logging activity for biometric attendance:", logErr);
        }

        if (io) {
            io.emit('new-biometric-attendance', newAttendance);
        }

        console.log(`✅ Attendance Saved in DB for User: ${user} at time ${scanTime.toLocaleTimeString()} with deviceId: ${determinedDeviceId}`);
        res.status(201).json({ success: true, data: newAttendance });
    } catch (error) {
        console.error("❌ DB Save Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. ESP32 isse check karega (GET /api/attendance2/getCommand)
exports.getCommand = async (req, res) => {
    res.status(200).json(deviceCommand);
};

// 4. Website isse command set karegi (POST /api/attendance2/setCommand)
exports.setCommand = async (req, res) => {
    try {
        const { mode, enrollId } = req.body;
        deviceCommand = { mode, enrollId };
        console.log("🆕 New Command Received:", deviceCommand);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to calculate minutes since midnight in local time
const getMinutesSinceMidnight = (date) => {
    return date.getHours() * 60 + date.getMinutes();
};

// 5. Get shift-wise biometric attendance report
exports.getShiftAttendanceReport = async (req, res) => {
    try {
        const { date, department, semester } = req.query;

        // Parse query date (default to today)
        const queryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const userRole = req.user.role;
        let finalDepartment = department;

        if (userRole === 'admin' || userRole === 'teacher') {
            const userWithProfile = await User.findById(req.user._id || req.user.id).populate('teacherProfile');
            if (userWithProfile && userWithProfile.teacherProfile) {
                finalDepartment = userWithProfile.teacherProfile.department;
            }
        }

        // Fetch students matching department and semester filters
        const studentQuery = {};
        if (userRole === 'student') {
            studentQuery.user = req.user._id || req.user.id;
        } else if (userRole === 'parent') {
            const parent = await Parent.findOne({ user: req.user._id || req.user.id });
            studentQuery._id = { $in: parent ? parent.students : [] };
        } else {
            if (finalDepartment) studentQuery.department = finalDepartment;
            if (semester) studentQuery.semester = parseInt(semester);
        }

        const students = await Student.find(studentQuery).populate('user');

        let peopleToReport = [];

        students.forEach(s => {
            if (s.user) {
                peopleToReport.push({
                    id: s._id,
                    rollNumber: s.rollNumber,
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                    enrollId: s.user.enrollId
                });
            }
        });

        // Add non-student user profiles based on userRole
        if (userRole === 'teacher') {
            const selfUser = await User.findById(req.user._id || req.user.id);
            if (selfUser) {
                peopleToReport.push({
                    id: selfUser._id,
                    rollNumber: 'Teacher',
                    firstName: selfUser.firstName,
                    lastName: selfUser.lastName,
                    enrollId: selfUser.enrollId
                });
            }
        } else if (userRole === 'admin') {
            const teachers = await User.find({ role: 'teacher' });
            teachers.forEach(t => {
                peopleToReport.push({
                    id: t._id,
                    rollNumber: 'Teacher',
                    firstName: t.firstName,
                    lastName: t.lastName,
                    enrollId: t.enrollId
                });
            });
            const admins = await User.find({ role: 'admin' });
            admins.forEach(a => {
                peopleToReport.push({
                    id: a._id,
                    rollNumber: 'Admin',
                    firstName: a.firstName,
                    lastName: a.lastName,
                    enrollId: a.enrollId
                });
            });
        } else if (userRole === 'super_admin') {
            const nonStudents = await User.find({ role: { $in: ['teacher', 'admin', 'super_admin'] } });
            nonStudents.forEach(u => {
                peopleToReport.push({
                    id: u._id,
                    rollNumber: u.role === 'teacher' ? 'Teacher' : u.role === 'admin' ? 'Admin' : 'Super Admin',
                    firstName: u.firstName,
                    lastName: u.lastName,
                    enrollId: u.enrollId
                });
            });
        }

        // Fetch biometric logs for the specified day
        const logs = await Attendance2.find({
            time: { $gte: startOfDay, $lte: endOfDay }
        });

        // Today comparison flags
        const isToday = new Date().toDateString() === queryDate.toDateString();
        const now = new Date();
        const currentMinutes = getMinutesSinceMidnight(now);

        const report = peopleToReport.map(student => {
            const enrollId = student.enrollId;
            
            // Default response structure if no enroll ID
            if (!enrollId) {
                return {
                    studentId: student.id,
                    rollNumber: student.rollNumber,
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    enrollId: null,
                    gateIn: null,
                    gateOut: null,
                    shift1: { checkIn: null, status: 'Absent', remark: 'No Enroll ID' },
                    shift2: { checkIn: null, status: 'Absent', remark: 'No Enroll ID' },
                    shift3: { checkIn: null, status: 'Absent', remark: 'No Enroll ID' },
                    summary: 'Absent (No ID)'
                };
            }

            // Filter logs for this student
            const studentLogs = logs.filter(log => log.user === String(enrollId));
            
            // 1. Gate IN: scan between 9:00 AM and 10:00 AM (540 to 600)
            const gateInLog = studentLogs.find(log => {
                const m = getMinutesSinceMidnight(new Date(log.time));
                return m >= 540 && m <= 600;
            });
            const gateIn = gateInLog ? new Date(gateInLog.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

            // 2. Gate OUT: scan >= 4:30 PM (990)
            const gateOutLog = studentLogs.find(log => {
                const m = getMinutesSinceMidnight(new Date(log.time));
                return m >= 990;
            });
            const gateOut = gateOutLog ? new Date(gateOutLog.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

            // 3. Shift 1: scan between 9:30 AM and 11:30 AM (570 to 690)
            const s1Check = studentLogs.find(log => {
                const m = getMinutesSinceMidnight(new Date(log.time));
                return m >= 570 && m <= 690;
            });

            // 4. Shift 2: scan between 11:45 AM and 1:45 PM (705 to 825)
            const s2Check = studentLogs.find(log => {
                const m = getMinutesSinceMidnight(new Date(log.time));
                return m >= 705 && m <= 825;
            });

            // 5. Shift 3: scan between 2:30 PM and 4:30 PM (870 to 990)
            const s3Check = studentLogs.find(log => {
                const m = getMinutesSinceMidnight(new Date(log.time));
                return m >= 870 && m <= 990;
            });

            const hasGateIn = !!gateInLog;
            const hasGateOut = !!gateOutLog;

            // Helper to compute individual shift status
            const computeShiftStatus = (classCheck, shiftEndMin) => {
                const checkInTime = classCheck ? new Date(classCheck.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
                const hasClassCheck = !!classCheck;

                let status = 'Absent';
                // If future date, marked Absent
                const isFuture = startOfDay > new Date();
                if (isFuture) {
                    return { checkIn: null, status: 'Absent' };
                }

                // If class check exists, mark Present directly for easy real-time testing
                status = hasClassCheck ? 'Present' : 'Absent';

                return { checkIn: checkInTime, status };
            };

            const shift1 = computeShiftStatus(s1Check, 690);
            const shift2 = computeShiftStatus(s2Check, 825);
            const shift3 = computeShiftStatus(s3Check, 990);

            // Compute overall summary
            const presentShifts = [shift1.status, shift2.status, shift3.status].filter(s => s === 'Present').length;
            let summary = 'Absent';
            if (presentShifts === 3) {
                summary = 'Fully Present';
            } else if (presentShifts > 0) {
                summary = `Partially Present (${presentShifts}/3)`;
            }

            return {
                studentId: student.id,
                rollNumber: student.rollNumber,
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                enrollId,
                gateIn,
                gateOut,
                shift1,
                shift2,
                shift3,
                summary
            };
        });

        // Query caller's raw biometric scans if enrollId is assigned
        let personalLogs = [];
        if (req.user && req.user.enrollId) {
            personalLogs = await Attendance2.find({
                user: String(req.user.enrollId),
                time: { $gte: startOfDay, $lte: endOfDay }
            }).sort({ time: 1 });
        }

        res.status(200).json({ 
            success: true, 
            data: report, 
            personalLogs: personalLogs.map(log => ({
                id: log._id,
                enrollId: log.user,
                deviceId: log.deviceId,
                time: log.time,
                status: log.status
            }))
        });
    } catch (error) {
        console.error("❌ Shift report calculation failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 6. Get logged in student's biometric attendance history
exports.getMyBiometricAttendance = async (req, res) => {
    try {
        const enrollId = req.user.enrollId;
        if (!enrollId) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Fetch all logs of this user
        const logs = await Attendance2.find({ user: String(enrollId) }).sort({ time: -1 });

        // Map logs to format expected by StudentAttendance.js
        const mappedLogs = logs.map(log => {
            return {
                _id: log._id,
                time: log.time,
                deviceId: log.deviceId,
                enrollId: log.user,
                status: log.status || 'Present'
            };
        });

        res.status(200).json({ success: true, data: mappedLogs });
    } catch (error) {
        console.error("Error fetching my biometric attendance:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};