const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    teachingAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeachingAssignment',
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Leave'],
        required: [true, 'Attendance status is required'],
    },
    lectureNumber: {
        type: Number,
        default: 1,
    },
    remarks: {
        type: String,
    },
    verificationMode: {
        type: String,
        enum: ['Manual', 'Fingerprint', 'Face'],
        default: 'Manual',
    },
    faceCapture: {
        imageUrl: { type: String },
        capturedAt: { type: Date },
        detector: { type: String },
    },
    semester: {
        type: Number,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    section: {
        type: String,
        default: 'A',
    },
}, {
    timestamps: true,
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ student: 1, subject: 1, date: 1, lectureNumber: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ date: 1, department: 1, semester: 1 });

// Static method to get attendance percentage
attendanceSchema.statics.getAttendancePercentage = async function (studentId, subjectId, startDate, endDate) {
    const result = await this.aggregate([
        {
            $match: {
                student: mongoose.Types.ObjectId(studentId),
                subject: mongoose.Types.ObjectId(subjectId),
                date: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                present: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0],
                    },
                },
            },
        },
    ]);

    if (result.length === 0) return 0;
    return Math.round((result[0].present / result[0].total) * 100);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
