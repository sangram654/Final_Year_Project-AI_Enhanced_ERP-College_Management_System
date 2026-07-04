const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getIncome,
    addIncome,
    deleteIncome,
    getExpenses,
    addExpense,
    deleteExpense,
    getAccountantDashboard,
} = require('../controllers/accountantController');

// All routes require authentication
router.use(protect);
router.use(authorize('accountant', 'super_admin', 'admin'));

// Dashboard
router.get('/dashboard', getAccountantDashboard);

// Income
router.get('/income', getIncome);
router.post('/income', addIncome);
router.delete('/income/:id', deleteIncome);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', addExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;
