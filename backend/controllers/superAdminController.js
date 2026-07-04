const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES, ROLE_PERMISSIONS, getModulesForRole, getRoleLabel } = require('../config/roles');
const nodemailer = require('nodemailer');

// --- EMAIL TRANSPORTER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'samarthcollege29@gmail.com',
        pass: process.env.EMAIL_PASS || 'wxpr gbce efjd mumu'
    }
});

// Helper function to send welcome email
const sendWelcomeEmail = async (userEmail, password, firstName, lastName) => {
    const fromEmail = process.env.EMAIL_USER || 'samarthcollege29@gmail.com';
    const mailOptions = {
        from: `"Samarth COE ERP - Super Admin Portal" <${fromEmail}>`,
        to: userEmail,
        subject: 'Samarth College Portal Account Set Up',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="color: #2b6cb0; margin-top: 0;">Samarth College Portal</h3>
                <p>Hello ${firstName} ${lastName},</p>
                <p>Your portal account has been set up. You can access the system using the details below:</p>
                <div style="background: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2b6cb0; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>User:</strong> ${userEmail}</p>
                    <p style="margin: 5px 0;"><strong>Key:</strong> <span style="color: #e74c3c; font-weight: bold;">${password}</span></p>
                </div>
                <p style="font-size: 13px; color: #4a5568;">Please update your security key after signing in for the first time.</p>
                <p style="font-size: 12px; color: #718096; margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 10px;">
                    This is an automated system notification.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to: ${userEmail}`);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

// ==================== NEW HELPER FUNCTION ====================
// Helper function to send updated password email
const sendUpdatedPasswordEmail = async (userEmail, newPassword, firstName, lastName) => {
    const fromEmail = process.env.EMAIL_USER || 'samarthcollege29@gmail.com';
    const mailOptions = {
        from: `"Samarth COE ERP - Super Admin Portal" <${fromEmail}>`,
        to: userEmail,
        subject: 'Samarth College Account Security Update',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="color: #c53030; margin-top: 0;">Security Update</h3>
                <p>Hello ${firstName} ${lastName},</p>
                <p>The access key for your portal account has been updated by the administrator:</p>
                <div style="background: #f7fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #c53030; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>User:</strong> ${userEmail}</p>
                    <p style="margin: 5px 0;"><strong>New Key:</strong> <span style="color: #c53030; font-weight: bold;">${newPassword}</span></p>
                </div>
                <p style="font-size: 13px; color: #4a5568;">If you did not request this update, please contact the administration immediately.</p>
                <p style="font-size: 12px; color: #718096; margin-top: 25px; border-top: 1px solid #edf2f7; padding-top: 10px;">
                    This is an automated system notification.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Updated password email sent to: ${userEmail}`);
    } catch (error) {
        console.error('Updated password email failed:', error);
    }
};

