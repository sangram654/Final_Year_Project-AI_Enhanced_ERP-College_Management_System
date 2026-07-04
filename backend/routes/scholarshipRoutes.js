const express = require('express');
const router = express.Router();
const {
    createScholarship,
    getScholarships,
    getScholarship,
    applyForScholarship,
    getMyApplications,
    getAllApplications,
    reviewApplication,
    updateScholarship,
    deleteScholarship,
    getScholarshipAnalytics,
} = require('../controllers/scholarshipController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// Public routes
router.get('/', getScholarships);
router.get('/:id([0-9a-fA-F]{24})', getScholarship);

// Protected routes
router.use(protect);

// Student routes
router.post('/:id/apply', authorize('student'), uploadMiddleware('scholarshipDoc'), applyForScholarship);
router.get('/student/my-applications', authorize('student'), getMyApplications);

// Admin only routes
router.post('/', authorize('admin'), createScholarship);
router.put('/:id', authorize('admin'), updateScholarship);
router.delete('/:id', authorize('admin'), deleteScholarship);
router.get('/admin/applications', authorize('admin'), getAllApplications);
router.put('/applications/:id/review', authorize('admin'), reviewApplication);
router.get('/admin/analytics', authorize('admin'), getScholarshipAnalytics);

module.exports = router;
