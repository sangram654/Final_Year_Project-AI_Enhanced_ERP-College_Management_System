const { Scholarship, ScholarshipApplication } = require('../models/Scholarship');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create scholarship
// @route   POST /api/scholarships
// @access  Private (Admin)
const createScholarship = asyncHandler(async (req, res) => {
    const scholarship = await Scholarship.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Scholarship created successfully',
        data: scholarship,
    });
});

// @desc    Get all scholarships
// @route   GET /api/scholarships
// @access  Public
const getScholarships = asyncHandler(async (req, res) => {
    const { type, isActive, academicYear } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (academicYear) query.academicYear = academicYear;

    // Only show active scholarships with deadline in future for students
    if (req.user?.role === 'student') {
        query.isActive = true;
        query.deadline = { $gte: new Date() };
    }

    const scholarships = await Scholarship.find(query).sort({ deadline: 1 });

    res.json({
        success: true,
        data: scholarships,
    });
});

// @desc    Get single scholarship
// @route   GET /api/scholarships/:id
// @access  Public
const getScholarship = asyncHandler(async (req, res) => {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
        return res.status(404).json({
            success: false,
            message: 'Scholarship not found',
        });
    }

    res.json({
        success: true,
        data: scholarship,
    });
});

// @desc    Apply for scholarship
// @route   POST /api/scholarships/:id/apply
// @access  Private (Student)
const applyForScholarship = asyncHandler(async (req, res) => {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
        return res.status(404).json({
            success: false,
            message: 'Scholarship not found',
        });
    }

    if (!scholarship.isActive || new Date() > scholarship.deadline) {
        return res.status(400).json({
            success: false,
            message: 'Scholarship application period has ended',
        });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found',
        });
    }

    // Check eligibility
    const { eligibility } = scholarship;
    if (eligibility.departments?.length > 0 && !eligibility.departments.includes(student.department)) {
        return res.status(400).json({
            success: false,
            message: 'You are not eligible for this scholarship based on your department',
        });
    }

    if (eligibility.categories?.length > 0 && !eligibility.categories.includes(student.category)) {
        return res.status(400).json({
            success: false,
            message: 'You are not eligible for this scholarship based on your category',
        });
    }

    // Check for existing application
    const existingApp = await ScholarshipApplication.findOne({
        scholarship: req.params.id,
        student: student._id,
    });

    if (existingApp) {
        return res.status(400).json({
            success: false,
            message: 'You have already applied for this scholarship',
        });
    }

    // Get documents from request
    const documents = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            documents.push({
                name: file.originalname,
                url: `/uploads/scholarships/${file.filename}`,
            });
        }
    }

    const application = await ScholarshipApplication.create({
        scholarship: req.params.id,
        student: student._id,
        documents,
        familyIncome: req.body.familyIncome,
        percentage: req.body.percentage,
    });

    res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
    });
});

// @desc    Get student's scholarship applications
// @route   GET /api/scholarships/my-applications
// @access  Private (Student)
const getMyApplications = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
        return res.status(404).json({
            success: false,
            message: 'Student profile not found',
        });
    }

    const applications = await ScholarshipApplication.find({ student: student._id })
        .populate('scholarship')
        .sort({ applicationDate: -1 });

    res.json({
        success: true,
        data: applications,
    });
});

// @desc    Get all scholarship applications
// @route   GET /api/scholarships/applications
// @access  Private (Admin)
const getAllApplications = asyncHandler(async (req, res) => {
    const { status, scholarshipId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (scholarshipId) query.scholarship = scholarshipId;

    const applications = await ScholarshipApplication.find(query)
        .populate('scholarship')
        .populate({
            path: 'student',
            populate: { path: 'user', select: 'firstName lastName email' },
        })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ applicationDate: -1 });

    const total = await ScholarshipApplication.countDocuments(query);

    res.json({
        success: true,
        data: applications,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Review scholarship application
// @route   PUT /api/scholarships/applications/:id/review
// @access  Private (Admin)
const reviewApplication = asyncHandler(async (req, res) => {
    const { status, remarks, approvedAmount } = req.body;

    const application = await ScholarshipApplication.findById(req.params.id);

    if (!application) {
        return res.status(404).json({
            success: false,
            message: 'Application not found',
        });
    }

    application.status = status;
    application.remarks = remarks;
    application.reviewedBy = req.user.id;
    application.reviewDate = new Date();

    if (status === 'Approved') {
        application.approvedAmount = approvedAmount;
    }

    await application.save();

    // Notify student
    const student = await Student.findById(application.student).populate('user');
    if (student && student.user) {
        await Notification.create({
            recipient: student.user._id,
            recipientRole: 'student',
            title: `Scholarship Application ${status}`,
            message: `Your scholarship application has been ${status.toLowerCase()}. ${remarks || ''}`,
            type: 'scholarship',
        });
    }

    res.json({
        success: true,
        message: `Application ${status.toLowerCase()} successfully`,
        data: application,
    });
});

// @desc    Update scholarship
// @route   PUT /api/scholarships/:id
// @access  Private (Admin)
const updateScholarship = asyncHandler(async (req, res) => {
    const scholarship = await Scholarship.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!scholarship) {
        return res.status(404).json({
            success: false,
            message: 'Scholarship not found',
        });
    }

    res.json({
        success: true,
        message: 'Scholarship updated successfully',
        data: scholarship,
    });
});

// @desc    Delete scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private (Admin)
const deleteScholarship = asyncHandler(async (req, res) => {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
        return res.status(404).json({
            success: false,
            message: 'Scholarship not found',
        });
    }

    scholarship.isActive = false;
    await scholarship.save();

    res.json({
        success: true,
        message: 'Scholarship deactivated successfully',
    });
});

// @desc    Get scholarship analytics
// @route   GET /api/scholarships/analytics
// @access  Private (Admin)
const getScholarshipAnalytics = asyncHandler(async (req, res) => {
    const { academicYear } = req.query;

    const matchQuery = {};
    if (academicYear) matchQuery.academicYear = academicYear;

    // Applications summary
    const summary = await ScholarshipApplication.aggregate([
        {
            $lookup: {
                from: 'scholarships',
                localField: 'scholarship',
                foreignField: '_id',
                as: 'scholarshipInfo',
            },
        },
        { $unwind: '$scholarshipInfo' },
        {
            $match: academicYear ? { 'scholarshipInfo.academicYear': academicYear } : {},
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$approvedAmount' },
            },
        },
    ]);

    // Type-wise distribution
    const typeWise = await Scholarship.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);

    res.json({
        success: true,
        data: {
            summary,
            typeWise,
        },
    });
});

module.exports = {
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
};
