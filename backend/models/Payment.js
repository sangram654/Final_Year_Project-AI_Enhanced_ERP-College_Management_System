const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    fee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fee',
        required: true,
    },
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: 1,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Online', 'Cheque', 'DD', 'UPI', 'Card'],
        required: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Completed',
    },
    receiptNumber: {
        type: String,
        unique: true,
    },
    receiptUrl: {
        type: String,
    },
    remarks: {
        type: String,
    },
    // Payment gateway details (for online payments)
    gatewayResponse: {
        orderId: String,
        paymentId: String,
        signature: String,
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Generate transaction ID before saving
paymentSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN${timestamp}${randomStr}`;
    }

    if (!this.receiptNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments() + 1;
        this.receiptNumber = `RCP${year}${count.toString().padStart(6, '0')}`;
    }

    next();
});

// Index for faster queries
paymentSchema.index({ student: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
