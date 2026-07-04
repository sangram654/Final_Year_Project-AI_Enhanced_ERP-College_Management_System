const Parent = require('../models/Parent');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const { Fee } = require('../models/Fee');
const LeaveApplication = require('../models/LeaveApplication');
const { asyncHandler } = require('../middleware/errorHandler');

const hasParentAccessToStudent = (parent, studentId) =>
    parent.students.some(id => id.toString() === studentId);

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private (Admin)
const getAllParents = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const parents = await Parent.find({ isActive: true })
        .populate('user', 'firstName lastName email phone')
        .populate({
            path: 'students',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Parent.countDocuments({ isActive: true });

    res.json({
        success: true,
        data: parents,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Create parent profile
// @route   POST /api/parents
// @access  Private (Admin)
const createParent = asyncHandler(async (req, res) => {
    const {
        email, password, firstName, lastName, phone,
        relation, occupation, annualIncome, studentIds,
    } = req.body;

    // Generate password if not provided
    // Default pattern: parent@phone (e.g., parent@9876543210)
    const generatedPassword = password || `parent@${phone || '123456'}`;

    // Create user first
    const user = await User.create({
        email,
        password: generatedPassword,
        role: 'parent',
        firstName,
        lastName,
        phone,
    });

    // Create parent profile
    const parent = await Parent.create({
        user: user._id,
        relation,
        occupation,
        annualIncome,
        students: studentIds || [],
    });

    // Link parent to user
    user.parentProfile = parent._id;
    await user.save();

    // Link parent to students
    if (studentIds && studentIds.length > 0) {
        await Student.updateMany(
            { _id: { $in: studentIds } },
            { parentGuardian: parent._id }
        );
    }

    res.status(201).json({
        success: true,
        message: 'Parent created successfully',
        data: parent,
        credentials: {
            email: email,
            password: generatedPassword,
            note: 'Please share these credentials with the parent. They should change their password after first login.'
        }
    });
});

// @desc    Get parent profile
// @route   GET /api/parents/:id
// @access  Private
const getParent = asyncHandler(async (req, res) => {
    const parent = await Parent.findById(req.params.id)
        .populate('user', 'firstName lastName email phone address')
        .populate({
            path: 'students',
            populate: { path: 'user', select: 'firstName lastName email' },
        });

    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent not found',
        });
    }

    res.json({
        success: true,
        data: parent,
    });
});

// @desc    Get parent's ward(s) dashboard data
// @route   GET /api/parents/ward-dashboard
// @access  Private (Parent)
const getWardDashboard = asyncHandler(async (req, res) => {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent profile not found',
        });
    }

    if (parent.students.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'No students linked to this parent account',
        });
    }

    const wardsData = [];

    for (const studentId of parent.students) {
        const student = await Student.findById(studentId).populate('user', 'firstName lastName');
        if (!student) continue;

        // Get attendance summary
        const attendanceData = await Attendance.aggregate([
            { $match: { student: student._id } },
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

        const attendanceSummary = attendanceData[0] || { total: 0, present: 0 };
        attendanceSummary.percentage = attendanceSummary.total > 0
            ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
            : 0;

        // Get recent attendance
        const recentAttendance = await Attendance.find({ student: student._id })
            .populate('subject', 'name code')
            .sort({ date: -1 })
            .limit(5);

        // Get fee summary
        const fees = await Fee.find({ student: student._id });
        const feeSummary = fees.reduce(
            (acc, fee) => ({
                total: acc.total + fee.totalAmount,
                paid: acc.paid + fee.paidAmount,
                due: acc.due + fee.dueAmount,
            }),
            { total: 0, paid: 0, due: 0 }
        );

        // Get recent marks
        const recentMarks = await Marks.find({ student: student._id })
            .populate('subject', 'name code')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get pending leave applications
        const pendingLeaves = await LeaveApplication.find({
            student: student._id,
            status: 'Pending',
        });

        wardsData.push({
            student: {
                id: student._id,
                name: `${student.user.firstName} ${student.user.lastName}`,
                rollNumber: student.rollNumber,
                department: student.department,
                semester: student.semester,
            },
            attendance: {
                summary: attendanceSummary,
                recent: recentAttendance,
            },
            fees: feeSummary,
            marks: recentMarks,
            pendingLeaves: pendingLeaves.length,
        });
    }

    res.json({
        success: true,
        data: wardsData,
    });
});

