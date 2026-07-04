const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    checkoutVisitor,
    getFrontOfficeDashboard,
} = require('../controllers/frontOfficeController');

// All routes require authentication
router.use(protect);
router.use(authorize('receptionist', 'super_admin', 'admin'));

// Dashboard
router.get('/dashboard', getFrontOfficeDashboard);

// Entries CRUD
router.get('/', getEntries);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

// Visitor checkout
router.put('/:id/checkout', checkoutVisitor);

module.exports = router;
