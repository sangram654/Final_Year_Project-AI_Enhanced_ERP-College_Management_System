const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['announcement', 'sms', 'email', 'notice'],
        required: true,
    },
    recipient: {
        type: String,
        enum: [
            'all_students',
            'all_parents',
            'all_teachers',
            'specific_department',
            'specific_semester',
            'custom',
        ],
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
    },
    status: {
        type: String,
        enum: ['scheduled', 'sent', 'failed'],
        default: 'sent',
    },
    scheduledFor: {
        type: Date,
        default: null,
    },
    sentAt: {
        type: Date,
        default: null,
    },
    recipientCount: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Communication', communicationSchema);
