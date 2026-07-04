const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'receptionist'],
        required: [true, 'Role is required'],
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    enrollId: { 
        type: Number, default: null 
    },
    phone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    profileImage: {
        type: String,
        default: null,
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    // Reference to role-specific profile
    studentProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    teacherProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
    parentProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
    },

    // 🔥 FACE RECOGNITION FIELDS (ADD HERE)
    // faceDescriptor: {
    //     type: [Number],   // 128D face vector
    //     default: null
    // },
    // faceImage: {
    //     type: String,
    //     default: null
    // },
}, {
    timestamps: true,
});

// Index for faster queries
userSchema.index({ email: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            id: this._id,
            role: this.role,
            email: this.email
        },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Get full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);