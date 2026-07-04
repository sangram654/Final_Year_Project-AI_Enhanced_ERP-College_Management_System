const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        const users = await User.find({ role: 'student' });
        console.log(`Found ${users.length} student users:`);
        for (const user of users) {
            console.log(`\nUser: ${user.fullName} (${user.email})`);
            console.log(`  _id: ${user._id}`);
            console.log(`  studentProfile: ${user.studentProfile}`);
            
            const student = await Student.findOne({ user: user._id });
            if (student) {
                console.log(`  Student Document found:`);
                console.log(`    _id: ${student._id}`);
                console.log(`    rollNumber: ${student.rollNumber}`);
                console.log(`    department: ${student.department}`);
                console.log(`    semester: ${student.semester}`);
                console.log(`    enrollId: ${student.enrollId}`);
                console.log(`    user field matches User._id? ${student.user.toString() === user._id.toString()}`);
            } else {
                console.log(`  ❌ NO Student Document found linking to user._id`);
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
