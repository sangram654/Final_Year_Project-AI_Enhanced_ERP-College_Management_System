const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, 'Subject name is required'],
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning'],
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8,
    },
    credits: {
        type: Number,
        required: [true, 'Credits are required'],
        min: 1,
        max: 6,
    },
    type: {
        type: String,
        enum: ['Theory', 'Practical', 'Theory + Practical'],
        default: 'Theory',
    },
    maxMarks: {
        theory: { type: Number, default: 80 },
        practical: { type: Number, default: 20 },
        internal: { type: Number, default: 20 },
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    syllabus: {
        type: String,
    },
    isElective: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
subjectSchema.index({ code: 1, department: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
