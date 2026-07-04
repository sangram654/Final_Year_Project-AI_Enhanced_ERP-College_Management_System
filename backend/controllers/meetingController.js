const VirtualMeeting = require('../models/VirtualMeeting');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create virtual meeting
// @route   POST /api/meetings
// @access  Private (Admin, Teacher)
const createMeeting = asyncHandler(async (req, res) => {
    const {
        title, description, meetingLink, platform,
        scheduledDate, scheduledTime, duration,
        targetingType, classDetails, departments, roles, individuals,
        subject, host, isRecurring, recurringPattern
    } = req.body;

    console.log("=== Meeting Create Data Received ===");
    console.log("Targeting Type:", targetingType);
    console.log("Class Details:", classDetails);
    console.log("Full Body:", req.body);

    // --- ERROR FIX START ---
    // Teacher profile dhoodhna zaroori hai taaki host field sahi save ho
    let teacherHost = host;
    if (!teacherHost && req.user.role === 'teacher') {
        const teacherProfile = await Teacher.findOne({ user: req.user.id });
        if (teacherProfile) {
            teacherHost = teacherProfile._id;
        }
    }
    // --- ERROR FIX END ---

    // Prepare meeting data and remove empty fields
    const meetingData = {
        title,
        description,
        meetingLink,
        platform,
        scheduledDate,
        scheduledTime,
        duration,
        createdBy: req.user.id,
        host: teacherHost, // Fix: Ab ye hamesha Teacher ki ID hogi
        targetingType,
        classDetails,
        departments,
        roles,
        individuals,
        isRecurring,
        recurringPattern
    };

    if (!targetingType && classDetails && classDetails.department) {
        meetingData.targetingType = 'class';
        console.log("⚠️ TargetingType was missing, auto-set to 'class'");
    }

    if (targetingType === 'class' && !classDetails) {
        console.log("⚠️ Warning: targetingType is class but classDetails is missing");
    }
    // =========================================

    // Only add subject if it's a valid ObjectId
    if (subject && subject.trim() !== '') {
        meetingData.subject = subject;
    }

    // Create meeting
    const meeting = await VirtualMeeting.create(meetingData);

    // Calculate total targeted users
    let targetedCount = 0;
    
    if (targetingType === 'class' && classDetails) {
        targetedCount = await Student.countDocuments({
            department: classDetails.department,
            semester: classDetails.semester,
            section: classDetails.section,
            isActive: true
        });
    } else if (targetingType === 'department') {
        targetedCount = await Student.countDocuments({
            department: { $in: departments },
            isActive: true
        });
    } else if (targetingType === 'role') {
        targetedCount = await User.countDocuments({
            role: { $in: roles },
            isActive: true
        });
    } else if (targetingType === 'individuals') {
        targetedCount = individuals.length;
    }

    meeting.totalTargeted = targetedCount;
    await meeting.save();

    res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        data: meeting
    });
});

// @desc    Get all meetings
// @route   GET /api/meetings
// @access  Private (Admin)
const getAllMeetings = asyncHandler(async (req, res) => {
    const { status, department, startDate, endDate } = req.query;

    const query = { isActive: true };

    if (status) query.status = status;
    if (department) query['classDetails.department'] = department;
    if (startDate && endDate) {
        query.scheduledDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const meetings = await VirtualMeeting.find(query)
        .populate('createdBy', 'firstName lastName role')
        .populate('host', 'employeeId')
        .populate({
            path: 'host',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .populate('subject', 'name code')
        .sort({ scheduledDate: -1, scheduledTime: -1 });

    res.json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

// @desc    Get my meetings (Teacher)
// @route   GET /api/meetings/my-meetings
// @access  Private (Teacher)
const getMyMeetings = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user.id });
    
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found'
        });
    }

    const meetings = await VirtualMeeting.find({
        $or: [
            { host: teacher._id },
            { createdBy: req.user.id }
        ],
        isActive: true
    })
        .populate('subject', 'name code')
        .sort({ scheduledDate: -1, scheduledTime: -1 });

    res.json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

