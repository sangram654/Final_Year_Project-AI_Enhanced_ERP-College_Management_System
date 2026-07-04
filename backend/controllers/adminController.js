const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { Fee } = require('../models/Fee');
const Payment = require('../models/Payment');
const { Scholarship, ScholarshipApplication } = require('../models/Scholarship');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');


// adminMeetings.js mein create function check karo
const createMeeting = asyncHandler(async (req, res) => {
    const { title, scheduledDate, host, subject } = req.body;

    // Yahan 'host' wo ID honi chahiye jo Admin ne dropdown se select ki hai
    const meeting = await VirtualMeeting.create({
        title,
        scheduledDate,
        host: host, // Ye Teacher ki ID honi chahiye, Admin ki nahi!
        createdBy: req.user._id, // Ye Admin/Super-Admin ki ID hogi
        isActive: true
    });

    res.status(201).json({ success: true, data: meeting });
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
    // User counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalTeachers = await Teacher.countDocuments({ isActive: true });
    const totalParents = await Parent.countDocuments({ isActive: true });

    // Fee collection stats
    const feeStats = await Fee.aggregate([
        {
            $group: {
                _id: null,
                totalFees: { $sum: '$totalAmount' },
                collected: { $sum: '$paidAmount' },
                pending: { $sum: '$dueAmount' },
            },
        },
    ]);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.aggregate([
        {
            $match: {
                date: { $gte: today, $lt: tomorrow },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                present: {
                    $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] },
                },
            },
        },
    ]);

    // Pending items
    const pendingLeaves = await require('../models/LeaveApplication').countDocuments({ status: 'Pending' });
    const pendingScholarships = await ScholarshipApplication.countDocuments({ status: 'Pending' });

    // Department-wise student distribution
    const departmentDistribution = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$department',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
    ]);

    // Recent activities
    const recentPayments = await Payment.find()
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .sort({ createdAt: -1 })
        .limit(5);

    const recentRegistrations = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email role createdAt');

    res.json({
        success: true,
        data: {
            counts: {
                students: totalStudents,
                teachers: totalTeachers,
                parents: totalParents,
            },
            fees: feeStats[0] || { totalFees: 0, collected: 0, pending: 0 },
            attendance: {
                today: todayAttendance[0] || { total: 0, present: 0 },
                percentage: todayAttendance[0]
                    ? Math.round((todayAttendance[0].present / todayAttendance[0].total) * 100)
                    : 0,
            },
            pending: {
                leaves: pendingLeaves,
                scholarships: pendingScholarships,
            },
            departmentDistribution,
            recent: {
                payments: recentPayments,
                registrations: recentRegistrations,
            },
        },
    });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
        success: true,
        data: users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    user.isActive = isActive;
    await user.save();

    // Update corresponding profile
    if (user.studentProfile) {
        await Student.findByIdAndUpdate(user.studentProfile, { isActive });
    } else if (user.teacherProfile) {
        await Teacher.findByIdAndUpdate(user.teacherProfile, { isActive });
    } else if (user.parentProfile) {
        await Parent.findByIdAndUpdate(user.parentProfile, { isActive });
    }

    res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
    });
});

// @desc    Create subject
// @route   POST /api/admin/subjects
// @access  Private (Admin)
const createSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject,
    });
});

// @desc    Get all subjects
// @route   GET /api/admin/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
    const { department, semester, isActive } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const subjects = await Subject.find(query)
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .sort({ semester: 1, code: 1 });

    res.json({
        success: true,
        data: subjects,
    });
});

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
// @access  Private (Admin)
const updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found',
        });
    }

    res.json({
        success: true,
        message: 'Subject updated successfully',
        data: subject,
    });
});

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
// @access  Private (Admin)
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found',
        });
    }

    subject.isActive = false;
    await subject.save();

    res.json({
        success: true,
        message: 'Subject deactivated successfully',
    });
});

// @desc    Send notification
// @route   POST /api/admin/notifications
// @access  Private (Admin)
const sendNotification = asyncHandler(async (req, res) => {
    const { recipients, recipientRole, title, message, type } = req.body;

    const notifications = [];

    if (recipientRole) {
        // Send to all users of a role
        const users = await User.find({ role: recipientRole, isActive: true });
        for (const user of users) {
            notifications.push({
                recipient: user._id,
                recipientRole,
                title,
                message,
                type: type || 'general',
                sender: req.user.id,
            });
        }
    } else if (recipients && recipients.length > 0) {
        // Send to specific users
        for (const recipientId of recipients) {
            const user = await User.findById(recipientId);
            if (user) {
                notifications.push({
                    recipient: recipientId,
                    recipientRole: user.role,
                    title,
                    message,
                    type: type || 'general',
                    sender: req.user.id,
                });
            }
        }
    }

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    res.status(201).json({
        success: true,
        message: `Notification sent to ${notifications.length} recipients`,
    });
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = asyncHandler(async (req, res) => {
    const { type, startDate, endDate } = req.query;

    let report = {};

    switch (type) {
        case 'attendance':
            report = await Attendance.aggregate([
                {
                    $match: startDate && endDate ? {
                        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    } : {},
                },
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
            ]);
            break;

        case 'fees':
            report = await Payment.aggregate([
                {
                    $match: startDate && endDate ? {
                        paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    } : {},
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
            break;

        case 'enrollment':
            report = await Student.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: { department: '$department', semester: '$semester' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.department': 1, '_id.semester': 1 } },
            ]);
            break;

        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid report type',
            });
    }

    res.json({
        success: true,
        data: report,
    });
});

// @desc    Bulk assign fees
// @route   POST /api/admin/fees/bulk-assign
// @access  Private (Admin)
const bulkAssignFees = asyncHandler(async (req, res) => {
    const { feeStructureId, department, semester } = req.body;

    const { FeeStructure } = require('../models/Fee');
    const structure = await FeeStructure.findById(feeStructureId);
    if (!structure) {
        return res.status(404).json({
            success: false,
            message: 'Fee structure not found',
        });
    }

    const query = { isActive: true };
    if (department && department !== 'All') query.department = department;
    if (semester) query.semester = semester;

    const students = await Student.find(query);

    let assigned = 0;
    for (const student of students) {
        const existingFee = await Fee.findOne({
            student: student._id,
            feeStructure: feeStructureId,
            academicYear: structure.academicYear,
        });

        if (!existingFee) {
            await Fee.create({
                student: student._id,
                feeStructure: feeStructureId,
                academicYear: structure.academicYear,
                semester: student.semester,
                totalAmount: structure.totalAmount,
                dueAmount: structure.totalAmount,
                dueDate: structure.dueDate,
            });
            assigned++;
        }
    }

    res.json({
        success: true,
        message: `Fee assigned to ${assigned} students`,
    });
});

module.exports = {
    createMeeting,
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
    sendNotification,
    getReports,
    bulkAssignFees,
};
