const Attendance = require('../models/Attendance');
const Attendance2 = require('../models/Attendance2');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const TeachingAssignment = require('../models/TeachingAssignment');
const Class = require('../models/Class');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAttendanceActivity } = require('../utils/activityLogger');
const { exec } = require('child_process');
const path = require('path');

// @desc    Mark attendance using Teaching Assignment
// @route   POST /api/attendance/mark
// @access  Private (Teacher)
const markAttendance = asyncHandler(async (req, res) => {
    // STEP 3: req.body se studentId extract kiya
    const { assignmentId, date, studentId, status, remarks, lectureNumber = 1 } = req.body;

    // Validate teaching assignment
    const assignment = await TeachingAssignment.findById(assignmentId)
        .populate('subjectId')
        .populate('classId');

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Teaching assignment not found',
        });
    }

    // Verify teacher profile
    const teacher = await require('../models/Teacher').findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    // Verify authorization
    if (assignment.teacherId.toString() !== teacher._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to mark attendance for this class',
        });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found',
        });
    }

    // STEP 3: Attendance.create ka use karke save kiya
    const attendance = await Attendance.create({
        student: studentId,
        subject: assignment.subjectId._id,
        teacher: teacher._id,
        teachingAssignment: assignment._id,
        date: new Date(date),
        status: status || 'Present',
        lectureNumber,
        remarks: remarks || '',
        semester: assignment.classId.semester,
        department: assignment.classId.department,
        section: assignment.classId.section,
    });

    // Resolve student user for activity logging & notifications
    const studentUser = await require('../models/User').findById(student.user);
    if (studentUser) {
        await logAttendanceActivity(req.app.get('socketio'), studentUser, status || 'Present', 'Manual');

        // Create notification for absent student
        if (status === 'Absent') {
            await Notification.create({
                recipient: studentUser._id,
                recipientRole: 'student',
                title: 'Attendance Marked Absent',
                message: `You were marked absent for ${assignment.subjectId.name} on ${new Date(date).toLocaleDateString()}`,
                type: 'attendance',
            });
        }
    }

    res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance,
    });
});

// @desc    Get attendance by class and date
// @route   GET /api/attendance/class
// @access  Private (Teacher, Admin)
const getClassAttendance = asyncHandler(async (req, res) => {
    const { department, semester, section, subjectId, date } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section;
    if (subjectId) query.subject = subjectId;
    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .populate('subject', 'name code')
        .sort({ 'student.rollNumber': 1 });

    res.json({
        success: true,
        count: attendance.length,
        data: attendance,
    });
});

// @desc    Get student attendance
// @route   GET /api/attendance/student/:studentId
// @access  Private
const getStudentAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { subjectId, startDate, endDate, month } = req.query;

    const query = { student: studentId };

    if (subjectId) query.subject = subjectId;

    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    } else if (month) {
        const [year, monthNum] = month.split('-');
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59);
        query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
        .populate('subject', 'name code')
        .sort({ date: -1 });

    const summary = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        late: attendance.filter(a => a.status === 'Late').length,
        leave: attendance.filter(a => a.status === 'Leave').length,
    };
    summary.percentage = summary.total > 0
        ? Math.round(((summary.present + summary.late) / summary.total) * 100)
        : 0;

    res.json({
        success: true,
        data: attendance,
        summary,
    });
});

// @desc    Get attendance summary by subject
// @route   GET /api/attendance/summary/:studentId
// @access  Private
const getAttendanceSummary = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { month } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found',
        });
    }

    const matchQuery = { student: student._id };
    if (month) {
        const [year, monthNum] = month.split('-');
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59);
        matchQuery.date = { $gte: start, $lte: end };
    }

    const summary = await Attendance.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$subject',
                total: { $sum: 1 },
                present: {
                    $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] },
                },
                absent: {
                    $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
                },
                late: {
                    $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
                },
            },
        },
        {
            $lookup: {
                from: 'subjects',
                localField: '_id',
                foreignField: '_id',
                as: 'subject',
            },
        },
        { $unwind: '$subject' },
        {
            $project: {
                subject: { name: 1, code: 1 },
                total: 1,
                present: 1,
                absent: 1,
                late: 1,
                percentage: {
                    $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2],
                },
            },
        },
    ]);

    const overall = summary.reduce(
        (acc, curr) => ({
            total: acc.total + curr.total,
            present: acc.present + curr.present,
            absent: acc.absent + curr.absent,
            late: acc.late + curr.late,
        }),
        { total: 0, present: 0, absent: 0, late: 0 }
    );

    const overallPercentage = overall.total > 0
        ? Math.round((overall.present / overall.total) * 100)
        : 0;

    res.json({
        success: true,
        data: {
            subjects: summary,
            overall: {
                ...overall,
                percentage: overallPercentage,
            },
        },
    });
});

