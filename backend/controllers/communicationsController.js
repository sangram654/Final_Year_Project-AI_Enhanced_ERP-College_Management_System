const { asyncHandler } = require('../middleware/errorHandler');
const Communication = require('../models/Communication');
const User = require('../models/User');
const Student = require('../models/Student');

const getRecipientCount = async (recipient, payload = {}) => {
    switch (recipient) {
        case 'all_students':
            return User.countDocuments({ role: 'student', isActive: true });
        case 'all_parents':
            return User.countDocuments({ role: 'parent', isActive: true });
        case 'all_teachers':
            return User.countDocuments({ role: 'teacher', isActive: true });
        case 'specific_department':
            return payload.department
                ? Student.countDocuments({ department: payload.department, isActive: true })
                : 0;
        case 'specific_semester': {
            const semester = Number(payload.semester);
            return Number.isFinite(semester)
                ? Student.countDocuments({ semester, isActive: true })
                : 0;
        }
        case 'custom':
            return Array.isArray(payload.customRecipients) ? payload.customRecipients.length : 0;
        default:
            return 0;
    }
};

// @desc    Get all communications
// @route   GET /api/communications
// @access  Private (Receptionist, Admin)
const getCommunications = asyncHandler(async (req, res) => {
    const communications = await Communication.find()
        .sort({ createdAt: -1 })
        .limit(200);

    res.json({
        success: true,
        data: communications,
    });
});

// @desc    Create new communication
// @route   POST /api/communications
// @access  Private (Receptionist, Admin)
const createCommunication = asyncHandler(async (req, res) => {
    const scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    const isScheduled = scheduledFor && scheduledFor > new Date();

    const communication = await Communication.create({
        type: req.body.type,
        recipient: req.body.recipient,
        subject: req.body.subject,
        message: req.body.message,
        priority: req.body.priority || 'normal',
        scheduledFor,
        status: isScheduled ? 'scheduled' : 'sent',
        sentAt: isScheduled ? null : new Date(),
        recipientCount: await getRecipientCount(req.body.recipient, req.body),
        createdBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        data: communication,
        message: isScheduled
            ? 'Communication scheduled successfully'
            : 'Communication sent successfully',
    });
});

module.exports = {
    getCommunications,
    createCommunication,
};