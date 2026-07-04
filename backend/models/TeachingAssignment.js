const mongoose = require('mongoose');

/**
 * TeachingAssignment Model
 * Single source of truth for Teacher → Class → Subject mapping
 * Created and managed by Admin
 */
const teachingAssignmentSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher is required'],
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class is required'],
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Subject is required'],
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        default: () => {
            const now = new Date();
            const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
            return `${year}-${year + 1}`;
        },
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: 1,
        max: 8,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Compound unique index - one teacher teaches one subject to one class per academic year
teachingAssignmentSchema.index(
    { teacherId: 1, classId: 1, subjectId: 1, academicYear: 1 },
    { unique: true }
);

// Index for faster teacher-based queries
teachingAssignmentSchema.index({ teacherId: 1, isActive: 1 });

// Ensure virtuals are included in JSON output
teachingAssignmentSchema.set('toJSON', { virtuals: true });
teachingAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TeachingAssignment', teachingAssignmentSchema);
