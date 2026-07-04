require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('🔧 Fixing user-student profile reference...');
    
    const user = await User.findOne({ email: 'test@gmail.com' });
    const student = await Student.findOne({ user: user._id });
    
    if (!user.studentProfile) {
        user.studentProfile = student._id;
        await user.save();
        console.log('✅ Added studentProfile reference to user');
    }
    
    console.log('Updated user:', {
        _id: user._id,
        email: user.email,
        role: user.role,
        studentProfile: user.studentProfile
    });
    
    console.log('Student profile:', {
        _id: student._id,
        user: student.user,
        department: student.department
    });
    
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});