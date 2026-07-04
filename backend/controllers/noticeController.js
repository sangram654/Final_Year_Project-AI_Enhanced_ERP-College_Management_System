const { Notice, NoticeReadStatus, User, Student, Teacher, Notification } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Admin, Teacher, Receptionist)
const createNotice = asyncHandler(async (req, res) => {
    const { title, content, type, priority, publishDate, expiryDate, targeting, attachments } = req.body;

    // Validate targeting
    if (!targeting || !targeting.type) {
        return res.status(400).json({
            success: false,
            message: 'Targeting information is required'
        });
    }

    // Create notice
    const notice = await Notice.create({
        title,
        content,
        type,
        priority,
        publishDate: publishDate || new Date(),
        expiryDate,
        targeting,
        attachments: attachments || [],
        createdBy: req.user.id
    });

    // Populate creator info
    await notice.populate('createdBy', 'firstName lastName role');

    // Create urgent notifications if priority is urgent
    if (priority === 'urgent') {
        await createUrgentNotifications(notice);
    }

    res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: notice
    });
});

// @desc    Get notices for current user (with read status)
// @route   GET /api/notices/my-notices
// @access  Private
const getMyNotices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, priority, unread, sort = 'latest' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get current user with profile
    const user = await User.findById(req.user.id)
        .populate('studentProfile')
        .populate('teacherProfile');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Build targeting query for current user
    let targetingQuery = Notice.buildUserTargetingQuery(user);

    // Apply additional filters by modifying the $and array
    if (type) {
        targetingQuery.$and.push({ type: type });
    }
    if (priority) {
        targetingQuery.$and.push({ priority: priority });
    }

    // Build sort options
    let sortOptions;
    switch (sort) {
        case 'priority':
            sortOptions = { priority: -1, publishDate: -1 };
            break;
        case 'oldest':
            sortOptions = { publishDate: 1 };
            break;
        case 'latest':
        default:
            sortOptions = { publishDate: -1 };
            break;
    }

    try {
        // Get notices using simple find query
        const notices = await Notice.find(targetingQuery)
            .populate('createdBy', 'firstName lastName role')
            .sort(sortOptions)
            .lean();

        // Get read statuses for all fetched notices
        const noticeIds = notices.map(notice => notice._id);
        const readStatuses = await NoticeReadStatus.find({
            notice: { $in: noticeIds },
            user: req.user.id
        }).lean();

        // Create a map of read statuses for quick lookup
        const readStatusMap = {};
        readStatuses.forEach(status => {
            readStatusMap[status.notice.toString()] = {
                isRead: true,
                readAt: status.readAt
            };
        });

        // Merge read status with notices
        let noticesWithStatus = notices.map(notice => ({
            ...notice,
            creator: notice.createdBy,
            isRead: !!readStatusMap[notice._id.toString()],
            readAt: readStatusMap[notice._id.toString()]?.readAt || null
        }));

        // Filter by read status if requested
        if (unread === 'true') {
            noticesWithStatus = noticesWithStatus.filter(notice => !notice.isRead);
        } else if (unread === 'false') {
            noticesWithStatus = noticesWithStatus.filter(notice => notice.isRead);
        }

        // Get total count before pagination
        const total = noticesWithStatus.length;

        // Apply pagination
        const skip = (pageNum - 1) * limitNum;
        const paginatedNotices = noticesWithStatus.slice(skip, skip + limitNum);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: paginatedNotices,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notices',
            error: error.message
        });
    }
});

// @desc    Get single notice by ID
// @route   GET /api/notices/:id
// @access  Private
const getNoticeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid notice ID'
        });
    }

    const notice = await Notice.findById(id)
        .populate('createdBy', 'firstName lastName role')
        .populate('targeting.individuals', 'firstName lastName role');

    if (!notice) {
        return res.status(404).json({
            success: false,
            message: 'Notice not found'
        });
    }

    // Check if user is targeted by this notice
    const user = await User.findById(req.user.id)
        .populate('studentProfile')
        .populate('teacherProfile');

    const isTargeted = await checkUserTargeting(notice.targeting, user);

    // Allow access if user is targeted OR is admin/super_admin
    if (!isTargeted && !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    // Get read status for current user
    const readStatus = await NoticeReadStatus.findOne({
        notice: id,
        user: req.user.id
    });

    const noticeWithStatus = {
        ...notice.toObject(),
        isRead: !!readStatus,
        readAt: readStatus?.readAt || null
    };

    res.json({
        success: true,
        data: noticeWithStatus
    });
});

