const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    relation: {
        type: String,
        required: [true, 'Relation is required'],
        enum: ['Father', 'Mother', 'Guardian'],
    },
    occupation: {
        type: String,
    },
    annualIncome: {
        type: Number,
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    }],
    alternatePhone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    preferredContactMethod: {
        type: String,
        enum: ['Phone', 'Email', 'SMS', 'WhatsApp'],
        default: 'Phone',
    },
    notifications: [{
        message: String,
        type: {
            type: String,
            enum: ['attendance', 'fees', 'marks', 'leave', 'general'],
        },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Parent', parentSchema);
