const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    instructions: {
        type: String,
        trim: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class is required'],
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher is required'],
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    totalMarks: {
        type: Number,
        default: 100,
        min: 1,
    },
    file: {
        url: String,
        filename: String,
        size: Number,
        mimetype: String,
    },
    status: {
        type: String,
        enum: ['Active', 'Closed', 'Draft'],
        default: 'Active',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for submissions
assignmentSchema.virtual('submissions', {
    ref: 'AssignmentSubmission',
    localField: '_id',
    foreignField: 'assignment',
});

// Virtual for submission count
assignmentSchema.virtual('submissionCount', {
    ref: 'AssignmentSubmission',
    localField: '_id',
    foreignField: 'assignment',
    count: true,
});

// Submission Schema
const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    file: {
        url: {
            type: String,
            required: [true, 'Submission file is required'],
        },
        filename: String,
        size: Number,
        mimetype: String,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    marks: {
        type: Number,
        min: 0,
    },
    feedback: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Submitted', 'Graded', 'Late'],
        default: 'Submitted',
    },
    isLate: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Check if submission is late
submissionSchema.pre('save', async function(next) {
    if (this.isNew) {
        const assignment = await mongoose.model('Assignment').findById(this.assignment);
        if (assignment && new Date() > new Date(assignment.dueDate)) {
            this.isLate = true;
            this.status = 'Late';
        }
    }
    next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
const AssignmentSubmission = mongoose.model('AssignmentSubmission', submissionSchema);

module.exports = { Assignment, AssignmentSubmission };
