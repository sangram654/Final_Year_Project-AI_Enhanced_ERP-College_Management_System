const { Fee, FeeStructure } = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { assignMissingFees } = require('../utils/feeAssignment');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Private (Admin)
const createFeeStructure = asyncHandler(async (req, res) => {
    const structure = await FeeStructure.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: structure,
    });
});

// @desc    Get all fee structures
// @route   GET /api/fees/structures
// @access  Private (Admin)
const getFeeStructures = asyncHandler(async (req, res) => {
    const { department, academicYear, isActive } = req.query;

    const query = {};
    if (department) query.department = department;
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const structures = await FeeStructure.find(query).sort({ createdAt: -1 });

    res.json({
        success: true,
        data: structures,
    });
});

// @desc    Assign fee to student
// @route   POST /api/fees/assign
// @access  Private (Admin)
const assignFeeToStudent = asyncHandler(async (req, res) => {
    const { studentId, feeStructureId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student not found',
        });
    }

    const structure = await FeeStructure.findById(feeStructureId);
    if (!structure) {
        return res.status(404).json({
            success: false,
            message: 'Fee structure not found',
        });
    }

    // Check if fee already assigned
    const existingFee = await Fee.findOne({
        student: studentId,
        feeStructure: feeStructureId,
        academicYear: structure.academicYear,
    });

    if (existingFee) {
        return res.status(400).json({
            success: false,
            message: 'Fee already assigned for this academic year',
        });
    }

    const fee = await Fee.create({
        student: studentId,
        feeStructure: feeStructureId,
        academicYear: structure.academicYear,
        semester: student.semester,
        totalAmount: structure.totalAmount,
        dueAmount: structure.totalAmount,
        dueDate: structure.dueDate,
    });

    // Notify student
    const studentUser = await require('../models/User').findById(student.user);
    if (studentUser) {
        await Notification.create({
            recipient: studentUser._id,
            recipientRole: 'student',
            title: 'Fee Assigned',
            message: `Fee of ₹${structure.totalAmount} has been assigned. Due date: ${structure.dueDate.toLocaleDateString()}`,
            type: 'fees',
        });
    }

    res.status(201).json({
        success: true,
        message: 'Fee assigned successfully',
        data: fee,
    });
});

// @desc    Get my fees (for logged-in student)
// @route   GET /api/fees/my-fees
// @access  Private (Student)
const getMyFees = asyncHandler(async (req, res) => {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.studentProfile) {
        return res.status(400).json({
            success: false,
            message: 'Student profile not found',
        });
    }

    const studentId = user.studentProfile;
    const { academicYear } = req.query;

    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;

    let fees = await Fee.find(query)
        .populate('feeStructure')
        .populate('payments')
        .sort({ createdAt: -1 });

    // If no fees found, try to auto-assign from active fee structures
    if (fees.length === 0) {
        const student = await Student.findById(studentId);
        if (student) {
            // Find active fee structures matching student's department and semester
            const activeStructures = await FeeStructure.find({
                isActive: true,
                $or: [
                    { department: student.department },
                    { department: 'All' },
                    { department: { $exists: false } }
                ]
            });

            // Auto-assign fees
            for (const structure of activeStructures) {
                const existingFee = await Fee.findOne({
                    student: studentId,
                    feeStructure: structure._id,
                    academicYear: structure.academicYear,
                });

                if (!existingFee) {
                    await Fee.create({
                        student: studentId,
                        feeStructure: structure._id,
                        academicYear: structure.academicYear,
                        semester: student.semester,
                        totalAmount: structure.totalAmount,
                        dueAmount: structure.totalAmount,
                        dueDate: structure.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                }
            }

            // Re-fetch fees after assignment
            fees = await Fee.find(query)
                .populate('feeStructure')
                .populate('payments')
                .sort({ createdAt: -1 });
        }
    }

    // Calculate summary
    const summary = fees.reduce(
        (acc, fee) => ({
            totalAmount: acc.totalAmount + fee.totalAmount,
            paidAmount: acc.paidAmount + fee.paidAmount,
            dueAmount: acc.dueAmount + fee.dueAmount,
        }),
        { totalAmount: 0, paidAmount: 0, dueAmount: 0 }
    );

    res.json({
        success: true,
        data: fees,
        summary,
    });
});

// @desc    Get student fees
// @route   GET /api/fees/student/:studentId
// @access  Private
const getStudentFees = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query)
        .populate('feeStructure')
        .populate('payments')
        .sort({ createdAt: -1 });

    // Calculate summary
    const summary = fees.reduce(
        (acc, fee) => ({
            totalAmount: acc.totalAmount + fee.totalAmount,
            paidAmount: acc.paidAmount + fee.paidAmount,
            dueAmount: acc.dueAmount + fee.dueAmount,
        }),
        { totalAmount: 0, paidAmount: 0, dueAmount: 0 }
    );

    res.json({
        success: true,
        data: fees,
        summary,
    });
});

