const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        const students = await Student.find().populate('user');
        console.log(`Found ${students.length} student profiles:`);
        for (const student of students) {
            console.log(`\nStudent _id: ${student._id}`);
            console.log(`  rollNumber: ${student.rollNumber}`);
            console.log(`  department: ${student.department}`);
            console.log(`  semester: ${student.semester}`);
            console.log(`  enrollId: ${student.enrollId}`);
            if (student.user) {
                console.log(`  Linked User: ${student.user.fullName} (${student.user.email}) _id: ${student.user._id}`);
            } else {
                console.log(`  ❌ Linked User is null or not found for user: ${student.user}`);
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
