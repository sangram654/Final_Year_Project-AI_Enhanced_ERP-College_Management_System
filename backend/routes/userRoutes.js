const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        // ✅ HASH PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ SAVE HASHED PASSWORD
        user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({
            success: true,
            message: "User Registered Successfully"
        });

    } catch (error) {
        console.error(error);
    }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // .select('+password') tabhi kaam karega agar model mein select: false ho
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        // Password matching
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }

        // Token Generation
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'mysupersecretkey123@erp', 
            { expiresIn: '365d' }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// ✅ PROTECTED ROUTE
router.get('/profile', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Profile data fetched",
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;