// @desc    Get attendance analytics
// @route   GET /api/attendance/analytics
// @access  Private (Admin, Teacher)
const getAttendanceAnalytics = asyncHandler(async (req, res) => {
    const { department, semester, month } = req.query;

    const matchQuery = {};
    if (department) matchQuery.department = department;
    if (semester) matchQuery.semester = parseInt(semester);

    if (month) {
        const [year, monthNum] = month.split('-');
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59);
        matchQuery.date = { $gte: start, $lte: end };
    }

    const dailyTrend = await Attendance.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                total: { $sum: 1 },
                present: {
                    $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] },
                },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: '$_id',
                total: 1,
                present: 1,
                percentage: {
                    $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2],
                },
            },
        },
    ]);

    const departmentWise = await Attendance.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$department',
                total: { $sum: 1 },
                present: {
                    $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                department: '$_id',
                total: 1,
                present: 1,
                percentage: {
                    $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2],
                },
            },
        },
    ]);

    res.json({
        success: true,
        data: {
            dailyTrend,
            departmentWise,
        },
    });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Teacher, Admin)
const updateAttendance = asyncHandler(async (req, res) => {
    const { status, remarks } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
        return res.status(404).json({
            success: false,
            message: 'Attendance record not found',
        });
    }

    if (status) attendance.status = status;
    if (remarks) attendance.remarks = remarks;

    await attendance.save();

    res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: attendance,
    });
});

const getUploadedFileUrl = (filePath) => {
    if (!filePath) return null;
    const normalized = filePath.replace(/\\/g, '/');
    const uploadsIndex = normalized.lastIndexOf('/uploads/');
    if (uploadsIndex === -1) {
        const uploadsToken = '/uploads';
        const tokenIndex = normalized.lastIndexOf(uploadsToken);
        if (tokenIndex !== -1) return normalized.slice(tokenIndex);
        return null;
    }
    return normalized.slice(uploadsIndex);
};

// @desc    Self mark attendance for student (Fingerprint)
const selfMarkAttendance = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const subject = await Subject.findOne();
    const teacherObj = await require('../models/Teacher').findOne();

    if (!subject || !teacherObj) {
        return res.status(400).json({ success: false, message: 'System setup incomplete' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
        { student: student._id, subject: subject._id, date: today, lectureNumber: 1 },
        {
            student: student._id,
            subject: subject._id,
            teacher: teacherObj._id,
            date: today,
            status: 'Present',
            lectureNumber: 1,
            remarks: 'Self Marked via Fingerprint',
            verificationMode: 'Fingerprint',
            semester: student.semester || 1,
            department: student.department || 'General',
            section: student.section || 'A',
        },
        { upsert: true, new: true }
    );

    await logAttendanceActivity(req.app.get('socketio'), req.user, 'Present', 'Fingerprint (Self)');

    res.status(201).json({ success: true, message: 'Attendance marked via Fingerprint!', data: attendance });
});

// @desc    Self mark attendance using face capture
const selfMarkFaceAttendance = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Face capture required' });

    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const subject = await Subject.findOne();
    const teacherObj = await require('../models/Teacher').findOne();
    if (!subject || !teacherObj) return res.status(400).json({ success: false, message: 'Setup incomplete' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fileUrl = getUploadedFileUrl(req.file.path);

    const attendance = await Attendance.findOneAndUpdate(
        { student: student._id, subject: subject._id, date: today, lectureNumber: 1 },
        {
            student: student._id,
            subject: subject._id,
            teacher: teacherObj._id,
            date: today,
            status: 'Present',
            lectureNumber: 1,
            remarks: 'Self Marked via Face Detection',
            verificationMode: 'Face',
            faceCapture: { imageUrl: fileUrl, capturedAt: new Date(), detector: req.body.detector || 'browser-face-detector' },
            semester: student.semester || 1,
            department: student.department || 'General',
            section: student.section || 'A',
        },
        { upsert: true, new: true }
    );

    await logAttendanceActivity(req.app.get('socketio'), req.user, 'Present', 'Face (Self)');

    res.status(201).json({ success: true, message: 'Attendance marked via Face!', data: attendance });
});

// 🔥 DEVICE ATTENDANCE (ESP32 / Fingerprint)
// @desc    Mark attendance via external hardware device
// @route   POST /api/attendance/device-mark
// @access  Private
const deviceMarkAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.body;
    console.log("📡 Device Attendance Hit:", studentId);
    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "Student ID is required"
        });
    }

    const student = await Student.findById(studentId);

    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found"
        });
    }

    // Dummy subject & teacher (basic system ke liye)
    const subject = await Subject.findOne();
    const teacher = await require('../models/Teacher').findOne();

    if (!subject || !teacher) {
        return res.status(400).json({
        success: false,
        message: "Subject or Teacher not configured"
        });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
        {
            student: student._id,
            subject: subject?._id,
            date: today,
            lectureNumber: 1
        },
        {
            student: student._id,
            subject: subject?._id,
            teacher: teacher?._id,
            date: today,
            status: 'Present',
            lectureNumber: 1,
            remarks: 'Marked via Fingerprint Device',
            verificationMode: 'Fingerprint',
            semester: student.semester || 1,
            department: student.department || 'General',
            section: student.section || 'A',
        },
        { upsert: true, new: true }
    );

    const studentUser = await require('../models/User').findById(student.user);
    if (studentUser) {
        await logAttendanceActivity(req.app.get('socketio'), studentUser, 'Present', 'Fingerprint Device');
    }

    res.status(201).json({
        success: true,
        message: "Attendance marked via Device",
        data: attendance
    });
});

