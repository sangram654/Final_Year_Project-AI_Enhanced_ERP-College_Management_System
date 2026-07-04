require('dotenv').config();
const mongoose = require('mongoose');
const { Fee } = require('./models/Fee');
const Student = require('./models/Student');
const User = require('./models/User');  // Add this import

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('Connected to MongoDB');
    
    // Get all students with their fees
    const students = await Student.find({}).populate('user', 'firstName lastName');
    console.log('Students found:', students.length);
    
    for (const student of students) {
        const fees = await Fee.find({ student: student._id });
        console.log(`Student: ${student.user.firstName} ${student.user.lastName} - Fees: ${fees.length}`);
        if (fees.length > 0) {
            fees.forEach(fee => {
                console.log(`  Total: ₹${fee.totalAmount}, Due: ₹${fee.dueAmount}, Status: ${fee.status}`);
            });
        }
    }
    
    process.exit(0);
})
.catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});