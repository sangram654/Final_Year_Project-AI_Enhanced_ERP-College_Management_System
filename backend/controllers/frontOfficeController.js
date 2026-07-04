const FrontOffice = require('../models/FrontOffice');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all front office entries
// @route   GET /api/front-office
// @access  Private (Receptionist, Super Admin, Admin)
const getEntries = asyncHandler(async (req, res) => {
    const { type, status, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
        query.$text = { $search: search };
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await FrontOffice.countDocuments(query);
    const entries = await FrontOffice.find(query)
        .populate('createdBy', 'firstName lastName')
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: entries,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Create a front office entry
// @route   POST /api/front-office
// @access  Private (Receptionist, Super Admin, Admin)
const createEntry = asyncHandler(async (req, res) => {
    const entry = await FrontOffice.create({
        ...req.body,
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        message: 'Entry created successfully',
        data: entry,
    });
});

// @desc    Update a front office entry
// @route   PUT /api/front-office/:id
// @access  Private (Receptionist, Super Admin, Admin)
const updateEntry = asyncHandler(async (req, res) => {
    let entry = await FrontOffice.findById(req.params.id);
    if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry = await FrontOffice.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.json({
        success: true,
        message: 'Entry updated successfully',
        data: entry,
    });
});

// @desc    Delete a front office entry
// @route   DELETE /api/front-office/:id
// @access  Private (Receptionist, Super Admin, Admin)
const deleteEntry = asyncHandler(async (req, res) => {
    const entry = await FrontOffice.findById(req.params.id);
    if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    await FrontOffice.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Entry deleted successfully' });
});

// @desc    Checkout visitor
// @route   PUT /api/front-office/:id/checkout
// @access  Private (Receptionist, Super Admin, Admin)
const checkoutVisitor = asyncHandler(async (req, res) => {
    const entry = await FrontOffice.findById(req.params.id);
    if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry.checkOutTime = new Date();
    entry.status = 'closed';
    await entry.save();

    res.json({
        success: true,
        message: 'Visitor checked out successfully',
        data: entry,
    });
});

// @desc    Get front office dashboard stats
// @route   GET /api/front-office/dashboard
// @access  Private (Receptionist, Super Admin, Admin)
const getFrontOfficeDashboard = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = await FrontOffice.countDocuments({ createdAt: { $gte: today } });
    const totalInquiries = await FrontOffice.countDocuments({ type: 'admission_inquiry' });
    const openComplaints = await FrontOffice.countDocuments({ type: 'complaint', status: { $ne: 'closed' } });
    const todayVisitors = await FrontOffice.countDocuments({
        type: 'visitor',
        createdAt: { $gte: today },
    });

    const recentEntries = await FrontOffice.find()
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

    // Entries by type today
    const entriesByType = await FrontOffice.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
        success: true,
        data: {
            stats: {
                todayEntries,
                totalInquiries,
                openComplaints,
                todayVisitors,
            },
            recentEntries,
            entriesByType,
        },
    });
});

module.exports = {
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    checkoutVisitor,
    getFrontOfficeDashboard,
};