// @desc    Get Super Admin dashboard with full system stats
const getSuperAdminDashboard = asyncHandler(async (req, res) => {
    const userCounts = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const countsMap = {};
    userCounts.forEach(item => {
        countsMap[item._id] = item.count;
    });

    const recentUsers = await User.find()
        .select('firstName lastName email role isActive createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(15);

    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.json({
        success: true,
        data: {
            userCounts: countsMap,
            totalUsers: userCounts.reduce((sum, item) => sum + item.count, 0),
            activeUsers,
            inactiveUsers,
            recentUsers,
            availableRoles: Object.values(ROLES).map(role => ({
                value: role,
                label: getRoleLabel(role),
                modules: getModulesForRole(role),
            })),
        },
    });
});

// @desc    Get all users with filters
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .populate('parentProfile')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: users,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Create a new user (any role)
const createUser = asyncHandler(async (req, res) => {
    const { email, password, role, firstName, lastName, phone, enrollId, department } = req.body;

    // 1. Validation
    if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 2. Database Entry
    const user = await User.create({
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        enrollId: enrollId ? Number(enrollId) : null
    });

    // Create role-specific profile document
    if (role === 'student') {
        const rollNumber = 'STU_' + Date.now().toString().slice(-6);
        
        // Automatically check if there is an existing parent with matching lastName (case-insensitive)
        const matchingParentUsers = await User.find({
            role: 'parent',
            lastName: { $regex: new RegExp('^' + lastName + '$', 'i') }
        });
        const parentUserIds = matchingParentUsers.map(u => u._id);
        const matchingParent = await Parent.findOne({ user: { $in: parentUserIds } });

        const profile = await Student.create({
            user: user._id,
            rollNumber,
            department: department || 'Computer Engineering',
            course: 'B.E.',
            semester: 1,
            batch: new Date().getFullYear().toString(),
            dateOfBirth: new Date('2004-01-01'),
            gender: 'Male',
            parentGuardian: matchingParent ? matchingParent._id : undefined
        });
        user.studentProfile = profile._id;
        await user.save();

        if (matchingParent) {
            if (!matchingParent.students.includes(profile._id)) {
                matchingParent.students.push(profile._id);
                await matchingParent.save();
            }
            console.log(`🔗 Automatically linked student ${firstName} ${lastName} to parent profile ID: ${matchingParent._id}`);
        }
    } else if (role === 'teacher' || role === 'admin') {
        const employeeId = 'EMP_' + Date.now().toString().slice(-6);
        const profile = await Teacher.create({
            user: user._id,
            employeeId,
            department: department || 'Computer Engineering',
            designation: 'Lecturer',
            qualification: 'B.E. / M.E.',
            experience: 1,
        });
        user.teacherProfile = profile._id;
        await user.save();
    } else if (role === 'parent') {
        const { studentId } = req.body;
        let studentIds = [];

        if (studentId) {
            studentIds.push(studentId);
        } else {
            // Automatically link parent to student who matches parent's lastName (case-insensitive)
            const matchingUsers = await User.find({
                role: 'student',
                lastName: { $regex: new RegExp('^' + lastName + '$', 'i') }
            });
            const studentUserIds = matchingUsers.map(u => u._id);
            const matchingStudents = await Student.find({ user: { $in: studentUserIds } });
            studentIds = matchingStudents.map(s => s._id);
        }

        const profile = await Parent.create({
            user: user._id,
            relation: 'Father',
            students: studentIds
        });
        user.parentProfile = profile._id;
        await user.save();

        if (studentIds.length > 0) {
            await Student.updateMany(
                { _id: { $in: studentIds } },
                { parentGuardian: profile._id }
            );
            console.log(`🔗 Linked parent ${firstName} ${lastName} to student profile IDs:`, studentIds);
        }
    }

    // 3. Background Email (No await here for speed)
    sendWelcomeEmail(email, password, firstName, lastName)
        .catch(err => console.error("Background Email Error:", err));

    // 4. Send Response
    res.status(201).json({
        success: true,
        message: `${getRoleLabel(role)} created successfully! Credentials sent to email.`,
        data: { id: user._id, email: user.email, role: user.role }
    });
});

// @desc    Update user details (EDIT USER) - WITH PASSWORD EMAIL
const updateUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, role, password, enrollId, studentId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safety: Prevent editing yourself through this route
    if (user._id.toString() === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot edit your own account here' });
    }

    // Email duplication check
    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (enrollId !== undefined) user.enrollId = enrollId ? Number(enrollId) : null;

    const isPasswordChanged = password && password.trim() !== '';

    if (isPasswordChanged) {
        user.password = password;
    }

    if (user.role === 'parent') {
        let studentIds = [];
        if (studentId) {
            studentIds.push(studentId);
        }

        let parentProfile = await Parent.findOne({ user: user._id });
        if (parentProfile) {
            parentProfile.students = studentIds;
            await parentProfile.save();
        } else {
            parentProfile = await Parent.create({
                user: user._id,
                relation: 'Father',
                students: studentIds
            });
            user.parentProfile = parentProfile._id;
        }

        if (studentId) {
            await Student.updateMany(
                { parentGuardian: parentProfile._id },
                { $unset: { parentGuardian: 1 } }
            );
            await Student.findByIdAndUpdate(studentId, { parentGuardian: parentProfile._id });
        }
    }

    await user.save();

    // If password was changed, send updated password email
    if (isPasswordChanged) {
        sendUpdatedPasswordEmail(
            user.email,
            password,
            user.firstName,
            user.lastName
        ).catch(err => console.error("Background Password Update Email Error:", err));
    }

    res.json({
        success: true,
        message: 'User updated successfully' + (isPasswordChanged ? ' and new password email sent' : ''),
        data: {
            id: user._id,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Update user role
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!Object.values(ROLES).includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    user.role = role;
    await user.save();

    res.json({ success: true, message: `User role updated to ${getRoleLabel(role)}` });
});

// @desc    Toggle user status
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
});

// @desc    Delete a user
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
});

// @desc    Get role permissions config
const getRolesConfig = asyncHandler(async (req, res) => {
    const rolesConfig = Object.values(ROLES).map(role => ({
        role,
        label: getRoleLabel(role),
        modules: getModulesForRole(role),
        permissions: ROLE_PERMISSIONS[role] || {},
    }));

    res.json({ success: true, data: rolesConfig });
});

module.exports = {
    getSuperAdminDashboard,
    getAllUsers,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getRolesConfig,
};