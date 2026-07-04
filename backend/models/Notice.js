const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notice title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Notice content is required'],
        maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    type: {
        type: String,
        enum: {
            values: ['announcement', 'urgent', 'academic', 'administrative', 'event', 'exam', 'general'],
            message: 'Invalid notice type'
        },
        default: 'general'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Invalid priority level'
        },
        default: 'medium'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: [{
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Flexible Targeting System (NO data duplication)
    targeting: {
        type: {
            type: String,
            enum: {
                values: ['all', 'roles', 'departments', 'classes', 'individuals', 'custom'],
                message: 'Invalid targeting type'
            },
            required: [true, 'Targeting type is required']
        },
        // Role-based targeting
        roles: [{
            type: String,
            enum: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'receptionist']
        }],
        // Department-based targeting
        departments: [{
            type: String,
            enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning']
        }],
        // Class-based targeting
        classes: [{
            department: {
                type: String,
                enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning']
            },
            semester: {
                type: Number,
                min: 1,
                max: 8
            },
            section: {
                type: String,
                enum: ['A', 'B', 'C', 'D']
            },
            batch: String
        }],
        // Individual user targeting
        individuals: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        // Custom targeting criteria
        customCriteria: {
            studentFilters: {
                semesters: [{
                    type: Number,
                    min: 1,
                    max: 8
                }],
                sections: [{
                    type: String,
                    enum: ['A', 'B', 'C', 'D']
                }],
                batches: [String]
            },
            teacherFilters: {
                departments: [{
                    type: String,
                    enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning']
                }]
            }
        }
    },

    // Analytics and Metrics
    metrics: {
        totalTargeted: {
            type: Number,
            default: 0,
            min: 0
        },
        totalRead: {
            type: Number,
            default: 0,
            min: 0
        },
        readPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    }
}, {
    timestamps: true
});

// Performance indexes for efficient querying
noticeSchema.index({ 'targeting.type': 1, isActive: 1, publishDate: -1 });
noticeSchema.index({ 'targeting.roles': 1, isActive: 1, publishDate: -1 });
noticeSchema.index({ 'targeting.departments': 1, isActive: 1, publishDate: -1 });
noticeSchema.index({ createdBy: 1, publishDate: -1 });
noticeSchema.index({ expiryDate: 1, isActive: 1 });
noticeSchema.index({ priority: -1, publishDate: -1 });

// Virtual for checking if notice is expired
noticeSchema.virtual('isExpired').get(function() {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

// Virtual for checking if notice is currently active and visible
noticeSchema.virtual('isVisible').get(function() {
    const now = new Date();
    const isPublished = this.publishDate <= now;
    const isNotExpired = !this.expiryDate || this.expiryDate >= now;
    return this.isActive && isPublished && isNotExpired;
});

// Method to calculate targeted user count
noticeSchema.methods.calculateTargetedUsers = async function() {
    const User = mongoose.model('User');
    const Student = mongoose.model('Student');
    const Teacher = mongoose.model('Teacher');

    let count = 0;

    switch (this.targeting.type) {
        case 'all':
            count = await User.countDocuments({ isActive: true });
            break;

        case 'roles':
            if (this.targeting.roles && this.targeting.roles.length > 0) {
                count = await User.countDocuments({
                    role: { $in: this.targeting.roles },
                    isActive: true
                });
            }
            break;

        case 'departments':
            if (this.targeting.departments && this.targeting.departments.length > 0) {
                const studentCount = await Student.countDocuments({
                    department: { $in: this.targeting.departments },
                    isActive: true
                });
                const teacherCount = await Teacher.countDocuments({
                    department: { $in: this.targeting.departments },
                    isActive: true
                });
                count = studentCount + teacherCount;
            }
            break;

        case 'classes':
            if (this.targeting.classes && this.targeting.classes.length > 0) {
                const classQueries = this.targeting.classes.map(cls => ({
                    department: cls.department,
                    semester: cls.semester,
                    section: cls.section,
                    isActive: true
                }));
                count = await Student.countDocuments({ $or: classQueries });
            }
            break;

        case 'individuals':
            count = this.targeting.individuals ? this.targeting.individuals.length : 0;
            break;

        case 'custom':
            // Complex custom targeting logic would go here
            // For now, return 0 as placeholder
            count = 0;
            break;
    }

    return count;
};

// Method to update metrics
noticeSchema.methods.updateMetrics = async function() {
    const NoticeReadStatus = mongoose.model('NoticeReadStatus');

    // Calculate total targeted users
    this.metrics.totalTargeted = await this.calculateTargetedUsers();

    // Calculate total read count
    this.metrics.totalRead = await NoticeReadStatus.countDocuments({ notice: this._id });

    // Calculate read percentage
    this.metrics.readPercentage = this.metrics.totalTargeted > 0
        ? Math.round((this.metrics.totalRead / this.metrics.totalTargeted) * 100)
        : 0;

    return this.save();
};

// Pre-save middleware to calculate metrics on creation
noticeSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.metrics.totalTargeted = await this.calculateTargetedUsers();
    }
    next();
});

// Static method to build user targeting query
noticeSchema.statics.buildUserTargetingQuery = function(user) {
    const now = new Date();

    // Build targeting conditions based on user
    const targetingConditions = [
        { 'targeting.type': 'all' },
        { 'targeting.roles': user.role },
        { 'targeting.individuals': user._id }
    ];

    // Add role-specific targeting
    if (user.role === 'student' && user.studentProfile) {
        if (user.studentProfile.department) {
            targetingConditions.push(
                { 'targeting.departments': user.studentProfile.department }
            );
        }
        // Only add class targeting if all fields exist
        if (user.studentProfile.department && user.studentProfile.semester && user.studentProfile.section) {
            targetingConditions.push({
                'targeting.classes': {
                    $elemMatch: {
                        department: user.studentProfile.department,
                        semester: user.studentProfile.semester,
                        section: user.studentProfile.section
                    }
                }
            });
        }
    } else if (user.role === 'teacher' && user.teacherProfile) {
        if (user.teacherProfile.department) {
            targetingConditions.push(
                { 'targeting.departments': user.teacherProfile.department }
            );
        }
    }

    // Combine all conditions properly using $and
    return {
        $and: [
            { isActive: true },
            { publishDate: { $lte: now } },
            {
                $or: [
                    { expiryDate: { $exists: false } },
                    { expiryDate: null },
                    { expiryDate: { $gte: now } }
                ]
            },
            { $or: targetingConditions }
        ]
    };
};

module.exports = mongoose.model('Notice', noticeSchema);