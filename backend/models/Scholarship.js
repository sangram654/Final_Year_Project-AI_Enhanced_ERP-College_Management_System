const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Scholarship name is required'],
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Merit', 'Need-Based', 'Sports', 'Government', 'Private', 'Other'],
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Scholarship amount is required'],
    },
    eligibility: {
        minPercentage: { type: Number, default: 0 },
        maxFamilyIncome: { type: Number },
        categories: [{ type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] }],
        departments: [{ type: String }],
    },
    deadline: {
        type: Date,
        required: true,
    },
    documentsRequired: [{
        type: String,
    }],
    maxRecipients: {
        type: Number,
    },
    academicYear: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const scholarshipApplicationSchema = new mongoose.Schema({
    scholarship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scholarship',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    applicationDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Disbursed'],
        default: 'Pending',
    },
    documents: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
    }],
    familyIncome: {
        type: Number,
    },
    percentage: {
        type: Number,
    },
    remarks: {
        type: String,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewDate: {
        type: Date,
    },
    approvedAmount: {
        type: Number,
    },
    disbursementDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Compound index to prevent duplicate applications
scholarshipApplicationSchema.index({ scholarship: 1, student: 1 }, { unique: true });

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
const ScholarshipApplication = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);

module.exports = { Scholarship, ScholarshipApplication };
