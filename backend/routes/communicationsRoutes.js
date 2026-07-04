const express = require('express');
const router = express.Router();
const {
    getCommunications,
    createCommunication,
} = require('../controllers/communicationsController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Communications routes - for receptionist and admin
router.get('/', authorize('receptionist', 'admin', 'super_admin'), getCommunications);
router.post('/', authorize('receptionist', 'admin', 'super_admin'), createCommunication);

module.exports = router;