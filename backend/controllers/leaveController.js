const LeaveApplication = require('../models/LeaveApplication');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Apply for leave
// @route   POST /api/leave
// @access  Private (Student, Teacher)
const applyLeave = asyncHandler(async (req, res) => {
    const { leaveType, fromDate, toDate, reason } = req.body;

    let applicantType, profile;

    if (req.user.role === 'student') {
        applicantType = 'Student';
        profile = await Student.findOne({ user: req.user.id });
    } else if (req.user.role === 'teacher') {
        applicantType = 'Teacher';
        profile = await Teacher.findOne({ user: req.user.id });
    } else if (req.user.role === 'admin') {
        applicantType = 'Admin';
    } else if (req.user.role === 'super_admin') {
        applicantType = 'SuperAdmin';
    } else {
        return res.status(403).json({
            success: false,
            message: 'Only authorized roles can apply for leave',
        });
    }

    if (!profile && (req.user.role === 'student' || req.user.role === 'teacher')) {
        return res.status(404).json({
            success: false,
            message: 'Profile not found',
        });
    }

    // Get documents from request
    const documents = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            documents.push({
                name: file.originalname,
                url: `/uploads/documents/${file.filename}`,
            });
        }
    }

    const leaveData = {
        applicant: req.user.id,
        applicantType,
        leaveType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason,
        documents,
    };

    if (applicantType === 'Student') {
        leaveData.student = profile._id;
    } else if (applicantType === 'Teacher') {
        leaveData.teacher = profile._id;
        // Teacher leave requires only Admin + Super Admin approvals
        leaveData.approvalFlow = {
            teacher: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Not required for teacher leave',
            },
        };
    } else if (applicantType === 'Admin') {
        // Admin leave requires only Super Admin approval
        leaveData.approvalFlow = {
            teacher: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Not required for admin leave',
            },
            admin: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Not required for admin leave',
            },
        };
    } else if (applicantType === 'SuperAdmin') {
        // Super Admin leave is auto-approved
        leaveData.status = 'Approved';
        leaveData.approvalFlow = {
            teacher: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Not required',
            },
            admin: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Not required',
            },
            superAdmin: {
                status: 'Approved',
                reviewDate: new Date(),
                remarks: 'Self-approved by Super Admin',
            },
        };
    }

    const leave = await LeaveApplication.create(leaveData);

    res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave,
    });
});