// @desc    Make payment
// @route   POST /api/fees/payment
// @access  Private
const makePayment = asyncHandler(async (req, res) => {
    const { feeId, amount, paymentMethod, remarks, transactionId } = req.body;

    const fee = await Fee.findById(feeId);
    if (!fee) {
        return res.status(404).json({
            success: false,
            message: 'Fee record not found',
        });
    }

    if (amount > fee.dueAmount) {
        return res.status(400).json({
            success: false,
            message: 'Payment amount exceeds due amount',
        });
    }

    const paymentMethodMap = {
        cash: 'Cash',
        online: 'Online',
        cheque: 'Cheque',
        dd: 'DD',
        upi: 'UPI',
        card: 'Card',
        Cash: 'Cash',
        Online: 'Online',
        Cheque: 'Cheque',
        DD: 'DD',
        UPI: 'UPI',
        Card: 'Card',
    };

    const normalizedPaymentMethod = paymentMethodMap[paymentMethod];
    if (!normalizedPaymentMethod) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment method',
        });
    }

    // Create payment
    const payment = await Payment.create({
        student: fee.student,
        fee: feeId,
        transactionId: transactionId || `TXN${Date.now()}`,
        amount,
        paymentMethod: normalizedPaymentMethod,
        remarks,
        processedBy: req.user.id,
    });

    // Update fee
    fee.paidAmount += amount;
    fee.dueAmount -= amount;
    fee.payments.push(payment._id);

    if (fee.dueAmount === 0) {
        fee.status = 'Paid';
    } else if (fee.paidAmount > 0) {
        fee.status = 'Partial';
    }

    await fee.save();

    // Generate receipt
    const receiptPath = await generateReceipt(payment, fee);
    payment.receiptUrl = receiptPath;
    await payment.save();

    // Notify student
    const student = await Student.findById(fee.student).populate('user');
    if (student && student.user) {
        await Notification.create({
            recipient: student.user._id,
            recipientRole: 'student',
            title: 'Payment Successful',
            message: `Payment of ₹${amount} received. Receipt: ${payment.receiptNumber}`,
            type: 'fees',
        });
    }

    res.status(201).json({
        success: true,
        message: 'Payment successful',
        data: {
            payment,
            fee,
            receiptUrl: receiptPath,
        },
    });
});

