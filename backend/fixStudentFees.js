require('dotenv').config();
const mongoose = require('mongoose');
const { Fee, FeeStructure } = require('./models/Fee');
const Student = require('./models/Student');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('🔍 Checking current student fees situation...');
    
    // Find the current logged-in student (test test)
    const testUsers = await User.find({ 
        firstName: { $regex: /test/i }, 
        role: 'student' 
    });
    
    console.log('Found test users:', testUsers.length);
    testUsers.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Check fee structures available
    const feeStructures = await FeeStructure.find({});
    console.log('Available fee structures:', feeStructures.length);
    
    // Try to assign fees to test students
    for (const user of testUsers) {
        const student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log(`No student profile found for ${user.email}`);
            continue;
        }
        
        const existingFee = await Fee.findOne({ student: student._id });
        if (existingFee) {
            console.log(`Student ${user.email} already has fees: Total=₹${existingFee.totalAmount}, Due=₹${existingFee.dueAmount}`);
        } else {
            console.log(`Student ${user.email} has NO fees assigned!`);
            
            // Assign fee
            if (feeStructures.length > 0) {
                const fee = await Fee.create({
                    student: student._id,
                    feeStructure: feeStructures[0]._id,
                    academicYear: '2024-25',
                    semester: student.semester || 5,
                    totalAmount: feeStructures[0].totalAmount,
                    paidAmount: 0,
                    dueAmount: feeStructures[0].totalAmount,
                    status: 'Pending',
                    dueDate: feeStructures[0].dueDate
                });
                console.log(`✅ Assigned fees to ${user.email}: ₹${fee.totalAmount}`);
            }
        }
    }
    
    process.exit(0);
})
.catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});