// @desc    Get upcoming meetings for student/parent
// @route   GET /api/meetings/upcoming
// @access  Private (Student, Parent)
const getUpcomingMeetings = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseQuery = {
        scheduledDate: { $gte: today },
        status: { $in: ['Scheduled', 'Ongoing'] },
        isActive: true
    };

    let targetingQuery = [];

    if (req.user.role === 'student') {
        const student = await Student.findOne({ user: req.user.id });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        targetingQuery = [
            {
                targetingType: 'class',
                'classDetails.department': student.department,
                'classDetails.semester': student.semester,
                'classDetails.section': student.section
            },
            {
                targetingType: 'department',
                departments: student.department
            },
            {
                targetingType: 'role',
                roles: 'student'
            },
            {
                targetingType: 'individuals',
                individuals: req.user.id
            }
        ];
    } else if (req.user.role === 'parent') {
        const parent = await Parent.findOne({ user: req.user.id }).select('students');

        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent profile not found'
            });
        }

        if (parent.students.length > 0) {
            const wards = await Student.find({
                _id: { $in: parent.students },
                isActive: true
            })
                .select('department semester section')
                .lean();

            const wardDepartments = [...new Set(wards.map(ward => ward.department).filter(Boolean))];

            targetingQuery = [
                {
                    targetingType: 'role',
                    roles: 'parent'
                },
                {
                    targetingType: 'role',
                    roles: 'student'
                },
                {
                    targetingType: 'individuals',
                    individuals: req.user.id
                },
                ...(wardDepartments.length > 0 ? [{
                    targetingType: 'department',
                    departments: { $in: wardDepartments }
                }] : []),
                ...wards.map(ward => ({
                    targetingType: 'class',
                    'classDetails.department': ward.department,
                    'classDetails.semester': ward.semester,
                    'classDetails.section': ward.section
                }))
            ];
        } else {
            targetingQuery = [
                {
                    targetingType: 'role',
                    roles: 'parent'
                },
                {
                    targetingType: 'individuals',
                    individuals: req.user.id
                }
            ];
        }
    } else {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access upcoming meetings'
        });
    }

    const meetings = await VirtualMeeting.find({
        ...baseQuery,
        $or: targetingQuery
    })
        .populate('subject', 'name code')
        .populate({
            path: 'host',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
const getMeeting = asyncHandler(async (req, res) => {
    const meeting = await VirtualMeeting.findById(req.params.id)
        .populate('createdBy', 'firstName lastName role')
        .populate({
            path: 'host',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .populate('subject', 'name code')
        .populate('attendees.user', 'firstName lastName role');

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: 'Meeting not found'
        });
    }

    res.json({
        success: true,
        data: meeting
    });
});

// @desc    Update meeting
const updateMeeting = asyncHandler(async (req, res) => {
    let meeting = await VirtualMeeting.findById(req.params.id);

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: 'Meeting not found'
        });
    }

    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user.id });
        if (!teacher || meeting.host.toString() !== teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this meeting'
            });
        }
    }

    meeting = await VirtualMeeting.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.json({
        success: true,
        message: 'Meeting updated successfully',
        data: meeting
    });
});

// @desc    Delete/Cancel meeting
const deleteMeeting = asyncHandler(async (req, res) => {
    const meeting = await VirtualMeeting.findById(req.params.id);

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: 'Meeting not found'
        });
    }

    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user.id });
        if (!teacher || meeting.host.toString() !== teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this meeting'
            });
        }
    }

    meeting.status = 'Cancelled';
    meeting.isActive = false;
    await meeting.save();

    res.json({
        success: true,
        message: 'Meeting cancelled successfully'
    });
});

// @desc    Join meeting (Track attendance)
const joinMeeting = asyncHandler(async (req, res) => {
    const meeting = await VirtualMeeting.findById(req.params.id);

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: 'Meeting not found'
        });
    }

    const alreadyJoined = meeting.attendees.find(
        a => a.user.toString() === req.user.id
    );

    if (alreadyJoined) {
        return res.json({
            success: true,
            message: 'Already marked as joined',
            meetingLink: meeting.meetingLink
        });
    }

    meeting.attendees.push({
        user: req.user.id,
        joinedAt: new Date()
    });
    meeting.totalAttended = meeting.attendees.length;

    if (meeting.status === 'Scheduled') {
        meeting.status = 'Ongoing';
    }

    await meeting.save();

    res.json({
        success: true,
        message: 'Attendance marked successfully',
        meetingLink: meeting.meetingLink
    });
});

// @desc    Get meeting analytics
const getMeetingAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchQuery = { isActive: true };
    if (startDate && endDate) {
        matchQuery.scheduledDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const statusDistribution = await VirtualMeeting.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const departmentWise = await VirtualMeeting.aggregate([
        { $match: { ...matchQuery, targetingType: 'class' } },
        {
            $group: {
                _id: '$classDetails.department',
                count: { $sum: 1 },
                avgAttendance: {
                    $avg: {
                        $cond: [
                            { $gt: ['$totalTargeted', 0] },
                            { $multiply: [{ $divide: ['$totalAttended', '$totalTargeted'] }, 100] },
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const platformUsage = await VirtualMeeting.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$platform',
                count: { $sum: 1 }
            }
        }
    ]);

    res.json({
        success: true,
        data: {
            statusDistribution,
            departmentWise,
            platformUsage
        }
    });
});

// ==================== NEW FUNCTION FOR TEACHER ====================
// @desc    Get meetings created by Admin/SuperAdmin for teacher's assigned classes
// @route   GET /api/meetings/my-class-meetings
// @access  Private (Teacher)
// @desc    Get meetings created by Admin/SuperAdmin for teacher's assigned classes
// @route   GET /api/meetings/my-class-meetings
// Temporary Simple Version for Debugging
const getMyClassMeetings = asyncHandler(async (req, res) => {
    try {
        console.log("=== getMyClassMeetings CALLED by Teacher ID:", req.user?.id);

        // Sabse loose query - saari class targeting wali meetings laao
        const meetings = await VirtualMeeting.find({
            targetingType: 'class',
            isActive: true
        })
        .populate('subject', 'name code')
        .populate({
            path: 'host',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .sort({ scheduledDate: 1, scheduledTime: 1 });

        console.log(`Found ${meetings.length} meetings with targetingType: 'class'`);

        // Agar 0 aa raha hai toh saari meetings ki details bhi dikhao
        if (meetings.length === 0) {
            const allMeetings = await VirtualMeeting.find({ isActive: true }).select('title targetingType classDetails status');
            console.log("All active meetings in DB:", allMeetings);
        }

        res.json({
            success: true,
            count: meetings.length,
            data: meetings
        });

    } catch (error) {
        console.error('Error in getMyClassMeetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class meetings'
        });
    }
});

// ==================== UPDATE MODULE EXPORTS ====================
module.exports = {
    createMeeting,
    getAllMeetings,
    getMyMeetings,
    getMyClassMeetings,       
    getUpcomingMeetings,
    getMeeting,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    getMeetingAnalytics
};
