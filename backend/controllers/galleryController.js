const CollegeGallery = require('../models/CollegeGallery');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

// @desc    Upload gallery image
// @route   POST /api/gallery
// @access  Private (Admin)
const uploadImage = asyncHandler(async (req, res) => {
    const { title, description, category, showOnHomePage, displayOrder } = req.body;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image',
        });
    }

    const image = await CollegeGallery.create({
        title,
        description,
        category: category || 'Campus',
        showOnHomePage: showOnHomePage === 'true',
        displayOrder: displayOrder || 0,
        image: {
            name: req.file.originalname,
            url: `/uploads/gallery/${req.file.filename}`,
        },
        uploadedBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: image,
    });
});

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
const getAllImages = asyncHandler(async (req, res) => {
    const { category, showOnHomePage } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (showOnHomePage !== undefined) query.showOnHomePage = showOnHomePage === 'true';

    const images = await CollegeGallery.find(query)
        .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
        success: true,
        count: images.length,
        data: images,
    });
});

// @desc    Get homepage carousel images
// @route   GET /api/gallery/carousel
// @access  Public
const getCarouselImages = asyncHandler(async (req, res) => {
    const images = await CollegeGallery.find({
        isActive: true,
        showOnHomePage: true,
    })
        .sort({ displayOrder: 1 })
        .limit(10);

    res.json({
        success: true,
        data: images,
    });
});

// @desc    Get images by category
// @route   GET /api/gallery/category/:category
// @access  Public
const getImagesByCategory = asyncHandler(async (req, res) => {
    const images = await CollegeGallery.find({
        category: req.params.category,
        isActive: true,
    }).sort({ displayOrder: 1, createdAt: -1 });

    res.json({
        success: true,
        count: images.length,
        data: images,
    });
});

// @desc    Update gallery image
// @route   PUT /api/gallery/:id
// @access  Private (Admin)
const updateImage = asyncHandler(async (req, res) => {
    let image = await CollegeGallery.findById(req.params.id);

    if (!image) {
        return res.status(404).json({
            success: false,
            message: 'Image not found',
        });
    }

    const { title, description, category, showOnHomePage, displayOrder } = req.body;

    if (title) image.title = title;
    if (description !== undefined) image.description = description;
    if (category) image.category = category;
    if (showOnHomePage !== undefined) image.showOnHomePage = showOnHomePage === 'true';
    if (displayOrder !== undefined) image.displayOrder = displayOrder;

    // Handle new image upload
    if (req.file) {
        image.image = {
            name: req.file.originalname,
            url: `/uploads/gallery/${req.file.filename}`,
        };
    }

    await image.save();

    res.json({
        success: true,
        message: 'Image updated successfully',
        data: image,
    });
});

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin)
const deleteImage = asyncHandler(async (req, res) => {
    const image = await CollegeGallery.findById(req.params.id);

    if (!image) {
        return res.status(404).json({
            success: false,
            message: 'Image not found',
        });
    }

    // Soft delete
    image.isActive = false;
    await image.save();

    res.json({
        success: true,
        message: 'Image deleted successfully',
    });
});

// @desc    Reorder gallery images
// @route   PUT /api/gallery/reorder
// @access  Private (Admin)
const reorderImages = asyncHandler(async (req, res) => {
    const { orderedIds } = req.body;
    // orderedIds: [{ id, displayOrder }]

    for (const item of orderedIds) {
        await CollegeGallery.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder });
    }

    res.json({
        success: true,
        message: 'Images reordered successfully',
    });
});

// @desc    Get gallery categories with counts
// @route   GET /api/gallery/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await CollegeGallery.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
    ]);

    res.json({
        success: true,
        data: categories,
    });
});

module.exports = {
    uploadImage,
    getAllImages,
    getCarouselImages,
    getImagesByCategory,
    updateImage,
    deleteImage,
    reorderImages,
    getCategories,
};
