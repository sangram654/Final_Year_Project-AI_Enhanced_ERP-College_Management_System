const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
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
    semester: {
        type: Number,
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    examType: {
        type: String,
        enum: ['Internal', 'Internal 1', 'Internal 2', 'Mid-Term', 'Mid Term', 'End-Term', 'End Term', 'Practical', 'Assignment', 'Backlog'],
        required: true,
    },
    teachingAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeachingAssignment',
    },
    maxMarks: {
        type: Number,
        required: true,
    },
    obtainedMarks: {
        type: Number,
        required: true,
    },
    grade: {
        type: String,
        enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'AB'],
    },
    status: {
        type: String,
        enum: ['Pass', 'Fail', 'Absent', 'Withheld'],
        default: 'Pass',
    },
    attemptNumber: {
        type: Number,
        default: 1,
    },
    remarks: {
        type: String,
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
}, {
    timestamps: true,
});

// Calculate grade before saving
marksSchema.pre('save', function (next) {
    const percentage = (this.obtainedMarks / this.maxMarks) * 100;

    if (percentage >= 90) this.grade = 'O';
    else if (percentage >= 80) this.grade = 'A+';
    else if (percentage >= 70) this.grade = 'A';
    else if (percentage >= 60) this.grade = 'B+';
    else if (percentage >= 50) this.grade = 'B';
    else if (percentage >= 40) this.grade = 'C';
    else if (percentage >= 33) this.grade = 'D';
    else this.grade = 'F';

    this.status = percentage >= 33 ? 'Pass' : 'Fail';

    next();
});

// Compound index for unique marks entry
marksSchema.index({ student: 1, subject: 1, examType: 1, academicYear: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
