const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an attendance activity to MongoDB and broadcasts it in real-time via socket.io.
 * 
 * @param {object} io - The socket.io Server instance.
 * @param {object} userObj - The User document (with _id, firstName, lastName, role).
 * @param {string} status - Attendance status ('Present', 'Absent', 'Late', 'Leave').
 * @param {string} method - Verification method/mode (e.g. 'Manual', 'Fingerprint Device', 'Face').
 */
const logAttendanceActivity = async (io, userObj, status = 'Present', method = 'Manual') => {
    try {
        if (!userObj) {
            console.error('❌ Cannot log activity: User object is null');
            return;
        }

        const userId = userObj._id;
        const role = userObj.role;
        const name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
        
        // Format role-friendly names
        const roleDisplay = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Create log message
        const message = `${roleDisplay} ${name} marked attendance (${status}) via ${method}`;

        // Create and save to database
        const log = new ActivityLog({
            userId,
            name,
            role,
            type: 'attendance',
            message,
            status,
            timestamp: new Date()
        });

        await log.save();
        console.log(`💾 Activity log saved to DB: ${message}`);

        // If socket.io is enabled, broadcast to respective rooms
        if (io) {
            let rooms = [];

            if (role === 'student') {
                // Students -> Super Admin, Admin, Teachers, Student themselves, Parents
                rooms = ['role:super_admin', 'role:admin', 'role:teacher', `student:${userId}`, `parent_of:${userId}`];
            } else if (role === 'teacher') {
                // Teachers -> Super Admin, Admin, themselves
                rooms = ['role:super_admin', 'role:admin', `user:${userId}`];
            } else if (role === 'admin' || role === 'super_admin') {
                // Admins -> Super Admin, Admin
                rooms = ['role:super_admin', 'role:admin'];
            } else {
                // Other roles -> Super Admin, Admin, themselves
                rooms = ['role:super_admin', 'role:admin', `user:${userId}`];
            }

            // Emit to each resolved room
            rooms.forEach(room => {
                io.to(room).emit('new-activity-log', log);
            });
            console.log(`📡 Broadcasted activity log to rooms: ${rooms.join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Error logging attendance activity:', error);
    }
};

module.exports = {
    logAttendanceActivity
};
