const TeachingAssignment = require('../models/TeachingAssignment');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all teaching assignments for the logged-in teacher
// @route   GET /api/teaching-assignments/my-assignments
// @access  Private (Teacher)
const getMyAssignments = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user.id });

    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    const assignments = await TeachingAssignment.find({
        teacherId: teacher._id,
        isActive: true,
    })
        .populate('subjectId', 'name code credits type maxMarks')
        .populate('classId', 'name department semester section batch academicYear')
        .sort({ semester: 1 });

    res.json({
        success: true,
        count: assignments.length,
        data: assignments,
    });
});

// @desc    Get students for a specific teaching assignment
// @route   GET /api/teaching-assignments/:id/students
// @access  Private (Teacher)
const getAssignmentStudents = asyncHandler(async (req, res) => {
    const assignment = await TeachingAssignment.findById(req.params.id)
        .populate('subjectId', 'name code')
        .populate('classId', 'name department semester section');

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Teaching assignment not found',
        });
    }

    // Verify teacher owns this assignment (unless admin)
    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user.id });
        if (!teacher || assignment.teacherId.toString() !== teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this assignment',
            });
        }
    }

    // Fetch students matching the class
    const classDoc = assignment.classId;
    const students = await Student.find({
        department: classDoc.department,
        semester: classDoc.semester,
        section: classDoc.section,
        isActive: true,
    })
        .populate('user', 'firstName lastName email phone profileImage')
        .sort({ rollNumber: 1 });

    res.json({
        success: true,
        count: students.length,
        assignment: {
            _id: assignment._id,
            subject: assignment.subjectId,
            class: assignment.classId,
            semester: assignment.semester,
        },
        data: students,
    });
});

// @desc    Get all teaching assignments (Admin)
// @route   GET /api/teaching-assignments
// @access  Private (Admin)
const getAllAssignments = asyncHandler(async (req, res) => {
    const { department, semester, teacherId, classId, isActive } = req.query;

    const query = {};
    if (teacherId) query.teacherId = teacherId;
    if (classId) query.classId = classId;
    if (semester) query.semester = parseInt(semester);
    if (isActive !== undefined) query.isActive = isActive === 'true';

    let assignments = await TeachingAssignment.find(query)
        .populate({
            path: 'teacherId',
            populate: { path: 'user', select: 'firstName lastName email' },
        })
        .populate('subjectId', 'name code credits')
        .populate('classId', 'name department semester section batch academicYear')
        .sort({ createdAt: -1 });

    // Filter by department if specified (from class)
    if (department) {
        assignments = assignments.filter(a => a.classId?.department === department);
    }

    res.json({
        success: true,
        count: assignments.length,
        data: assignments,
    });
});

// @desc    Create teaching assignment
// @route   POST /api/teaching-assignments
// @access  Private (Admin)
const createAssignment = asyncHandler(async (req, res) => {
    const { teacherId, classId, subjectId, academicYear, semester } = req.body;

    // Validate teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher not found',
        });
    }

    // Validate class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: 'Class not found',
        });
    }

    // Validate subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found',
        });
    }

    // Check if assignment already exists
    const existingAssignment = await TeachingAssignment.findOne({
        teacherId,
        classId,
        subjectId,
        academicYear: academicYear || classDoc.academicYear,
    });

    if (existingAssignment) {
        return res.status(400).json({
            success: false,
            message: 'This teaching assignment already exists',
        });
    }

    const assignment = await TeachingAssignment.create({
        teacherId,
        classId,
        subjectId,
        academicYear: academicYear || classDoc.academicYear,
        semester: semester || classDoc.semester,
    });

    const populatedAssignment = await TeachingAssignment.findById(assignment._id)
        .populate({
            path: 'teacherId',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .populate('subjectId', 'name code')
        .populate('classId', 'name department semester section');

    res.status(201).json({
        success: true,
        message: 'Teaching assignment created successfully',
        data: populatedAssignment,
    });
});

// @desc    Update teaching assignment
// @route   PUT /api/teaching-assignments/:id
// @access  Private (Admin)
const updateAssignment = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const assignment = await TeachingAssignment.findById(req.params.id);

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Teaching assignment not found',
        });
    }

    if (isActive !== undefined) assignment.isActive = isActive;

    await assignment.save();

    const populatedAssignment = await TeachingAssignment.findById(assignment._id)
        .populate({
            path: 'teacherId',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .populate('subjectId', 'name code')
        .populate('classId', 'name department semester section');

    res.json({
        success: true,
        message: 'Teaching assignment updated successfully',
        data: populatedAssignment,
    });
});

// @desc    Delete teaching assignment
// @route   DELETE /api/teaching-assignments/:id
// @access  Private (Admin)
const deleteAssignment = asyncHandler(async (req, res) => {
    const assignment = await TeachingAssignment.findById(req.params.id);

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Teaching assignment not found',
        });
    }

    // Soft delete
    assignment.isActive = false;
    await assignment.save();

    res.json({
        success: true,
        message: 'Teaching assignment deactivated successfully',
    });
});

// @desc    Get single teaching assignment
// @route   GET /api/teaching-assignments/:id
// @access  Private
const getAssignment = asyncHandler(async (req, res) => {
    const assignment = await TeachingAssignment.findById(req.params.id)
        .populate({
            path: 'teacherId',
            populate: { path: 'user', select: 'firstName lastName email' },
        })
        .populate('subjectId', 'name code credits type maxMarks')
        .populate('classId', 'name department semester section batch academicYear');

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Teaching assignment not found',
        });
    }

    res.json({
        success: true,
        data: assignment,
    });
});

module.exports = {
    getMyAssignments,
    getAssignmentStudents,
    getAllAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignment,
};
