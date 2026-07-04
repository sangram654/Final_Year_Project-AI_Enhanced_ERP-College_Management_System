const Marks = require('../models/Marks');
const Backlog = require('../models/Backlog');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Enter marks for students
// @route   POST /api/marks
// @access  Private (Teacher)
const enterMarks = asyncHandler(async (req, res) => {
    const { subjectId, examType, academicYear, marksData } = req.body;
    // marksData: [{ studentId, maxMarks, obtainedMarks }]

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found',
        });
    }

    const teacher = await require('../models/Teacher').findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    const marksRecords = [];
    const notifications = [];

    for (const record of marksData) {
        const student = await Student.findById(record.studentId);
        if (!student) continue;

        // Upsert marks
        const marks = await Marks.findOneAndUpdate(
            {
                student: record.studentId,
                subject: subjectId,
                examType,
                academicYear,
                attemptNumber: record.attemptNumber || 1,
            },
            {
                student: record.studentId,
                subject: subjectId,
                semester: student.semester,
                examType,
                academicYear,
                maxMarks: record.maxMarks,
                obtainedMarks: record.obtainedMarks,
                enteredBy: teacher._id,
                attemptNumber: record.attemptNumber || 1,
            },
            { upsert: true, new: true }
        );

        marksRecords.push(marks);

        // Check for backlog
        const percentage = (record.obtainedMarks / record.maxMarks) * 100;
        if (percentage < 33 && examType === 'End-Term') {
            await Backlog.findOneAndUpdate(
                {
                    student: record.studentId,
                    subject: subjectId,
                    originalAcademicYear: academicYear,
                },
                {
                    student: record.studentId,
                    subject: subjectId,
                    originalSemester: student.semester,
                    originalAcademicYear: academicYear,
                    originalMarks: record.obtainedMarks,
                    examType: 'Theory',
                    status: 'Open',
                },
                { upsert: true }
            );

            // Notify student about backlog
            const studentUser = await require('../models/User').findById(student.user);
            if (studentUser) {
                notifications.push({
                    recipient: studentUser._id,
                    recipientRole: 'student',
                    title: 'Backlog Subject',
                    message: `You have a backlog in ${subject.name}. Please register for re-examination.`,
                    type: 'marks',
                });
            }
        }

        // Notify about marks
        const studentUser = await require('../models/User').findById(student.user);
        if (studentUser) {
            notifications.push({
                recipient: studentUser._id,
                recipientRole: 'student',
                title: 'Marks Updated',
                message: `${examType} marks for ${subject.name} have been updated. Obtained: ${record.obtainedMarks}/${record.maxMarks}`,
                type: 'marks',
            });
        }
    }

    // Create notifications
    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    res.status(201).json({
        success: true,
        message: `Marks entered for ${marksRecords.length} students`,
        data: marksRecords,
    });
});

// @desc    Get student marks
// @route   GET /api/marks/student/:studentId
// @access  Private
const getStudentMarks = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { semester, academicYear, subjectId } = req.query;

    const query = { student: studentId };
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (subjectId) query.subject = subjectId;

    const marks = await Marks.find(query)
        .populate('subject', 'name code credits')
        .sort({ academicYear: -1, examType: 1 });

    // Group by subject
    const groupedMarks = {};
    marks.forEach(mark => {
        const subjectKey = mark.subject._id.toString();
        if (!groupedMarks[subjectKey]) {
            groupedMarks[subjectKey] = {
                subject: mark.subject,
                marks: [],
            };
        }
        groupedMarks[subjectKey].marks.push(mark);
    });

    res.json({
        success: true,
        data: Object.values(groupedMarks),
    });
});

// @desc    Get marks by class
// @route   GET /api/marks/class
// @access  Private (Teacher, Admin)
const getClassMarks = asyncHandler(async (req, res) => {
    const { subjectId, examType, academicYear } = req.query;

    const query = {};
    if (subjectId) query.subject = subjectId;
    if (examType) query.examType = examType;
    if (academicYear) query.academicYear = academicYear;

    const marks = await Marks.find(query)
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .populate('subject', 'name code')
        .sort({ 'student.rollNumber': 1 });

    res.json({
        success: true,
        count: marks.length,
        data: marks,
    });
});

// @desc    Get student backlogs
// @route   GET /api/marks/backlogs/:studentId
// @access  Private
const getStudentBacklogs = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { status } = req.query;

    const query = { student: studentId };
    if (status) query.status = status;

    const backlogs = await Backlog.find(query)
        .populate('subject', 'name code credits')
        .sort({ originalSemester: 1 });

    const summary = {
        total: backlogs.length,
        open: backlogs.filter(b => b.status === 'Open').length,
        cleared: backlogs.filter(b => b.status === 'Cleared').length,
        registered: backlogs.filter(b => b.status === 'Registered').length,
    };

    res.json({
        success: true,
        data: backlogs,
        summary,
    });
});

