const express = require('express');
const {
    createNotice,
    getMyNotices,
    getNoticeById,
    markAsRead,
    getAllNotices,
    updateNotice,
    deleteNotice,
    getNoticeAnalytics,
    getUnreadCount
} = require('../controllers/noticeController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users can access their targeted notices)
router.get('/my-notices', getMyNotices);
router.get('/unread-count', getUnreadCount);
router.get('/:id', getNoticeById);
router.put('/:id/read', markAsRead);

// Notice creation route - requires communication create permission
// Based on roles.js: super_admin, admin, teacher, receptionist
router.post('/',
    checkPermission('communication', 'create'),
    createNotice
);

// Notice management routes - requires communication read permission
// Based on roles.js: super_admin, admin, receptionist (teachers have read but not full management)
router.get('/',
    checkPermission('communication', 'read'),
    getAllNotices
);

// Notice update route - requires communication update permission
// Additional authorization check in controller (creator or admin)
router.put('/:id',
    checkPermission('communication', 'update'),
    updateNotice
);

// Notice deletion route - requires communication delete permission
// Additional authorization check in controller (creator or admin)
router.delete('/:id',
    checkPermission('communication', 'delete'),
    deleteNotice
);

// Analytics route - requires communication read permission
// Additional authorization check in controller (creator or admin)
router.get('/:id/analytics',
    checkPermission('communication', 'read'),
    getNoticeAnalytics
);

module.exports = router;