const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'teacher', 'student', 'parent'],
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'attendance', 'fees', 'marks', 'leave', 'scholarship', 'general'],
        default: 'info',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
