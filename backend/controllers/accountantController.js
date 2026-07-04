const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');

// ===== INCOME =====

// @desc    Get all income entries
// @route   GET /api/accountant/income
// @access  Private (Accountant, Super Admin, Admin)
const getIncome = asyncHandler(async (req, res) => {
    const { incomeHead, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (incomeHead) query.incomeHead = incomeHead;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Income.countDocuments(query);
    const income = await Income.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    // Total amount
    const totalAmount = await Income.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
        success: true,
        data: income,
        totalAmount: totalAmount[0]?.total || 0,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Add income entry
// @route   POST /api/accountant/income
// @access  Private (Accountant, Super Admin, Admin)
const addIncome = asyncHandler(async (req, res) => {
    const entry = await Income.create({
        ...req.body,
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        message: 'Income entry added successfully',
        data: entry,
    });
});

// @desc    Delete income entry
// @route   DELETE /api/accountant/income/:id
// @access  Private (Accountant, Super Admin, Admin)
const deleteIncome = asyncHandler(async (req, res) => {
    const entry = await Income.findById(req.params.id);
    if (!entry) {
        return res.status(404).json({ success: false, message: 'Income entry not found' });
    }
    await Income.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Income entry deleted successfully' });
});

// ===== EXPENSE =====

// @desc    Get all expense entries
// @route   GET /api/accountant/expenses
// @access  Private (Accountant, Super Admin, Admin)
const getExpenses = asyncHandler(async (req, res) => {
    const { expenseHead, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (expenseHead) query.expenseHead = expenseHead;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const totalAmount = await Expense.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
        success: true,
        data: expenses,
        totalAmount: totalAmount[0]?.total || 0,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Add expense entry
// @route   POST /api/accountant/expenses
// @access  Private (Accountant, Super Admin, Admin)
const addExpense = asyncHandler(async (req, res) => {
    const entry = await Expense.create({
        ...req.body,
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        message: 'Expense entry added successfully',
        data: entry,
    });
});

// @desc    Delete expense entry
// @route   DELETE /api/accountant/expenses/:id
// @access  Private (Accountant, Super Admin, Admin)
const deleteExpense = asyncHandler(async (req, res) => {
    const entry = await Expense.findById(req.params.id);
    if (!entry) {
        return res.status(404).json({ success: false, message: 'Expense entry not found' });
    }
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expense entry deleted successfully' });
});

// ===== ACCOUNTANT DASHBOARD =====

// @desc    Get accountant dashboard stats
// @route   GET /api/accountant/dashboard
// @access  Private (Accountant, Super Admin, Admin)
const getAccountantDashboard = asyncHandler(async (req, res) => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Total Income this month
    const monthlyIncome = await Income.aggregate([
        { $match: { date: { $gte: currentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Total Expense this month
    const monthlyExpense = await Expense.aggregate([
        { $match: { date: { $gte: currentMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Total Fee Collected this month
    const monthlyFeeCollection = await Payment.aggregate([
        { $match: { paymentDate: { $gte: currentMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Pending fees count
    const { Fee } = require('../models/Fee');
    const pendingFees = await Fee.countDocuments({ status: 'pending' });
    const totalStudents = await Student.countDocuments({ isActive: true });

    // Recent payments
    const recentPayments = await Payment.find({ status: 'completed' })
        .populate('student', 'firstName lastName')
        .sort({ paymentDate: -1 })
        .limit(10);

    // Income by head
    const incomeByHead = await Income.aggregate([
        { $match: { date: { $gte: currentMonth } } },
        { $group: { _id: '$incomeHead', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
    ]);

    // Expense by head
    const expenseByHead = await Expense.aggregate([
        { $match: { date: { $gte: currentMonth } } },
        { $group: { _id: '$expenseHead', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
    ]);

    res.json({
        success: true,
        data: {
            stats: {
                monthlyIncome: monthlyIncome[0]?.total || 0,
                monthlyExpense: monthlyExpense[0]?.total || 0,
                monthlyFeeCollection: monthlyFeeCollection[0]?.total || 0,
                pendingFees,
                totalStudents,
            },
            recentPayments,
            incomeByHead,
            expenseByHead,
        },
    });
});

module.exports = {
    getIncome,
    addIncome,
    deleteIncome,
    getExpenses,
    addExpense,
    deleteExpense,
    getAccountantDashboard,
};
