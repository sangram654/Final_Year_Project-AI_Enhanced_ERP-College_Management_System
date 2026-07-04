const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    incomeHead: {
        type: String,
        required: [true, 'Income head is required'],
        trim: true,
    },
    invoiceNo: {
        type: String,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', 'online', 'other'],
        default: 'cash',
    },
    attachmentPath: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

incomeSchema.index({ incomeHead: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