// @desc    Detect fingerprint sensor device
const getFingerprintSensorStatus = asyncHandler(async (req, res) => {
    const usbServiceUrl = process.env.USB_SENSOR_SERVICE_URL || 'http://127.0.0.1:5005/api/usb-status';
    const checkUsbServiceCommand = `powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing '${usbServiceUrl}' -TimeoutSec 3).StatusCode"`;

    return exec(checkUsbServiceCommand, { timeout: 5000 }, (svcErr) => {
        if (!svcErr) {
            const readUsbServiceCommand = `powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing '${usbServiceUrl}' -TimeoutSec 3).Content"`;
            return exec(readUsbServiceCommand, { timeout: 5000 }, (readErr, readStdout) => {
                if (!readErr && readStdout) {
                    try {
                        const payload = JSON.parse(readStdout);
                        const connected = !!payload.connected;
                        return res.json({
                            success: true,
                            data: {
                                connected,
                                mode: 'usb-service',
                                message: connected ? 'USB/sensor device connected' : 'Sensor not detected',
                                deviceName: payload.device_name || null,
                                deviceCount: payload.device_count || 0,
                            },
                        });
                    } catch (e) { /* fall through */ }
                }
                return runBuiltInDetection(res);
            });
        }
        runBuiltInDetection(res);
    });
});

function runBuiltInDetection(res) {
    const command = `python -c "import wmi; c=wmi.WMI(); devices=c.Win32_USBControllerDevice(); print('\\n'.join([str(d.Dependent) for d in devices]))"`;
    exec(command, { timeout: 8000 }, (error, stdout) => {
        if (error) {
            const psCommand = `$usb = Get-PnpDevice -PresentOnly | Where-Object { $_.Class -in @('USB','HIDClass','Biometric') }; $usb | Select-Object -ExpandProperty FriendlyName`;
            return exec(`powershell -NoProfile -Command "${psCommand}"`, (psErr, psStdout) => {
                const connected = (psStdout || '').toLowerCase().includes('finger') || (psStdout || '').toLowerCase().includes('biometric');
                return res.json({ success: true, data: { connected, mode: 'powershell', message: connected ? 'Sensor connected' : 'Not detected' } });
            });
        }
        const output = (stdout || '').toLowerCase();
        const connected = ['finger', 'biometric', 'validity', 'synaptics', 'goodix'].some(k => output.includes(k));
        return res.json({ success: true, data: { connected, mode: 'wmi', message: connected ? 'Sensor connected' : 'Not detected' } });
    });
}

// Added function
const getAllAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.find()
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName role' }
        })
        .sort({ date: -1 })
        .limit(50);

    res.json({
        success: true,
        data: attendance
    });
});

// @desc    Update hardware device status via Socket.io
// @route   POST /api/attendance/device-status
const updateDeviceStatus = asyncHandler(async (req, res) => {
    const { message } = req.body;
    console.log("📟 Device Status:", message);

    const io = req.app.get('socketio');
    if (io) {
        io.emit('device-status-update', {
            text: message,
            timestamp: new Date().toLocaleTimeString()
        });
    }
    res.status(200).json({ success: true });
});

// 🔥 DEVICE MARK ATTENDANCE V2 (Aapke Attendance2 model ke liye)
const deviceMarkAttendanceV2 = asyncHandler(async (req, res) => {
    const { student_id } = req.body; // ESP32 se student_id aayega
    const io = req.app.get('socketio');

    if (!student_id) {
        return res.status(400).json({ success: false, message: "ID is required" });
    }

    const attendance = new Attendance2({
        user: String(student_id),
        deviceId: "ESP32_SAMARTH",
        time: new Date()
    });

    await attendance.save();

    // Resolve user (student/teacher/admin) from student_id (enrollId) for activity logging
    const foundUser = await require('../models/User').findOne({ enrollId: Number(student_id) });
    if (foundUser) {
        await logAttendanceActivity(io, foundUser, 'Present', 'Biometric V2');
    }

    if (io) {
        io.emit('new-biometric-attendance', {
            user: student_id,
            time: new Date().toLocaleTimeString()
        });
    }

    res.json({ success: true, message: "Attendance Marked" });
});

module.exports = {
    markAttendance,
    getClassAttendance,
    getStudentAttendance,
    getAttendanceSummary,
    getAttendanceAnalytics,
    updateAttendance,
    selfMarkAttendance,
    selfMarkFaceAttendance,
    deviceMarkAttendance,
    getFingerprintSensorStatus,
    getAllAttendance,
    updateDeviceStatus,
    deviceMarkAttendanceV2
};