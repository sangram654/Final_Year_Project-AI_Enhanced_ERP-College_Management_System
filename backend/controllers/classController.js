const Class = require('../models/Class');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin)
const getAllClasses = asyncHandler(async (req, res) => {
    const { department, semester, academicYear, isActive } = req.query;

    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    // Only filter by isActive if explicitly provided
    if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true' || isActive === true;
    }

    const classes = await Class.find(query)
        .populate({
            path: 'classTeacher',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .sort({ department: 1, semester: 1, section: 1 });

    res.json({
        success: true,
        count: classes.length,
        data: classes,
    });
});

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
const getClass = asyncHandler(async (req, res) => {
    const classDoc = await Class.findById(req.params.id)
        .populate({
            path: 'classTeacher',
            populate: { path: 'user', select: 'firstName lastName email' },
        });

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: 'Class not found',
        });
    }

    res.json({
        success: true,
        data: classDoc,
    });
});

// @desc    Create class
// @route   POST /api/classes
// @access  Private (Admin)
const createClass = asyncHandler(async (req, res) => {
    const { name, department, semester, section, batch, academicYear, classTeacher, roomNumber } = req.body;

    // Check if class already exists
    const existingClass = await Class.findOne({
        department,
        semester,
        section,
        academicYear,
    });

    if (existingClass) {
        return res.status(400).json({
            success: false,
            message: 'This class already exists for the given academic year',
        });
    }

    const classDoc = await Class.create({
        name: name || `${department} - Sem ${semester} - Sec ${section}`,
        department,
        semester,
        section,
        batch,
        academicYear,
        classTeacher,
        roomNumber,
    });

    const populatedClass = await Class.findById(classDoc._id)
        .populate({
            path: 'classTeacher',
            populate: { path: 'user', select: 'firstName lastName' },
        });

    res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: populatedClass,
    });
});

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin)
const updateClass = asyncHandler(async (req, res) => {
    const { name, classTeacher, roomNumber, strength, isActive } = req.body;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: 'Class not found',
        });
    }

    if (name) classDoc.name = name;
    if (classTeacher !== undefined) classDoc.classTeacher = classTeacher;
    if (roomNumber !== undefined) classDoc.roomNumber = roomNumber;
    if (strength !== undefined) classDoc.strength = strength;
    if (isActive !== undefined) classDoc.isActive = isActive;

    await classDoc.save();

    const populatedClass = await Class.findById(classDoc._id)
        .populate({
            path: 'classTeacher',
            populate: { path: 'user', select: 'firstName lastName' },
        });

    res.json({
        success: true,
        message: 'Class updated successfully',
        data: populatedClass,
    });
});

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
const deleteClass = asyncHandler(async (req, res) => {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: 'Class not found',
        });
    }

    // Soft delete
    classDoc.isActive = false;
    await classDoc.save();

    res.json({
        success: true,
        message: 'Class deactivated successfully',
    });
});

// @desc    Get students in a class
// @route   GET /api/classes/:id/students
// @access  Private
const getClassStudents = asyncHandler(async (req, res) => {
    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
        return res.status(404).json({
            success: false,
            message: 'Class not found',
        });
    }

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
        class: classDoc,
        data: students,
    });
});

// @desc    Auto-sync/generate classes from existing student data
// @route   POST /api/classes/sync-from-students
// @access  Private (Admin)
const syncClassesFromStudents = asyncHandler(async (req, res) => {
    // Get current academic year
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const academicYear = `${year}-${year + 1}`;

    // Find all unique department + semester + section combinations from students
    const uniqueCombinations = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: {
                    department: '$department',
                    semester: '$semester',
                    section: '$section',
                },
                count: { $sum: 1 },
            },
        },
    ]);

    const createdClasses = [];
    const existingClasses = [];

    for (const combo of uniqueCombinations) {
        const { department, semester, section } = combo._id;

        if (!department || !semester) continue;

        // Check if class already exists
        let classDoc = await Class.findOne({
            department,
            semester,
            section: section || 'A',
            academicYear,
        });

        if (classDoc) {
            // Update strength
            classDoc.strength = combo.count;
            await classDoc.save();
            existingClasses.push(classDoc);
        } else {
            // Create new class
            classDoc = await Class.create({
                name: `${department} - Sem ${semester} - Sec ${section || 'A'}`,
                department,
                semester,
                section: section || 'A',
                batch: year.toString(),
                academicYear,
                strength: combo.count,
            });
            createdClasses.push(classDoc);
        }
    }

    res.json({
        success: true,
        message: `Synced classes from student data. Created: ${createdClasses.length}, Updated: ${existingClasses.length}`,
        data: {
            created: createdClasses,
            updated: existingClasses,
        },
    });
});

module.exports = {
    getAllClasses,
    getClass,
    createClass,
    updateClass,
    deleteClass,
    getClassStudents,
    syncClassesFromStudents,
};
