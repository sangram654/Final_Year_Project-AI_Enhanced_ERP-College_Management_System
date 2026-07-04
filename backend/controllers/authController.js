const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper to ensure role-specific profile document exists
const ensureUserProfile = async (user) => {
    let profile = null;
    if (user.role === 'student') {
        if (user.studentProfile) {
            profile = await Student.findById(user.studentProfile);
        }
        if (!profile) {
            profile = await Student.findOne({ user: user._id });
        }
        if (!profile) {
            const rollNumber = 'STU_' + Date.now().toString().slice(-6);
            profile = await Student.create({
                user: user._id,
                rollNumber,
                department: 'Computer Engineering',
                course: 'B.E.',
                semester: 1,
                batch: new Date().getFullYear().toString(),
                dateOfBirth: new Date('2004-01-01'),
                gender: 'Male',
            });
        }
        if (!user.studentProfile || user.studentProfile.toString() !== profile._id.toString()) {
            user.studentProfile = profile._id;
            await user.save();
        }
    } else if (user.role === 'teacher' || user.role === 'admin') {
        if (user.teacherProfile) {
            profile = await Teacher.findById(user.teacherProfile);
        }
        if (!profile) {
            profile = await Teacher.findOne({ user: user._id });
        }
        if (!profile) {
            const employeeId = 'EMP_' + Date.now().toString().slice(-6);
            profile = await Teacher.create({
                user: user._id,
                employeeId,
                department: 'Computer Engineering',
                designation: 'Lecturer',
                qualification: 'B.E. / M.E.',
                experience: 1,
            });
        }
        if (!user.teacherProfile || user.teacherProfile.toString() !== profile._id.toString()) {
            user.teacherProfile = profile._id;
            await user.save();
        }
    } else if (user.role === 'parent') {
        if (user.parentProfile) {
            profile = await Parent.findById(user.parentProfile);
        }
        if (!profile) {
            profile = await Parent.findOne({ user: user._id });
        }
        if (!profile) {
            profile = await Parent.create({
                user: user._id,
                relation: 'Father',
            });
        }
        if (!user.parentProfile || user.parentProfile.toString() !== profile._id.toString()) {
            user.parentProfile = profile._id;
            await user.save();
        }
    }
    return profile;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { email, password, role, firstName, lastName, phone, ...additionalData } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email',
        });
    }

    // Create user
    const user = await User.create({
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
    });

    // Create role-specific profile
    let profile = null;
    if (role === 'student' && additionalData.studentData) {
        profile = await Student.create({
            user: user._id,
            ...additionalData.studentData,
        });
        user.studentProfile = profile._id;
        await user.save();
    } else if (role === 'teacher' && additionalData.teacherData) {
        profile = await Teacher.create({
            user: user._id,
            ...additionalData.teacherData,
        });
        user.teacherProfile = profile._id;
        await user.save();
    } else if (role === 'parent' && additionalData.parentData) {
        profile = await Parent.create({
            user: user._id,
            ...additionalData.parentData,
        });
        user.parentProfile = profile._id;
        await user.save();
    }

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
            },
            profile,
            token,
        },
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password',
        });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
        });
    }

    // Check if account is active
    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Your account has been deactivated. Please contact admin.',
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
        });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get role-specific profile (ensuring it exists)
    const profile = await ensureUserProfile(user);

    // Generate token
    const token = user.generateToken();

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                profileImage: user.profileImage,
            },
            profile,
            token,
        },
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    // Get role-specific profile (ensuring it exists)
    let profile = await ensureUserProfile(user);

    // Populate relations for response
    if (user.role === 'student' && profile) {
        profile = await Student.findById(profile._id).populate('enrolledSubjects parentGuardian');
    } else if ((user.role === 'teacher' || user.role === 'admin') && profile) {
        profile = await Teacher.findById(profile._id).populate('subjects');
    } else if (user.role === 'parent' && profile) {
        profile = await Parent.findById(profile._id).populate('students');
    }

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            },
            profile,
        },
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Handle profile image upload
    if (req.file) {
        user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                profileImage: user.profileImage,
            },
        },
    });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please provide current and new password',
        });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect',
        });
    }

    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully',
    });
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
};
