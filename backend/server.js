require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http'); 
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const attendanceRoutes2 = require('./routes/attendanceRoutes2');
const { loadModels } = require('./utils/face');
const meetingRoutes = require('./routes/meetingRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const faceRoutes = require('./routes/faceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const marksRoutes = require('./routes/marksRoutes');
const noteRoutes = require('./routes/noteRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const parentRoutes = require('./routes/parentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const classRoutes = require('./routes/classRoutes');
const teachingAssignmentRoutes = require('./routes/teachingAssignmentRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const frontOfficeRoutes = require('./routes/frontOfficeRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const accountantRoutes = require('./routes/accountantRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const aiInsightsRoutes = require('./routes/aiInsightsRoutes');
const app = express();
const server = http.createServer(app);

// Socket.io Setup with CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Controller mein socket use karne ke liye app mein set kiya
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('✅ A user connected to Socket:', socket.id);
    
    socket.on('register-user', async (data) => {
        const { userId, role } = data;
        if (!userId) return;
        
        console.log(`👤 Registering socket ${socket.id} for user ${userId} with role ${role}`);
        
        // Join user-specific room
        socket.join(`user:${userId}`);
        
        // Join role-specific room
        if (role) {
            socket.join(`role:${role}`);
            
            if (role === 'student') {
                socket.join(`student:${userId}`);
            }
            
            if (role === 'parent') {
                try {
                    const Parent = require('./models/Parent');
                    const Student = require('./models/Student');
                    const parentProfile = await Parent.findOne({ user: userId });
                    if (parentProfile && parentProfile.students) {
                        for (const studentId of parentProfile.students) {
                            const student = await Student.findById(studentId);
                            if (student && student.user) {
                                const studentUserId = student.user.toString();
                                socket.join(`parent_of:${studentUserId}`);
                                console.log(`👪 Parent socket ${socket.id} joined room parent_of:${studentUserId}`);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error joining parent rooms on register-user:", err);
                }
            }
        }
    });

    socket.on('join-parent-rooms', (studentUserIds) => {
        if (Array.isArray(studentUserIds)) {
            studentUserIds.forEach(id => {
                socket.join(`parent_of:${id}`);
                console.log(`👪 Parent socket ${socket.id} explicitly joined room parent_of:${id}`);
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected');
    });
});

// Database and Cloudinary Connection
connectDB();
configureCloudinary();

// Middlewares
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false
}));

// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API Setup
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes); // Support singular route used by StudentAttendance.js
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance2', attendanceRoutes2); 
app.use('/api/meetings', meetingRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teaching-assignments', teachingAssignmentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/front-office', frontOfficeRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiInsightsRoutes);
// app.use('/api/timetable', timetableRoutes);
// app.use('/api/notifications', notificationRoutes);

// Load Face AI models
loadModels();

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   🎓 SAMARTH COLLEGE ERP SYSTEM - Backend Server         ║');
    console.log('║                                                          ║');
    console.log(`║   🚀 Server running on port ${PORT}                         ║`);
    console.log(`║   📍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(30)}  ║`);
    console.log('║   📚 API Base URL: http://localhost:' + PORT + '/api            ║');
    console.log('║   🔌 Socket.io: Enabled & Running                        ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
});

module.exports = app;