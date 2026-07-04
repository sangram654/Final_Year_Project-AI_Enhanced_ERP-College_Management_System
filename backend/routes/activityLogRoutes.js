const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const Parent = require('../models/Parent');
const { protect } = require('../middleware/auth');

// @desc    Get activity logs based on user role and permissions
// @route   GET /api/activity-logs
router.get('/', protect, async (req, res) => {
    try {
        const { role, _id: userId } = req.user;
        let query = {};

        if (role === 'super_admin') {
            // Super Admin can see all logs
            query = {};
        } else if (role === 'admin') {
            // Admin can see their own logs + all Teacher and Student logs
            query = {
                $or: [
                    { userId: userId },
                    { role: { $in: ['teacher', 'student'] } }
                ]
            };
        } else if (role === 'teacher') {
            // Teachers can see their own logs + Student logs belonging to their department
            const Teacher = require('../models/Teacher');
            const Student = require('../models/Student');
            const teacherProfile = await Teacher.findOne({ user: userId });
            
            if (teacherProfile && teacherProfile.department) {
                const studentsInDept = await Student.find({ department: teacherProfile.department }).populate('user');
                const studentUserIds = studentsInDept
                    .filter(s => s.user)
                    .map(s => s.user._id);
                
                query = {
                    $or: [
                        { userId: userId },
                        { userId: { $in: studentUserIds } }
                    ]
                };
            } else {
                // Fallback if teacher profile doesn't have department configured
                query = { userId: userId };
            }
        } else if (role === 'student') {
            // Students can see only their own logs
            query = { userId: userId };
        } else if (role === 'parent') {
            // Parents can see their respective children's logs
            const parentProfile = await Parent.findOne({ user: userId }).populate({
                path: 'students',
                populate: { path: 'user' }
            });
            
            if (!parentProfile || !parentProfile.students || parentProfile.students.length === 0) {
                return res.json({ success: true, data: [] });
            }
            
            const studentUserIds = parentProfile.students
                .filter(s => s.user)
                .map(s => s.user._id);
                
            query = { userId: { $in: studentUserIds } };
        } else {
            // Other roles see only their own logs
            query = { userId: userId };
        }

        const logs = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