// @desc    Get my leave applications
// @route   GET /api/leave/my-leaves
// @access  Private
const getMyLeaves = asyncHandler(async (req, res) => {
    const { status, year } = req.query;

    const query = { applicant: req.user.id };
    if (status) query.status = status;

    if (year) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        query.fromDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const leaves = await LeaveApplication.find(query)
        .populate('reviewedBy', 'firstName lastName')
        .populate('approvalFlow.teacher.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.admin.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.superAdmin.reviewedBy', 'firstName lastName')
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

// @desc    Get all leave applications
// @route   GET /api/leave
// @access  Private (Admin)
const getAllLeaves = asyncHandler(async (req, res) => {
    const { status, applicantType, department, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (applicantType) query.applicantType = applicantType;
    if (req.user.role === 'teacher') query.applicantType = 'Student';

    const leaves = await LeaveApplication.find(query)
        .populate('applicant', 'firstName lastName email role')
        .populate('student', 'rollNumber department semester')
        .populate('teacher', 'employeeId department designation')
        .populate('reviewedBy', 'firstName lastName')
        .populate('approvalFlow.teacher.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.admin.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.superAdmin.reviewedBy', 'firstName lastName')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await LeaveApplication.countDocuments(query);

    res.json({
        success: true,
        data: leaves,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get pending leave applications
// @route   GET /api/leave/pending
// @access  Private (Admin)
const getPendingLeaves = asyncHandler(async (req, res) => {
    const roleToFlowKey = {
        teacher: 'teacher',
        admin: 'admin',
        super_admin: 'superAdmin',
    };

    const flowKey = roleToFlowKey[req.user.role];
    if (!flowKey) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view pending leaves',
        });
    }

    const query = {
        status: 'Pending',
        [`approvalFlow.${flowKey}.status`]: 'Pending',
    };

    // Teachers should review only student leave applications
    if (req.user.role === 'teacher') {
        query.applicantType = 'Student';
    }

    const leaves = await LeaveApplication.find(query)
        .populate('applicant', 'firstName lastName email role')
        .populate('student', 'rollNumber department semester')
        .populate('teacher', 'employeeId department designation')
        .populate('approvalFlow.teacher.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.admin.reviewedBy', 'firstName lastName')
        .populate('approvalFlow.superAdmin.reviewedBy', 'firstName lastName')
        .sort({ createdAt: 1 });

    res.json({
        success: true,
        count: leaves.length,
        data: leaves,
    });
});

// @desc    Review leave application (Teacher/Admin/Super Admin)
// @route   PUT /api/leave/:id/review
// @access  Private (Teacher/Admin/Super Admin)
const reviewLeave = asyncHandler(async (req, res) => {
    const { status, reviewRemarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be Approved or Rejected',
        });
    }

    const leave = await LeaveApplication.findById(req.params.id);

    if (!leave) {
        return res.status(404).json({
            success: false,
            message: 'Leave application not found',
        });
    }

    if (leave.status !== 'Pending') {
        return res.status(400).json({
            success: false,
            message: 'Leave application has already been reviewed',
        });
    }

    const roleToFlowKey = {
        teacher: 'teacher',
        admin: 'admin',
        super_admin: 'superAdmin',
    };
    const flowKey = roleToFlowKey[req.user.role];

    if (!flowKey) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to review leave',
        });
    }

    if (req.user.role === 'teacher' && leave.applicantType !== 'Student') {
        return res.status(403).json({
            success: false,
            message: 'Teachers can only review student leave applications',
        });
    }

    // Ensure default flow exists for older records
    leave.approvalFlow = leave.approvalFlow || {};
    leave.approvalFlow.teacher = leave.approvalFlow.teacher || { status: 'Pending' };
    leave.approvalFlow.admin = leave.approvalFlow.admin || { status: 'Pending' };
    leave.approvalFlow.superAdmin = leave.approvalFlow.superAdmin || { status: 'Pending' };

    if (leave.approvalFlow[flowKey].status !== 'Pending') {
        return res.status(400).json({
            success: false,
            message: `Already reviewed by ${req.user.role.replace('_', ' ')}`,
        });
    }

    leave.approvalFlow[flowKey].status = status;
    leave.approvalFlow[flowKey].remarks = reviewRemarks;
    leave.approvalFlow[flowKey].reviewedBy = req.user.id;
    leave.approvalFlow[flowKey].reviewDate = new Date();

    if (status === 'Rejected') {
        leave.status = 'Rejected';
    } else {
        const requiredApprovals = leave.applicantType === 'Teacher'
            ? ['admin', 'superAdmin']
            : ['teacher', 'admin', 'superAdmin'];

        const allApproved = requiredApprovals
            .every((key) => leave.approvalFlow[key]?.status === 'Approved');
        leave.status = allApproved ? 'Approved' : 'Pending';
    }

    leave.reviewRemarks = reviewRemarks;
    leave.reviewedBy = req.user.id;
    leave.reviewDate = new Date();

    await leave.save();

    const currentRoleLabel = req.user.role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // Notify applicant for step update
    await Notification.create({
        recipient: leave.applicant,
        title: `Leave Reviewed by ${currentRoleLabel}`,
        message: `Your leave application was ${status.toLowerCase()} by ${currentRoleLabel}. Current overall status: ${leave.status}.`,
        type: 'leave',
    });

    // Notify applicant and parent on final decision
    if (leave.status === 'Approved' || leave.status === 'Rejected') {
        await Notification.create({
            recipient: leave.applicant,
            title: `Leave Application ${leave.status}`,
            message: `Your leave application from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} has been ${leave.status.toLowerCase()}. ${reviewRemarks || ''}`,
            type: 'leave',
        });

        if (leave.applicantType === 'Student' && leave.student) {
            const student = await Student.findById(leave.student).populate('parentGuardian');
            if (student && student.parentGuardian) {
                const parent = await require('../models/Parent').findById(student.parentGuardian);
                if (parent) {
                    await Notification.create({
                        recipient: parent.user,
                        recipientRole: 'parent',
                        title: `Ward's Leave ${leave.status}`,
                        message: `Your ward's leave application has been ${leave.status.toLowerCase()}.`,
                        type: 'leave',
                    });
                }
            }
        }
    }

    res.json({
        success: true,
        message: `Leave ${status.toLowerCase()} by ${currentRoleLabel}. Overall status: ${leave.status}`,
        data: leave,
    });
});

// @desc    Cancel leave application
// @route   PUT /api/leave/:id/cancel
// @access  Private (Applicant)
const cancelLeave = asyncHandler(async (req, res) => {
    const leave = await LeaveApplication.findById(req.params.id);

    if (!leave) {
        return res.status(404).json({
            success: false,
            message: 'Leave application not found',
        });
    }

    if (leave.applicant.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to cancel this application',
        });
    }

    if (leave.status !== 'Pending') {
        return res.status(400).json({
            success: false,
            message: 'Only pending applications can be cancelled',
        });
    }

    leave.status = 'Cancelled';
    await leave.save();

    res.json({
        success: true,
        message: 'Leave application cancelled successfully',
        data: leave,
    });
});

// @desc    Get leave analytics
// @route   GET /api/leave/analytics
// @access  Private (Admin)
const getLeaveAnalytics = asyncHandler(async (req, res) => {
    const { year, month } = req.query;

    // Status distribution
    const statusDistribution = await LeaveApplication.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    // Leave type distribution
    const typeDistribution = await LeaveApplication.aggregate([
        {
            $group: {
                _id: '$leaveType',
                count: { $sum: 1 },
            },
        },
    ]);

    // Monthly trend
    const monthlyTrend = await LeaveApplication.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$fromDate' } },
                count: { $sum: 1 },
                approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            statusDistribution,
            typeDistribution,
            monthlyTrend,
        },
    });
});

module.exports = {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    getPendingLeaves,
    reviewLeave,
    cancelLeave,
    getLeaveAnalytics,
};