// @desc    Mark notice as read
// @route   PUT /api/notices/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { interactionLevel = 'viewed' } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid notice ID'
        });
    }

    const notice = await Notice.findById(id);
    if (!notice) {
        return res.status(404).json({
            success: false,
            message: 'Notice not found'
        });
    }

    // Mark as read using upsert
    const readStatus = await NoticeReadStatus.findOneAndUpdate(
        { notice: id, user: req.user.id },
        {
            notice: id,
            user: req.user.id,
            readAt: new Date(),
            interactionLevel: interactionLevel
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
        success: true,
        message: 'Notice marked as read',
        data: readStatus
    });
});

// @desc    Get all notices (Admin view)
// @route   GET /api/notices
// @access  Private (Admin, Receptionist)
const getAllNotices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, priority, createdBy, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (createdBy) query.createdBy = createdBy;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const notices = await Notice.find(query)
        .populate('createdBy', 'firstName lastName role')
        .sort({ priority: -1, publishDate: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    const total = await Notice.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
        success: true,
        data: notices,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: totalPages
        }
    });
});

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (Admin, Creator)
const updateNotice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    let notice = await Notice.findById(id);
    if (!notice) {
        return res.status(404).json({
            success: false,
            message: 'Notice not found'
        });
    }

    // Check if user can update (creator or admin)
    if (notice.createdBy.toString() !== req.user.id && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this notice'
        });
    }

    notice = await Notice.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    }).populate('createdBy', 'firstName lastName role');

    res.json({
        success: true,
        message: 'Notice updated successfully',
        data: notice
    });
});

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin, Creator)
const deleteNotice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notice = await Notice.findById(id);
    if (!notice) {
        return res.status(404).json({
            success: false,
            message: 'Notice not found'
        });
    }

    // Check if user can delete (creator or admin)
    if (notice.createdBy.toString() !== req.user.id && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this notice'
        });
    }

    await Notice.findByIdAndDelete(id);

    // Also delete all read statuses for this notice
    await NoticeReadStatus.deleteMany({ notice: id });

    res.json({
        success: true,
        message: 'Notice deleted successfully'
    });
});

// @desc    Get notice analytics
// @route   GET /api/notices/:id/analytics
// @access  Private (Admin, Creator)
const getNoticeAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notice = await Notice.findById(id).populate('createdBy', 'firstName lastName');
    if (!notice) {
        return res.status(404).json({
            success: false,
            message: 'Notice not found'
        });
    }

    // Check if user can view analytics (creator or admin)
    if (notice.createdBy._id.toString() !== req.user.id && !['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view analytics'
        });
    }

    // Get read count
    const totalRead = await NoticeReadStatus.countDocuments({ notice: id });

    // Get read status over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const readTrend = await NoticeReadStatus.aggregate([
        {
            $match: {
                notice: new mongoose.Types.ObjectId(id),
                readAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$readAt'
                    }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        data: {
            notice: {
                id: notice._id,
                title: notice.title,
                createdAt: notice.createdAt,
                metrics: notice.metrics
            },
            analytics: {
                totalRead,
                readTrend
            }
        }
    });
});

// @desc    Get unread notice count for current user
// @route   GET /api/notices/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    try {
        // Get current user with profile
        const user = await User.findById(req.user.id)
            .populate('studentProfile')
            .populate('teacherProfile');

        if (!user) {
            return res.json({
                success: true,
                data: { unreadCount: 0 }
            });
        }

        // Build targeting query for current user
        const targetingQuery = Notice.buildUserTargetingQuery(user);

        // Get all notices targeted to user
        const allTargetedNotices = await Notice.find(targetingQuery).select('_id').lean();
        const noticeIds = allTargetedNotices.map(notice => notice._id);

        // Count how many of these notices are read by the user
        const readCount = await NoticeReadStatus.countDocuments({
            notice: { $in: noticeIds },
            user: req.user.id
        });

        const unreadCount = noticeIds.length - readCount;

        res.json({
            success: true,
            data: { unreadCount: Math.max(0, unreadCount) }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.json({
            success: true,
            data: { unreadCount: 0 }
        });
    }
});

