const mongoose = require('mongoose');

const backlogSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    originalSemester: {
        type: Number,
        required: true,
    },
    originalAcademicYear: {
        type: String,
        required: true,
    },
    originalMarks: {
        type: Number,
    },
    examType: {
        type: String,
        enum: ['Theory', 'Practical', 'Both'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Open', 'Cleared', 'Registered'],
        default: 'Open',
    },
    attempts: [{
        attemptNumber: { type: Number, required: true },
        academicYear: { type: String, required: true },
        examDate: { type: Date },
        marks: { type: Number },
        result: { type: String, enum: ['Pass', 'Fail', 'Absent'] },
        remarks: { type: String },
    }],
    clearedDate: {
        type: Date,
    },
    clearedMarks: {
        type: Number,
    },
}, {
    timestamps: true,
});

// Compound index for unique backlog entry
backlogSchema.index({ student: 1, subject: 1, originalAcademicYear: 1 }, { unique: true });

// Index for faster queries
backlogSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Backlog', backlogSchema);
