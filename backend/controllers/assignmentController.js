const { Assignment, AssignmentSubmission } = require('../models/Assignment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
const createAssignment = asyncHandler(async (req, res) => {
    const { title, description, instructions, subjectId, classId, dueDate, totalMarks } = req.body;

    // Get teacher profile
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    // Handle file upload if present
    let fileData = null;
    if (req.file) {
        fileData = {
            url: `/uploads/assignments/${req.file.filename}`,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        };
    }

    const assignment = await Assignment.create({
        title,
        description,
        instructions,
        subject: subjectId,
        class: classId,
        teacher: teacher._id,
        dueDate,
        totalMarks: totalMarks || 100,
        file: fileData,
    });

    // Populate for response
    await assignment.populate(['subject', 'class', 'teacher']);

    // Notify students in the class
    const students = await Student.find({ class: classId }).populate('user');
    const notifications = students.map(student => ({
        recipient: student.user._id,
        recipientRole: 'student',
        title: 'New Assignment',
        message: `New assignment "${title}" has been posted. Due: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'assignment',
        relatedId: assignment._id,
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
    });
});

// @desc    Get teacher's assignments
// @route   GET /api/assignments/teacher
// @access  Private (Teacher)
const getTeacherAssignments = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    const assignments = await Assignment.find({ teacher: teacher._id })
        .populate('subject', 'name code')
        .populate('class', 'name division')
        .sort({ createdAt: -1 });

    // Get submission counts
    const assignmentsWithCounts = await Promise.all(
        assignments.map(async (assignment) => {
            const submissionCount = await AssignmentSubmission.countDocuments({
                assignment: assignment._id,
            });
            return {
                ...assignment.toObject(),
                submissionCount,
            };
        })
    );

    res.json({
        success: true,
        data: assignmentsWithCounts,
    });
});

// @desc    Get student's assignments
// @route   GET /api/assignments/student
// @access  Private (Student)
const getStudentAssignments = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ user: req.user.id }).populate('class');
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found',
        });
    }

    const assignments = await Assignment.find({ class: student.class._id })
        .populate('subject', 'name code')
        .populate('teacher', 'employeeId')
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' }
        })
        .sort({ dueDate: 1 });

    // Check submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
            const submission = await AssignmentSubmission.findOne({
                assignment: assignment._id,
                student: student._id,
            });

            return {
                ...assignment.toObject(),
                hasSubmitted: !!submission,
                submission: submission || null,
            };
        })
    );

    res.json({
        success: true,
        data: assignmentsWithStatus,
    });
});

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id)
        .populate('subject', 'name code')
        .populate('class', 'name division')
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' }
        });

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Assignment not found',
        });
    }

    res.json({
        success: true,
        data: assignment,
    });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher)
const deleteAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Assignment not found',
        });
    }

    // Check if user is the teacher who created it
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (assignment.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this assignment',
        });
    }

    // Delete associated file if exists
    if (assignment.file && assignment.file.url) {
        const filePath = path.join(__dirname, '..', assignment.file.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    // Delete all submissions
    await AssignmentSubmission.deleteMany({ assignment: assignment._id });

    await assignment.deleteOne();

    res.json({
        success: true,
        message: 'Assignment deleted successfully',
    });
});

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Assignment not found',
        });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found',
        });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
        assignment: assignment._id,
        student: student._id,
    });

    if (existingSubmission) {
        return res.status(400).json({
            success: false,
            message: 'Assignment already submitted',
        });
    }

    // Handle file upload
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a file',
        });
    }

    const fileData = {
        url: `/uploads/submissions/${req.file.filename}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
    };

    const submission = await AssignmentSubmission.create({
        assignment: assignment._id,
        student: student._id,
        file: fileData,
    });

    // Notify teacher
    const teacher = await Teacher.findById(assignment.teacher).populate('user');
    if (teacher && teacher.user) {
        await Notification.create({
            recipient: teacher.user._id,
            recipientRole: 'teacher',
            title: 'New Submission',
            message: `${student.user?.firstName} submitted assignment: ${assignment.title}`,
            type: 'assignment',
            relatedId: assignment._id,
        });
    }

    res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully',
        data: submission,
    });
});

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher)
const getSubmissions = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Assignment not found',
        });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName email' },
            select: 'rollNumber department semester'
        })
        .sort({ submittedAt: -1 });

    res.json({
        success: true,
        data: submissions,
    });
});

// @desc    Grade submission
// @route   PUT /api/assignments/submissions/:id/grade
// @access  Private (Teacher)
const gradeSubmission = asyncHandler(async (req, res) => {
    const { marks, feedback } = req.body;

    const submission = await AssignmentSubmission.findById(req.params.id);
    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Submission not found',
        });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = 'Graded';
    await submission.save();

    // Notify student
    const student = await Student.findById(submission.student).populate('user');
    if (student && student.user) {
        await Notification.create({
            recipient: student.user._id,
            recipientRole: 'student',
            title: 'Assignment Graded',
            message: `Your assignment has been graded. Marks: ${marks}`,
            type: 'assignment',
            relatedId: submission.assignment,
        });
    }

    res.json({
        success: true,
        message: 'Submission graded successfully',
        data: submission,
    });
});

module.exports = {
    createAssignment,
    getTeacherAssignments,
    getStudentAssignments,
    getAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissions,
    gradeSubmission,
};
