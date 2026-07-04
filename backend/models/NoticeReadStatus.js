const mongoose = require('mongoose');

const noticeReadStatusSchema = new mongoose.Schema({
    notice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice',
        required: [true, 'Notice reference is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    readAt: {
        type: Date,
        default: Date.now
    },
    // Optional: track interaction level for analytics
    interactionLevel: {
        type: String,
        enum: {
            values: ['viewed', 'clicked', 'downloaded'],
            message: 'Invalid interaction level'
        },
        default: 'viewed'
    },
    // Optional: track which device/platform was used
    device: {
        type: String,
        enum: ['web', 'mobile', 'email'],
        default: 'web'
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate read status for same user-notice pair
noticeReadStatusSchema.index({ notice: 1, user: 1 }, { unique: true });

// Performance indexes for efficient querying
noticeReadStatusSchema.index({ user: 1, readAt: -1 });
noticeReadStatusSchema.index({ notice: 1, readAt: -1 });
noticeReadStatusSchema.index({ readAt: -1 });

// Virtual to check if read within last 24 hours
noticeReadStatusSchema.virtual('isRecentRead').get(function() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.readAt >= twentyFourHoursAgo;
});

// Static method to mark notice as read for user
noticeReadStatusSchema.statics.markAsRead = async function(noticeId, userId, interactionLevel = 'viewed') {
    try {
        const readStatus = await this.findOneAndUpdate(
            { notice: noticeId, user: userId },
            {
                readAt: new Date(),
                interactionLevel: interactionLevel
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        // Update notice metrics after marking as read
        const Notice = mongoose.model('Notice');
        const notice = await Notice.findById(noticeId);
        if (notice) {
            await notice.updateMetrics();
        }

        return readStatus;
    } catch (error) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
            // Record already exists, just update the readAt time
            return await this.findOneAndUpdate(
                { notice: noticeId, user: userId },
                {
                    readAt: new Date(),
                    interactionLevel: interactionLevel
                },
                { new: true }
            );
        }
        throw error;
    }
};

// Static method to get read status for multiple notices for a user
noticeReadStatusSchema.statics.getReadStatusForUser = async function(noticeIds, userId) {
    const readStatuses = await this.find({
        notice: { $in: noticeIds },
        user: userId
    }).select('notice readAt interactionLevel');

    // Create a map for quick lookup
    const statusMap = {};
    readStatuses.forEach(status => {
        statusMap[status.notice.toString()] = {
            isRead: true,
            readAt: status.readAt,
            interactionLevel: status.interactionLevel
        };
    });

    return statusMap;
};

// Static method to get unread count for user
noticeReadStatusSchema.statics.getUnreadCount = async function(userId) {
    const Notice = mongoose.model('Notice');
    const User = mongoose.model('User');

    // Get user to build targeting query
    const user = await User.findById(userId).populate('studentProfile').populate('teacherProfile');
    if (!user) return 0;

    // Get all notices targeted to user
    const targetingQuery = Notice.buildUserTargetingQuery(user);
    const allTargetedNotices = await Notice.find(targetingQuery).select('_id');
    const noticeIds = allTargetedNotices.map(notice => notice._id);

    // Count how many of these notices are NOT read by the user
    const readNoticeIds = await this.distinct('notice', {
        notice: { $in: noticeIds },
        user: userId
    });

    return noticeIds.length - readNoticeIds.length;
};

// Static method to get reading analytics for a notice
noticeReadStatusSchema.statics.getNoticeAnalytics = async function(noticeId) {
    const objectId = new mongoose.Types.ObjectId(noticeId);

    const analytics = await this.aggregate([
        { $match: { notice: objectId } },
        {
            $group: {
                _id: null,
                totalReads: { $sum: 1 },
                avgReadTime: { $avg: { $subtract: ['$readAt', '$createdAt'] } },
                interactionBreakdown: {
                    $push: {
                        level: '$interactionLevel',
                        device: '$device',
                        readAt: '$readAt'
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalReads: 1,
                avgReadTimeMinutes: { $divide: ['$avgReadTime', 60000] }, // Convert to minutes
                interactionBreakdown: 1
            }
        }
    ]);

    // Get device breakdown
    const deviceStats = await this.aggregate([
        { $match: { notice: objectId } },
        {
            $group: {
                _id: '$device',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get interaction level breakdown
    const interactionStats = await this.aggregate([
        { $match: { notice: objectId } },
        {
            $group: {
                _id: '$interactionLevel',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        ...(analytics[0] || { totalReads: 0, avgReadTimeMinutes: 0 }),
        deviceBreakdown: deviceStats,
        interactionBreakdown: interactionStats
    };
};

// Post-save middleware to update notice metrics
noticeReadStatusSchema.post('save', async function(doc) {
    try {
        const Notice = mongoose.model('Notice');
        const notice = await Notice.findById(doc.notice);
        if (notice) {
            await notice.updateMetrics();
        }
    } catch (error) {
        console.error('Error updating notice metrics:', error);
    }
});

module.exports = mongoose.model('NoticeReadStatus', noticeReadStatusSchema);