// @desc    Register for backlog exam
// @route   POST /api/marks/backlogs/:id/register
// @access  Private (Student)
const registerBacklogExam = asyncHandler(async (req, res) => {
    const backlog = await Backlog.findById(req.params.id);

    if (!backlog) {
        return res.status(404).json({
            success: false,
            message: 'Backlog not found',
        });
    }

    if (backlog.status !== 'Open') {
        return res.status(400).json({
            success: false,
            message: 'Backlog is not open for registration',
        });
    }

    backlog.status = 'Registered';
    await backlog.save();

    res.json({
        success: true,
        message: 'Registered for backlog exam successfully',
        data: backlog,
    });
});

// @desc    Update backlog with attempt result
// @route   PUT /api/marks/backlogs/:id/attempt
// @access  Private (Admin)
const updateBacklogAttempt = asyncHandler(async (req, res) => {
    const { academicYear, examDate, marks, result } = req.body;

    const backlog = await Backlog.findById(req.params.id);

    if (!backlog) {
        return res.status(404).json({
            success: false,
            message: 'Backlog not found',
        });
    }

    const attemptNumber = backlog.attempts.length + 1;

    backlog.attempts.push({
        attemptNumber,
        academicYear,
        examDate,
        marks,
        result,
    });

    if (result === 'Pass') {
        backlog.status = 'Cleared';
        backlog.clearedDate = examDate;
        backlog.clearedMarks = marks;
    } else {
        backlog.status = 'Open';
    }

    await backlog.save();

    // Notify student
    const student = await Student.findById(backlog.student).populate('user');
    if (student && student.user) {
        const subject = await Subject.findById(backlog.subject);
        await Notification.create({
            recipient: student.user._id,
            recipientRole: 'student',
            title: result === 'Pass' ? 'Backlog Cleared!' : 'Backlog Result',
            message: result === 'Pass'
                ? `Congratulations! You have cleared the backlog in ${subject.name}`
                : `Backlog result for ${subject.name}: ${result}. Marks: ${marks}`,
            type: 'marks',
        });
    }

    res.json({
        success: true,
        message: 'Backlog attempt updated successfully',
        data: backlog,
    });
});

