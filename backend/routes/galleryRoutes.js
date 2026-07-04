const express = require('express');
const router = express.Router();
const {
    uploadImage,
    getAllImages,
    getCarouselImages,
    getImagesByCategory,
    updateImage,
    deleteImage,
    reorderImages,
    getCategories,
} = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

// Public routes
router.get('/', getAllImages);
router.get('/carousel', getCarouselImages);
router.get('/categories', getCategories);
router.get('/category/:category', getImagesByCategory);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', uploadMiddleware('galleryImage'), uploadImage);
router.put('/reorder', reorderImages);
router.put('/:id', uploadMiddleware('galleryImage'), updateImage);
router.delete('/:id', deleteImage);

module.exports = router;
