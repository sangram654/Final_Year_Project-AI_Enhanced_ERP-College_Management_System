const Note = require('../models/Note');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Upload note/study material
// @route   POST /api/notes
// @access  Private (Teacher)
const uploadNote = asyncHandler(async (req, res) => {
    const { title, description, subjectId, type, unit, tags, assignmentType, assignedStudents, assignedDepartments, dueDate, priority } = req.body;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a file',
        });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({
            success: false,
            message: 'Subject not found',
        });
    }

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    // Process assignment data
    const noteData = {
        title,
        description,
        subject: subjectId,
        teacher: teacher._id,
        department: subject.department,
        semester: subject.semester,
        type: type || 'Notes',
        unit,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        file: {
            name: req.file.originalname,
            url: `/uploads/notes/${req.file.filename}`,
            size: req.file.size,
            mimeType: req.file.mimetype,
        },
        assignmentType: assignmentType || 'department',
        priority: priority || 'Medium',
    };

    // Handle assignment based on type
    if (assignmentType === 'specific_students' && assignedStudents) {
        noteData.assignedStudents = Array.isArray(assignedStudents) 
            ? assignedStudents 
            : assignedStudents.split(',');
    }
    
    if (assignmentType === 'department' && assignedDepartments) {
        noteData.assignedDepartments = Array.isArray(assignedDepartments) 
            ? assignedDepartments 
            : assignedDepartments.split(',');
    } else if (assignmentType === 'department') {
        // Default to subject's department
        noteData.assignedDepartments = [subject.department];
    }

    if (dueDate) {
        noteData.dueDate = new Date(dueDate);
    }

    const note = await Note.create(noteData);

    res.status(201).json({
        success: true,
        message: 'Note uploaded successfully',
        data: note,
    });
});

// @desc    Get notes
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
    const { department, semester, subjectId, type, search, page = 1, limit = 20 } = req.query;

    const query = { isVisible: true };

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (subjectId) query.subject = subjectId;
    if (type) query.type = type;

    // Text search
    if (search) {
        query.$text = { $search: search };
    }

    const notes = await Note.find(query)
        .populate('subject', 'name code')
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await Note.countDocuments(query);

    res.json({
        success: true,
        data: notes,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id)
        .populate('subject', 'name code')
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' },
        });

    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Note not found',
        });
    }

    res.json({
        success: true,
        data: note,
    });
});

// @desc    Download note (increment counter)
// @route   GET /api/notes/:id/download
// @access  Private
const downloadNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Note not found',
        });
    }

    // Increment download count
    note.downloads += 1;
    await note.save();

    res.json({
        success: true,
        data: {
            downloadUrl: note.file.url,
            filename: note.file.name,
        },
    });
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private (Teacher-owner, Admin)
const updateNote = asyncHandler(async (req, res) => {
    let note = await Note.findById(req.params.id);

    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Note not found',
        });
    }

    // Check ownership
    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user.id });
        if (note.teacher.toString() !== teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this note',
            });
        }
    }

    const { title, description, type, unit, tags, isVisible } = req.body;

    if (title) note.title = title;
    if (description) note.description = description;
    if (type) note.type = type;
    if (unit) note.unit = unit;
    if (tags) note.tags = tags.split(',').map(t => t.trim());
    if (isVisible !== undefined) note.isVisible = isVisible;

    // Handle file update
    if (req.file) {
        note.file = {
            name: req.file.originalname,
            url: `/uploads/notes/${req.file.filename}`,
            size: req.file.size,
            mimeType: req.file.mimetype,
        };
    }

    await note.save();

    res.json({
        success: true,
        message: 'Note updated successfully',
        data: note,
    });
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private (Teacher-owner, Admin)
const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        return res.status(404).json({
            success: false,
            message: 'Note not found',
        });
    }

    // Check ownership
    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: req.user.id });
        if (note.teacher.toString() !== teacher._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this note',
            });
        }
    }

    // Soft delete
    note.isVisible = false;
    await note.save();

    res.json({
        success: true,
        message: 'Note deleted successfully',
    });
});

// @desc    Get notes by subject
// @route   GET /api/notes/subject/:subjectId
// @access  Private
const getNotesBySubject = asyncHandler(async (req, res) => {
    const notes = await Note.find({
        subject: req.params.subjectId,
        isVisible: true,
    })
        .populate({
            path: 'teacher',
            populate: { path: 'user', select: 'firstName lastName' },
        })
        .sort({ unit: 1, createdAt: -1 });

    // Group by type
    const grouped = {};
    notes.forEach(note => {
        if (!grouped[note.type]) {
            grouped[note.type] = [];
        }
        grouped[note.type].push(note);
    });

    res.json({
        success: true,
        count: notes.length,
        data: grouped,
    });
});

// @desc    Get teacher's uploaded notes
// @route   GET /api/notes/my-notes
// @access  Private (Teacher)
const getMyNotes = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
        return res.status(404).json({
            success: false,
            message: 'Teacher profile not found',
        });
    }

    const notes = await Note.find({ teacher: teacher._id })
        .populate('subject', 'name code')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: notes.length,
        data: notes,
    });
});

module.exports = {
    uploadNote,
    getNotes,
    getNote,
    downloadNote,
    updateNote,
    deleteNote,
    getNotesBySubject,
    getMyNotes,
};
