const mongoose = require('mongoose');

const collegeGallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Image title is required'],
        trim: true,
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        enum: ['Campus', 'Classroom', 'Laboratory', 'Library', 'Sports', 'Events', 'Infrastructure', 'Faculty', 'Other'],
        default: 'Campus',
    },
    image: {
        name: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String },
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    showOnHomePage: {
        type: Boolean,
        default: false,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Index for faster queries
collegeGallerySchema.index({ category: 1, isActive: 1 });
collegeGallerySchema.index({ showOnHomePage: 1, displayOrder: 1 });

module.exports = mongoose.model('CollegeGallery', collegeGallerySchema);
