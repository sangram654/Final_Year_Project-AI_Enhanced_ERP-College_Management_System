const mongoose = require('mongoose');

const virtualMeetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Meeting title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
        trim: true
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    meetingLink: {
        type: String,
        required: [true, 'Meeting link is required'],
        trim: true
    },
    platform: {
        type: String,
        enum: ['Google Meet', 'Zoom', 'Microsoft Teams', 'Other'],
        default: 'Google Meet'
    },
    
    // Meeting Schedule
    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
        type: String,
        required: [true, 'Scheduled time is required']
    },
    duration: {
        type: Number, // in minutes
        required: [true, 'Duration is required'],
        min: 15,
        max: 480 // 8 hours max
    },
    
    // Creator & Host
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false // Optional for admin-created meetings
    },
    
    // Meeting Targeting - Flexible system
    targetingType: {
        type: String,
        enum: ['class', 'department', 'role', 'individuals', 'custom'],
        required: [true, 'Targeting type is required']
    },
    
    // For class-specific meetings
    classDetails: {
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
        }
    },
    
    // For department-wide meetings
    departments: [{
        type: String,
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning']
    }],
    
    // For role-based meetings (e.g., all parents, all teachers)
    roles: [{
        type: String,
        enum: ['admin', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'receptionist']
    }],
    
    // For individual targeting
    individuals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Subject (optional - for academic meetings)
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    
    // Meeting Status
    status: {
        type: String,
        enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    
    // Attendance Tracking
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Recording & Resources
    recording: {
        url: String,
        uploadedAt: Date
    },
    resources: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Recurring Meeting
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        frequency: {
            type: String,
            enum: ['Daily', 'Weekly', 'Monthly']
        },
        endDate: Date
    },
    
    // Metadata
    totalTargeted: {
        type: Number,
        default: 0
    },
    totalAttended: {
        type: Number,
        default: 0
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
virtualMeetingSchema.index({ scheduledDate: 1, status: 1 });
virtualMeetingSchema.index({ createdBy: 1 });
virtualMeetingSchema.index({ host: 1 });
virtualMeetingSchema.index({ 'classDetails.department': 1, 'classDetails.semester': 1 });

// Virtual for meeting date-time combined
virtualMeetingSchema.virtual('meetingDateTime').get(function() {
    return new Date(`${this.scheduledDate.toISOString().split('T')[0]}T${this.scheduledTime}`);
});

module.exports = mongoose.model('VirtualMeeting', virtualMeetingSchema);
