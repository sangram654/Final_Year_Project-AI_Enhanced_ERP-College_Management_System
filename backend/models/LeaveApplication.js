const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    applicantType: {
        type: String,
        enum: ['Student', 'Teacher', 'Admin', 'SuperAdmin'],
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    leaveType: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Medical Leave', 'Personal', 'Other'],
        required: true,
    },
    fromDate: {
        type: Date,
        required: [true, 'From date is required'],
    },
    toDate: {
        type: Date,
        required: [true, 'To date is required'],
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending',
    },
    approvalFlow: {
        teacher: {
            status: {
                type: String,
                enum: ['Pending', 'Approved', 'Rejected'],
                default: 'Pending',
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            reviewDate: {
                type: Date,
            },
            remarks: {
                type: String,
            },
        },
        admin: {
            status: {
                type: String,
                enum: ['Pending', 'Approved', 'Rejected'],
                default: 'Pending',
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            reviewDate: {
                type: Date,
            },
            remarks: {
                type: String,
            },
        },
        superAdmin: {
            status: {
                type: String,
                enum: ['Pending', 'Approved', 'Rejected'],
                default: 'Pending',
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            reviewDate: {
                type: Date,
            },
            remarks: {
                type: String,
            },
        },
    },
    documents: [{
        name: { type: String },
        url: { type: String },
    }],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewDate: {
        type: Date,
    },
    reviewRemarks: {
        type: String,
    },
    numberOfDays: {
        type: Number,
    },
}, {
    timestamps: true,
});

// Calculate number of days before saving
leaveApplicationSchema.pre('save', function (next) {
    if (this.fromDate && this.toDate) {
        const diffTime = Math.abs(this.toDate - this.fromDate);
        this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    next();
});

// Index for faster queries
leaveApplicationSchema.index({ applicant: 1, status: 1 });
leaveApplicationSchema.index({ fromDate: 1, toDate: 1 });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
