const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        uppercase: true,
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning'],
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Assistant', 'HOD'],
    },
    specialization: {
        type: String,
    },
    qualification: {
        type: String,
        required: [true, 'Qualification is required'],
    },
    experience: {
        type: Number,
        default: 0,
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    assignedClasses: [{
        department: String,
        semester: Number,
        section: String,
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
    }],
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    salary: {
        basic: Number,
        allowances: Number,
        deductions: Number,
    },
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
teacherSchema.index({ employeeId: 1, department: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
