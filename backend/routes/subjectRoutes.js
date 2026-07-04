const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private (All authenticated users)
router.get('/', asyncHandler(async (req, res) => {
    const { department, semester } = req.query;

    const query = { isActive: true };
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query)
        .populate('teacher', 'user')
        .sort({ department: 1, semester: 1, code: 1 });

    res.json({
        success: true,
        count: subjects.length,
        data: subjects
    });
}));

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id)
        .populate('teacher');

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }

    res.json({
        success: true,
        data: subject
    });
}));

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Admin only)
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
    const { code, name, department, semester, credits, type, teacher } = req.body;

    // Check if subject code already exists
    const existing = await Subject.findOne({ code });
    if (existing) {
        return res.status(400).json({
            success: false,
            message: 'Subject with this code already exists'
        });
    }

    const subjectData = {
        code,
        name,
        department,
        semester,
        credits,
        type,
    };

    if (teacher && String(teacher).trim() !== '') {
        subjectData.teacher = teacher;
    }

    const subject = await Subject.create(subjectData);

    res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
    });
}));

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    let subject = await Subject.findById(req.params.id);

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }

    const updateData = { ...req.body };
    if (updateData.teacher === '') {
        delete updateData.teacher;
    }

    subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    res.json({
        success: true,
        message: 'Subject updated successfully',
        data: subject
    });
}));

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found'
        });
    }

    // Soft delete
    subject.isActive = false;
    await subject.save();

    res.json({
        success: true,
        message: 'Subject deleted successfully'
    });
}));

module.exports = router;