// Generate PDF receipt
const generateReceipt = async (payment, fee) => {
    const student = await Student.findById(fee.student).populate('user');

    const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const filename = `receipt_${payment.receiptNumber}.pdf`;
    const filepath = path.join(receiptsDir, filename);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('SAMARTH COLLEGE OF ENGINEERING & MANAGEMENT', { align: 'center' });
        doc.fontSize(12).text('Belhe, Pune', { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).text('FEE RECEIPT', { align: 'center', underline: true });
        doc.moveDown();

        // Receipt details
        doc.fontSize(12);
        doc.text(`Receipt No: ${payment.receiptNumber}`);
        doc.text(`Date: ${payment.paymentDate.toLocaleDateString()}`);
        doc.text(`Transaction ID: ${payment.transactionId}`);
        doc.moveDown();

        // Student details
        doc.text(`Student Name: ${student.user.firstName} ${student.user.lastName}`);
        doc.text(`Roll Number: ${student.rollNumber}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`Semester: ${student.semester}`);
        doc.moveDown();

        // Payment details
        doc.text('Payment Details:', { underline: true });
        doc.text(`Amount Paid: ₹${payment.amount}`);
        doc.text(`Payment Method: ${payment.paymentMethod}`);
        doc.text(`Academic Year: ${fee.academicYear}`);
        doc.moveDown();

        // Fee summary
        doc.text('Fee Summary:', { underline: true });
        doc.text(`Total Fee: ₹${fee.totalAmount}`);
        doc.text(`Amount Paid (Total): ₹${fee.paidAmount}`);
        doc.text(`Balance Due: ₹${fee.dueAmount}`);
        doc.moveDown(2);

        // Footer
        doc.text('This is a computer generated receipt.', { align: 'center', fontSize: 10 });

        doc.end();

        stream.on('finish', () => {
            resolve(`/uploads/receipts/${filename}`);
        });

        stream.on('error', reject);
    });
};

// @desc    Get payment history
// @route   GET /api/fees/payments/:studentId
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const payments = await Payment.find({ student: studentId })
        .populate('fee')
        .sort({ paymentDate: -1 });

    res.json({
        success: true,
        data: payments,
    });
});

// @desc    Get fee analytics
// @route   GET /api/fees/analytics
// @access  Private (Admin)
const getFeeAnalytics = asyncHandler(async (req, res) => {
    const { academicYear, department } = req.query;

    const matchQuery = {};
    if (academicYear) matchQuery.academicYear = academicYear;

    // Overall collection summary
    const summary = await Fee.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalFees: { $sum: '$totalAmount' },
                collected: { $sum: '$paidAmount' },
                pending: { $sum: '$dueAmount' },
                totalStudents: { $sum: 1 },
                paidFull: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
                partial: { $sum: { $cond: [{ $eq: ['$status', 'Partial'] }, 1, 0] } },
                pendingPayment: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
            },
        },
    ]);

    // Monthly collection trend
    const monthlyTrend = await Payment.aggregate([
        { $match: { status: 'Completed' } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            summary: summary[0] || {},
            monthlyTrend,
        },
    });
});

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Private (Admin)
const updateFeeStructure = asyncHandler(async (req, res) => {
    const structure = await FeeStructure.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!structure) {
        return res.status(404).json({
            success: false,
            message: 'Fee structure not found',
        });
    }

    res.json({
        success: true,
        message: 'Fee structure updated successfully',
        data: structure,
    });
});

// @desc    Get overdue fees
// @route   GET /api/fees/overdue
// @access  Private (Admin)
// @desc    Get all fees (for admin)
// @route   GET /api/fees
// @access  Private (Admin)
const getAllFees = asyncHandler(async (req, res) => {
    const { status, department, semester } = req.query;

    const query = {};
    if (status) query.status = status;

    const fees = await Fee.find(query)
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName email phone' },
            match: department ? { department } : {},
        })
        .populate('feeStructure')
        .sort({ createdAt: -1 });

    // Filter out null students if department filter was applied
    const filteredFees = fees.filter(fee => fee.student);

    res.json({
        success: true,
        count: filteredFees.length,
        data: filteredFees,
    });
});

const getOverdueFees = asyncHandler(async (req, res) => {
    const today = new Date();

    const overdueFees = await Fee.find({
        dueDate: { $lt: today },
        status: { $in: ['Pending', 'Partial'] },
    })
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName email phone' },
        })
        .populate('feeStructure')
        .sort({ dueDate: 1 });

    res.json({
        success: true,
        count: overdueFees.length,
        data: overdueFees,
    });
});

// @desc    Assign missing fees to all students
// @route   POST /api/fees/assign-missing
// @access  Private (Admin)
const assignMissingFeesToAll = asyncHandler(async (req, res) => {
    const assignedCount = await assignMissingFees();
    
    res.json({
        success: true,
        message: `Successfully assigned fees to ${assignedCount} students`,
        data: { assignedCount }
    });
});

module.exports = {
    createFeeStructure,
    getFeeStructures,
    assignFeeToStudent,
    getStudentFees,
    getMyFees,
    makePayment,
    getPaymentHistory,
    getFeeAnalytics,
    updateFeeStructure,
    getAllFees,
    getOverdueFees,
    assignMissingFeesToAll,
};