// Helper function to check if user is targeted by notice
const checkUserTargeting = async (targeting, user) => {
    if (!targeting || !targeting.type) return false;

    switch (targeting.type) {
        case 'all':
            return true;

        case 'roles':
            return targeting.roles && targeting.roles.includes(user.role);

        case 'departments':
            if (user.role === 'student' && user.studentProfile) {
                return targeting.departments && targeting.departments.includes(user.studentProfile.department);
            } else if (user.role === 'teacher' && user.teacherProfile) {
                return targeting.departments && targeting.departments.includes(user.teacherProfile.department);
            }
            return false;

        case 'classes':
            if (user.role === 'student' && user.studentProfile && targeting.classes) {
                return targeting.classes.some(cls =>
                    cls.department === user.studentProfile.department &&
                    cls.semester === user.studentProfile.semester &&
                    cls.section === user.studentProfile.section
                );
            }
            return false;

        case 'individuals':
            return targeting.individuals && targeting.individuals.some(id => id.toString() === user._id.toString());

        case 'custom':
            return false;

        default:
            return false;
    }
};

// Helper function to create urgent notifications
const createUrgentNotifications = async (notice) => {
    try {
        // Get all targeted users
        const targetedUsers = await getTargetedUsers(notice.targeting);

        // Create individual notifications for urgent notices
        const notifications = targetedUsers.map(user => ({
            recipient: user._id,
            recipientRole: user.role,
            title: `URGENT: ${notice.title}`,
            message: notice.content.length > 200
                ? notice.content.substring(0, 200) + '...'
                : notice.content,
            type: 'urgent',
            link: `/notices/${notice._id}`,
            sender: notice.createdBy
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error creating urgent notifications:', error);
    }
};

// Helper function to get targeted users
const getTargetedUsers = async (targeting) => {
    let users = [];

    if (!targeting || !targeting.type) return users;

    try {
        switch (targeting.type) {
            case 'all':
                users = await User.find({ isActive: true }).select('_id role').lean();
                break;

            case 'roles':
                if (targeting.roles && targeting.roles.length > 0) {
                    users = await User.find({
                        role: { $in: targeting.roles },
                        isActive: true
                    }).select('_id role').lean();
                }
                break;

            case 'departments':
                if (targeting.departments && targeting.departments.length > 0) {
                    // Get students from these departments
                    const students = await Student.find({
                        department: { $in: targeting.departments },
                        isActive: true
                    }).populate('user', '_id role').lean();

                    // Get teachers from these departments
                    const teachers = await Teacher.find({
                        department: { $in: targeting.departments },
                        isActive: true
                    }).populate('user', '_id role').lean();

                    users = [
                        ...students.filter(s => s.user).map(s => ({ _id: s.user._id, role: s.user.role })),
                        ...teachers.filter(t => t.user).map(t => ({ _id: t.user._id, role: t.user.role }))
                    ];
                }
                break;

            case 'classes':
                if (targeting.classes && targeting.classes.length > 0) {
                    const classStudents = [];
                    for (const cls of targeting.classes) {
                        const studentsInClass = await Student.find({
                            department: cls.department,
                            semester: cls.semester,
                            section: cls.section,
                            isActive: true
                        }).populate('user', '_id role').lean();

                        classStudents.push(...studentsInClass);
                    }
                    users = classStudents.filter(s => s.user).map(s => ({ _id: s.user._id, role: s.user.role }));
                }
                break;

            case 'individuals':
                if (targeting.individuals && targeting.individuals.length > 0) {
                    users = await User.find({
                        _id: { $in: targeting.individuals },
                        isActive: true
                    }).select('_id role').lean();
                }
                break;
        }
    } catch (error) {
        console.error('Error getting targeted users:', error);
    }

    return users;
};

module.exports = {
    createNotice,
    getMyNotices,
    getNoticeById,
    markAsRead,
    getAllNotices,
    updateNotice,
    deleteNotice,
    getNoticeAnalytics,
    getUnreadCount
};