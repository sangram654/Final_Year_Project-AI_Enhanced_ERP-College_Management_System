const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject,
    sendNotification,
    getReports,
    bulkAssignFees,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// Subject management
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Notifications
router.post('/notifications', sendNotification);

// Reports
router.get('/reports', getReports);

// Bulk operations
router.post('/fees/bulk-assign', bulkAssignFees);

module.exports = router;