// @desc    Get ward's detailed attendance
// @route   GET /api/parents/ward/:studentId/attendance
// @access  Private (Parent)
const getWardAttendance = asyncHandler(async (req, res) => {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent profile not found',
        });
    }

    // Check if student belongs to this parent
    if (!hasParentAccessToStudent(parent, req.params.studentId)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this student data',
        });
    }

    const { month } = req.query;
    const query = { student: req.params.studentId };

    if (month) {
        const [year, monthNum] = month.split('-');
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59);
        query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
        .populate('subject', 'name code')
        .sort({ date: -1 });

    res.json({
        success: true,
        data: attendance,
    });
});

// @desc    Get ward's fee details
// @route   GET /api/parents/ward/:studentId/fees
// @access  Private (Parent)
const getWardFees = asyncHandler(async (req, res) => {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent profile not found',
        });
    }

    if (!hasParentAccessToStudent(parent, req.params.studentId)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this student data',
        });
    }

    const fees = await Fee.find({ student: req.params.studentId })
        .populate('feeStructure')
        .populate('payments')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: fees,
    });
});

// @desc    Get ward's marks
// @route   GET /api/parents/ward/:studentId/marks
// @access  Private (Parent)
const getWardMarks = asyncHandler(async (req, res) => {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent profile not found',
        });
    }

    if (!hasParentAccessToStudent(parent, req.params.studentId)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this student data',
        });
    }

    const marks = await Marks.find({ student: req.params.studentId })
        .populate('subject', 'name code credits')
        .sort({ academicYear: -1, examType: 1 });

    res.json({
        success: true,
        data: marks,
    });
});

// @desc    Get ward's leave applications
// @route   GET /api/parents/ward/:studentId/leaves
// @access  Private (Parent)
const getWardLeaves = asyncHandler(async (req, res) => {
    const parent = await Parent.findOne({ user: req.user.id });
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent profile not found',
        });
    }

    if (!hasParentAccessToStudent(parent, req.params.studentId)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this student data',
        });
    }

    const leaves = await LeaveApplication.find({ student: req.params.studentId })
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
        rejected: leaves.filter(l => l.status === 'Rejected').length,
        totalDays: leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.numberOfDays, 0),
    };

    res.json({
        success: true,
        data: leaves,
        summary,
    });
});


// @desc    Update parent profile
// @route   PUT /api/parents/:id
// @access  Private (Admin, Parent-own)
const updateParent = asyncHandler(async (req, res) => {
    let parent = await Parent.findById(req.params.id);

    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent not found',
        });
    }

    // Check authorization
    if (req.user.role === 'parent' && parent.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this profile',
        });
    }

    const allowedUpdates = ['relation', 'occupation', 'annualIncome'];

    // Admin can update more fields
    if (req.user.role === 'admin') {
        allowedUpdates.push('students', 'isActive');
    }

    // Update Parent model fields
    const parentUpdates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            parentUpdates[key] = req.body[key];
        }
    }

    // Update User model fields (admin only)
    if (req.user.role === 'admin') {
        const userUpdates = {};
        const allowedUserUpdates = ['firstName', 'lastName', 'phone'];

        for (const key of allowedUserUpdates) {
            if (req.body[key] !== undefined) {
                userUpdates[key] = req.body[key];
            }
        }

        // Update User if there are user fields to update
        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(parent.user, userUpdates, {
                new: true,
                runValidators: true,
            });
        }
    }

    // Update Parent model
    parent = await Parent.findByIdAndUpdate(req.params.id, parentUpdates, {
        new: true,
        runValidators: true,
    }).populate('user', 'firstName lastName email phone');

    res.json({
        success: true,
        message: 'Parent updated successfully',
        data: parent,
    });
});

// @desc    Link student to parent
// @route   POST /api/parents/:id/link-student
// @access  Private (Admin)
const linkStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.body;

    const parent = await Parent.findById(req.params.id);
    if (!parent) {
        return res.status(404).json({
            success: false,
            message: 'Parent not found',
        });
    }

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found',
        });
    }

    if (!parent.students.includes(studentId)) {
        parent.students.push(studentId);
        await parent.save();
    }

    student.parentGuardian = parent._id;
    await student.save();

    res.json({
        success: true,
        message: 'Student linked to parent successfully',
        data: parent,
    });
});

module.exports = {
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
};
