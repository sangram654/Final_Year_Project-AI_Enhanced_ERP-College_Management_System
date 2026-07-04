const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        // Define mapping of gmail email to samarthcollege.edu.in roll numbers and enrollIds
        const mappings = [
            {
                gmail: 'sangramdeshmukh2004@gmail.com',
                rollNumber: 'EE2024003',
                enrollId: 1
            },
            {
                gmail: 'pruthvirajchavan2494@gmail.com',
                rollNumber: 'EE2024004',
                enrollId: 2
            },
            {
                gmail: 'chaitanyaautkar@gmail.com',
                rollNumber: 'EE2024005',
                enrollId: 3
            }
        ];

        for (const map of mappings) {
            console.log(`\nProcessing mapping for ${map.gmail}...`);
            const user = await User.findOne({ email: map.gmail });
            if (!user) {
                console.log(`❌ User with email ${map.gmail} not found`);
                continue;
            }

            const student = await Student.findOne({ rollNumber: map.rollNumber });
            if (!student) {
                console.log(`❌ Student profile with roll number ${map.rollNumber} not found`);
                continue;
            }

            // Update user document
            user.studentProfile = student._id;
            user.enrollId = map.enrollId;
            await user.save();
            console.log(`✅ Updated user ${user.email} (studentProfile: ${student._id}, enrollId: ${map.enrollId})`);

            // Update student document
            student.user = user._id;
            student.enrollId = map.enrollId;
            await student.save();
            console.log(`✅ Updated student profile ${student.rollNumber} (user: ${user._id}, enrollId: ${map.enrollId})`);
        }

        console.log("\nInspection after fix:");
        const users = await User.find({ email: { $in: mappings.map(m => m.gmail) } }).populate('studentProfile');
        for (const u of users) {
            console.log(`Email: ${u.email}`);
            console.log(`  studentProfile: ${u.studentProfile ? u.studentProfile._id : 'null'}`);
            console.log(`  enrollId: ${u.enrollId}`);
            if (u.studentProfile) {
                console.log(`  Profile Details - rollNumber: ${u.studentProfile.rollNumber}, department: ${u.studentProfile.department}, user: ${u.studentProfile.user}`);
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
