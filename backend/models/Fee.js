const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Fee name is required'],
    },
    department: {
        type: String,
        required: true,
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning', 'All'],
    },
    course: {
        type: String,
        enum: ['B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'Diploma', 'All'],
        default: 'All',
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
    },
    academicYear: {
        type: String,
        required: true,
    },
    components: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        isOptional: { type: Boolean, default: false },
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    lateFee: {
        type: Number,
        default: 0,
    },
    lateFeePerDay: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    feeStructure: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure',
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    dueAmount: {
        type: Number,
        required: true,
    },
    lateFee: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
        default: 'Pending',
    },
    dueDate: {
        type: Date,
        required: true,
    },
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    }],
}, {
    timestamps: true,
});

// Index for faster queries
feeSchema.index({ student: 1, academicYear: 1, semester: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const Fee = mongoose.model('Fee', feeSchema);

module.exports = { FeeStructure, Fee };
