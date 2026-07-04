const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['Notes', 'Assignment', 'Question Paper', 'Reference', 'Presentation', 'Lab Manual', 'Other'],
        default: 'Notes',
    },
    file: {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        mimeType: { type: String },
    },
    tags: [{
        type: String,
    }],
    unit: {
        type: Number,
        min: 1,
        max: 6,
    },
    isVisible: {
        type: Boolean,
        default: true,
    },
    // Assignment functionality
    assignmentType: {
        type: String,
        enum: ['department', 'specific_students', 'all'],
        default: 'department',
    },
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    }],
    assignedDepartments: [{
        type: String,
    }],
    // Due date for assignments
    dueDate: {
        type: Date,
    },
    // Priority level
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
    },
    downloads: {
        type: Number,
        default: 0,
    },
    downloadHistory: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        downloadedAt: { type: Date, default: Date.now },
        ipAddress: String,
    }],
}, {
    timestamps: true,
});

// Index for faster queries
noteSchema.index({ subject: 1, department: 1, semester: 1 });
noteSchema.index({ title: 'text', description: 'text', tags: 'text' });
noteSchema.index({ assignedStudents: 1 });
noteSchema.index({ assignedDepartments: 1 });
noteSchema.index({ teacher: 1 });

module.exports = mongoose.model('Note', noteSchema);
