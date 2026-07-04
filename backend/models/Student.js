const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        uppercase: true,
    },
    enrollmentNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning'],
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        enum: ['B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'Diploma'],
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8,
    },
    section: {
        type: String,
        default: 'A',
        enum: ['A', 'B', 'C', 'D'],
    },
    batch: {
        type: String,
        required: [true, 'Batch year is required'],
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    category: {
        type: String,
        enum: ['General', 'OBC', 'SC', 'ST', 'EWS'],
        default: 'General',
    },
    aadharNumber: {
        type: String,
        match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhar number'],
    },
    parentGuardian: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
    },
    enrolledSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    academicHistory: [{
        year: String,
        semester: Number,
        sgpa: Number,
        cgpa: Number,
        remarks: String,
    }],
    documents: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
studentSchema.index({ rollNumber: 1, department: 1, semester: 1 });

module.exports = mongoose.model('Student', studentSchema);
