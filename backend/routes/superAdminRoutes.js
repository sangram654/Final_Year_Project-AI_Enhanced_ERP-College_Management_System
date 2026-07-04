const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const { protect, authorize } = require('../middleware/auth');
const {
    getSuperAdminDashboard,
    getAllUsers,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getRolesConfig,
} = require('../controllers/superAdminController');

// All routes require authentication + super_admin role
router.use(protect);
router.use(authorize('super_admin'));

// --- Dashboard ---
router.get('/dashboard', getSuperAdminDashboard);

// --- Users management ---
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// --- Roles config ---
router.get('/roles', getRolesConfig);

module.exports = router;