const mongoose = require('mongoose');

const frontOfficeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['admission_inquiry', 'visitor', 'phone_call', 'postal', 'complaint', 'general'],
        required: [true, 'Entry type is required'],
    },
    // Visitor / Inquiry details
    visitorName: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    purpose: {
        type: String,
        required: [true, 'Purpose is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // For admission inquiries
    studentName: {
        type: String,
        trim: true,
    },
    courseInterested: {
        type: String,
        trim: true,
    },
    previousSchool: {
        type: String,
        trim: true,
    },
    // For visitors
    idProof: {
        type: String,
        trim: true,
    },
    personToMeet: {
        type: String,
        trim: true,
    },
    checkInTime: {
        type: Date,
        default: Date.now,
    },
    checkOutTime: {
        type: Date,
        default: null,
    },
    // For phone calls
    callType: {
        type: String,
        enum: ['incoming', 'outgoing', null],
        default: null,
    },
    // For postal
    referenceNo: {
        type: String,
        trim: true,
    },
    fromAddress: {
        type: String,
        trim: true,
    },
    toAddress: {
        type: String,
        trim: true,
    },
    // Status tracking
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open',
    },
    followUpDate: {
        type: Date,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

frontOfficeSchema.index({ type: 1, status: 1, createdAt: -1 });
frontOfficeSchema.index({ visitorName: 'text', purpose: 'text' });

module.exports = mongoose.model('FrontOffice', frontOfficeSchema);
