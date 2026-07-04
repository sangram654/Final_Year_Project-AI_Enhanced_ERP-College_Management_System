const Teacher = require('../models/Teacher');
const User = require('../models/User');
const VirtualMeeting = require('../models/VirtualMeeting'); // Meeting model import karna mat bhoolna
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get meetings for the logged-in teacher
// @route   GET /api/meetings/my-meetings
// @access  Private (Teacher)
const getMyMeetings = asyncHandler(async (req, res) => {
    // 1. Logged-in user ki Teacher Profile dhoondho
    // req.user._id ensure karta hai ki sahi user link ho
    const teacher = await Teacher.findOne({ user: req.user._id });

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    // 2. Advanced Query Logic
    const meetings = await VirtualMeeting.find({
        isActive: true,
        $or: [
            { host: teacher._id },           // Case 1: Teacher is the Host
            { createdBy: req.user._id },    // Case 2: Teacher created this meeting
            { 
                // Case 3: Meeting is targeted to this teacher's department
                targetingType: 'department', 
                departments: teacher.department 
            },
            {
                // Case 4: Meeting is for a specific class this teacher belongs to
                targetingType: 'class',
                'classDetails.department': teacher.department
            }
        ]
    })
    .populate('subject', 'name code')
    .populate({
        path: 'host',
        populate: { path: 'user', select: 'firstName lastName' }
    })
    .sort({ scheduledDate: -1, scheduledTime: -1 });

    // Debugging ke liye (Jab sab chal jaye toh ise hata dena)
    console.log(`Found ${meetings.length} meetings for Teacher: ${teacher._id}`);

    res.json({
        success: true,
        count: meetings.length,
        data: meetings,
    });
});

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
const getAllTeachers = asyncHandler(async (req, res) => {
    const { department, designation, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (department) query.department = department;
    if (designation) query.designation = designation;

    const teachers = await Teacher.find(query)
        .populate('user', 'firstName lastName email phone profileImage')
        .populate('subjects', 'name code')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ employeeId: 1 });

    const total = await Teacher.countDocuments(query);

    res.json({
        success: true,
        data: teachers,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
const getTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id)
        .populate('user', 'firstName lastName email phone profileImage address')
        .populate('subjects')
        .populate('assignedClasses.subject');

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    res.json({
        success: true,
        data: teacher,
    });
});

// @desc    Create teacher profile
// @route   POST /api/teachers
// @access  Private (Admin)
const createTeacher = asyncHandler(async (req, res) => {
    const {
        email, password, firstName, lastName, phone,
        employeeId, department, designation, qualification,
        specialization, experience, joiningDate, gender,
    } = req.body;

    const empExists = await Teacher.findOne({ employeeId });
    if (empExists) {
        return res.status(400).json({
            success: false,
            message: 'Employee ID already exists',
        });
    }

    const generatedPassword = password || `${employeeId}@123`;

    const user = await User.create({
        email,
        password: generatedPassword,
        role: 'teacher',
        firstName,
        lastName,
        phone,
    });

    const teacher = await Teacher.create({
        user: user._id,
        employeeId,
        department,
        designation,
        qualification,
        specialization,
        experience,
        joiningDate,
        gender,
    });

    user.teacherProfile = teacher._id;
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: teacher,
        credentials: {
            email: email,
            password: generatedPassword,
        }
    });
});

// @desc    Update teacher profile
// @route   PUT /api/teachers/:id
// @access  Private (Admin, Teacher-own)
const updateTeacher = asyncHandler(async (req, res) => {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    if (req.user.role === 'teacher' && teacher.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this profile',
        });
    }

    const allowedUpdates = ['specialization', 'qualification', 'experience', 'joiningDate', 'gender'];

    if (req.user.role === 'admin') {
        allowedUpdates.push('department', 'designation', 'subjects', 'assignedClasses', 'salary', 'isActive', 'employeeId');
    }

    const teacherUpdates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            teacherUpdates[key] = req.body[key];
        }
    }

    if (req.user.role === 'admin') {
        const userUpdates = {};
        const allowedUserUpdates = ['firstName', 'lastName', 'phone'];

        for (const key of allowedUserUpdates) {
            if (req.body[key] !== undefined) {
                userUpdates[key] = req.body[key];
            }
        }

        if (Object.keys(userUpdates).length > 0) {
            await User.findByIdAndUpdate(teacher.user, userUpdates, {
                new: true,
                runValidators: true,
            });
        }
    }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, teacherUpdates, {
        new: true,
        runValidators: true,
    }).populate('user', 'firstName lastName email phone');

    res.json({
        success: true,
        message: 'Teacher updated successfully',
        data: teacher,
    });
});

// @desc    Delete/Deactivate teacher
const deleteTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    teacher.isActive = false;
    await teacher.save();

    await User.findByIdAndUpdate(teacher.user, { isActive: false });

    res.json({
        success: true,
        message: 'Teacher deactivated successfully',
    });
});

// @desc    Assign subjects to teacher
const assignSubjects = asyncHandler(async (req, res) => {
    const { subjects } = req.body;
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    teacher.subjects = subjects;
    await teacher.save();

    res.json({
        success: true,
        message: 'Subjects assigned successfully',
        data: teacher,
    });
});

// @desc    Assign class to teacher
const assignClass = asyncHandler(async (req, res) => {
    const { department, semester, section, subject } = req.body;
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    const exists = teacher.assignedClasses.find(
        c => c.department === department && c.semester === semester && c.section === section && c.subject.toString() === subject
    );

    if (exists) {
        return res.status(400).json({
            success: false,
            message: 'Class already assigned to this teacher',
        });
    }

    teacher.assignedClasses.push({ department, semester, section, subject });
    await teacher.save();

    res.json({
        success: true,
        message: 'Class assigned successfully',
        data: teacher,
    });
});

// @desc    Get teachers by department
const getTeachersByDepartment = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find({
        department: req.params.department,
        isActive: true,
    })
    .populate('user', 'firstName lastName email phone profileImage')
    .sort({ employeeId: 1 });

    res.json({
        success: true,
        count: teachers.length,
        data: teachers,
    });
});

module.exports = {
    getMyMeetings,
    getAllTeachers,
    getTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    assignSubjects,
    assignClass,
    getTeachersByDepartment,
};