// @desc    Get backlog analytics
// @route   GET /api/marks/backlogs/analytics
// @access  Private (Admin)
const getBacklogAnalytics = asyncHandler(async (req, res) => {
    const { department, semester } = req.query;

    const matchQuery = {};

    // Subject-wise backlog count
    const subjectWise = await Backlog.aggregate([
        { $match: { status: 'Open' } },
        {
            $group: {
                _id: '$subject',
                count: { $sum: 1 },
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
                count: 1,
            },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    // Status distribution
    const statusDistribution = await Backlog.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    // Semester-wise distribution
    const semesterWise = await Backlog.aggregate([
        { $match: { status: 'Open' } },
        {
            $group: {
                _id: '$originalSemester',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            subjectWise,
            statusDistribution,
            semesterWise,
        },
    });
});

// @desc    Get performance analytics
// @route   GET /api/marks/analytics
// @access  Private (Admin, Teacher)
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
    const { department, semester, academicYear } = req.query;

    // Grade distribution
    const gradeDistribution = await Marks.aggregate([
        { $match: { examType: 'End-Term' } },
        {
            $group: {
                _id: '$grade',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Subject-wise average
    const subjectAverage = await Marks.aggregate([
        { $match: { examType: 'End-Term' } },
        {
            $group: {
                _id: '$subject',
                avgMarks: { $avg: '$obtainedMarks' },
                maxPossible: { $first: '$maxMarks' },
                count: { $sum: 1 },
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
                avgMarks: { $round: ['$avgMarks', 2] },
                avgPercentage: {
                    $round: [{ $multiply: [{ $divide: ['$avgMarks', '$maxPossible'] }, 100] }, 2],
                },
                count: 1,
            },
        },
        { $sort: { avgPercentage: -1 } },
    ]);

    res.json({
        success: true,
        data: {
            gradeDistribution,
            subjectAverage,
        },
    });
});

// @desc    Bulk enter marks for multiple students using TeachingAssignment
// @route   POST /api/marks/bulk
// @access  Private (Teacher, Admin)
const bulkEnterMarks = asyncHandler(async (req, res) => {
    const { assignmentId, examType, marks } = req.body;
    // marks: [{ studentId, marksObtained }]

    if (!marks || !Array.isArray(marks) || marks.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Marks data is required',
        });
    }

    const teacher = await require('../models/Teacher').findOne({ user: req.user.id });

    // If assignmentId provided, use TeachingAssignment-based validation
    if (assignmentId) {
        const TeachingAssignment = require('../models/TeachingAssignment');
        const Class = require('../models/Class');
        const assignment = await TeachingAssignment.findById(assignmentId)
            .populate('subjectId')
            .populate('classId');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Teaching assignment not found',
            });
        }

        // Verify teacher owns this assignment (unless admin)
        if (req.user.role === 'teacher') {
            if (!teacher || assignment.teacherId.toString() !== teacher._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to enter marks for this class',
                });
            }
        }

        const classInfo = assignment.classId;
        const subjectInfo = assignment.subjectId;
        const academicYear = assignment.academicYear;
        const maxMarks = getMaxMarksByExamType(examType, subjectInfo?.maxMarks);
        const marksRecords = [];

        for (const record of marks) {
            const student = await Student.findById(record.studentId);
            if (!student) continue;

            // Verify student belongs to the same class as the assignment
            if (
                student.department !== classInfo.department ||
                student.semester !== classInfo.semester ||
                student.section !== classInfo.section
            ) {
                continue; // Skip students not in this class
            }

            // Upsert marks
            const marksDoc = await Marks.findOneAndUpdate(
                {
                    student: record.studentId,
                    subject: subjectInfo._id,
                    examType,
                    academicYear,
                },
                {
                    student: record.studentId,
                    subject: subjectInfo._id,
                    semester: classInfo.semester,
                    examType,
                    academicYear,
                    maxMarks: record.maxMarks || maxMarks,
                    obtainedMarks: record.marksObtained,
                    enteredBy: teacher?._id || req.user.id,
                    teachingAssignment: assignment._id,
                },
                { upsert: true, new: true }
            );

            marksRecords.push(marksDoc);
        }

        return res.status(201).json({
            success: true,
            message: `Marks saved for ${marksRecords.length} students`,
            data: marksRecords,
        });
    }

    // Legacy flow (for backward compatibility or admin use)
    const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const marksRecords = [];

    for (const record of marks) {
        const student = await Student.findById(record.studentId);
        if (!student) continue;

        // Upsert marks
        const marksDoc = await Marks.findOneAndUpdate(
            {
                student: record.studentId,
                subject: record.subjectId,
                examType: record.examType || examType,
                academicYear,
            },
            {
                student: record.studentId,
                subject: record.subjectId,
                semester: record.semester || student.semester,
                examType: record.examType || examType,
                academicYear,
                maxMarks: record.maxMarks,
                obtainedMarks: record.marksObtained,
                enteredBy: teacher?._id || req.user.id,
            },
            { upsert: true, new: true }
        );

        marksRecords.push(marksDoc);
    }

    res.status(201).json({
        success: true,
        message: `Marks saved for ${marksRecords.length} students`,
        data: marksRecords,
    });
});

// Helper function to get max marks based on exam type
const getMaxMarksByExamType = (examType, subjectMaxMarks) => {
    switch (examType) {
        case 'Internal':
        case 'Internal 1':
        case 'Internal 2':
            return subjectMaxMarks?.internal || 20;
        case 'Mid-Term':
        case 'Mid Term':
            return 50;
        case 'End-Term':
        case 'End Term':
            return subjectMaxMarks?.theory || 80;
        case 'Practical':
            return subjectMaxMarks?.practical || 20;
        default:
            return 40;
    }
};

// @desc    Get marks by filter
// @route   GET /api/marks
// @access  Private (Teacher, Admin)
const getMarksByFilter = asyncHandler(async (req, res) => {
    const { subjectId, examType, department, semester } = req.query;

    const query = {};
    if (subjectId) query.subject = subjectId;
    if (examType) query.examType = examType;
    if (semester) query.semester = parseInt(semester);

    const marks = await Marks.find(query)
        .populate({
            path: 'student',
            match: department ? { department } : {},
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .populate('subject', 'name code')
        .sort({ createdAt: -1 });

    // Filter out null students (those that didn't match department filter)
    const filteredMarks = marks.filter(m => m.student !== null);

    res.json({
        success: true,
        count: filteredMarks.length,
        data: filteredMarks,
    });
});

module.exports = {
    enterMarks,
    getStudentMarks,
    getClassMarks,
    getStudentBacklogs,
    registerBacklogExam,
    updateBacklogAttempt,
    getBacklogAnalytics,
    getPerformanceAnalytics,
    bulkEnterMarks,
    getMarksByFilter,
};

