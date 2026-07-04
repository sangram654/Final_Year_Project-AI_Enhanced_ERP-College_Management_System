const mongoose = require('mongoose');

/**
 * Class Model
 * Represents a class/division in the college (e.g., Computer Engineering - Semester 5 - Section A)
 */
const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true,
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
    section: {
        type: String,
        required: [true, 'Section is required'],
        enum: ['A', 'B', 'C', 'D'],
        default: 'A',
    },
    batch: {
        type: String,
        required: [true, 'Batch is required'],
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
    },
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    roomNumber: {
        type: String,
    },
    strength: {
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

// Compound unique index - each class is uniquely identified by department + semester + section + academicYear
classSchema.index({ department: 1, semester: 1, section: 1, academicYear: 1 }, { unique: true });

// Virtual for display name
classSchema.virtual('displayName').get(function () {
    return `${this.department} - Sem ${this.semester} - Sec ${this.section}`;
});

// Ensure virtuals are included in JSON output
classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
