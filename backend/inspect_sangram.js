const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        const users = await User.find({ firstName: 'Sangram' });
        console.log("Sangram users:");
        for (const u of users) {
            console.log(`Email: ${u.email}`);
            console.log(`  _id: ${u._id}`);
            console.log(`  enrollId: ${u.enrollId}`);
            console.log(`  studentProfile: ${u.studentProfile}`);
            console.log(`  lastLogin: ${u.lastLogin}`);
            console.log(`  updatedAt: ${u.updatedAt}`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
