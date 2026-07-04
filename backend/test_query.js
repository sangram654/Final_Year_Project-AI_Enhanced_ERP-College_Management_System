const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Attendance2 = require('./models/Attendance2');
const attendanceController2 = require('./controllers/attendanceController2');

// Mock request and response
const req = {
    query: {
        date: '2026-06-18'
    },
    user: {
        _id: new mongoose.Types.ObjectId('6a336a126496e81956df0887'),
        id: '6a336a126496e81956df0887',
        role: 'student',
        enrollId: 1
    }
};

const res = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        console.log("\nResponse HTTP Code:", this.statusCode || 200);
        console.log("Response Body Data length:", data.data ? data.data.length : 0);
        console.log("Response Body Data:", JSON.stringify(data.data, null, 2));
        console.log("Personal Logs length:", data.personalLogs ? data.personalLogs.length : 0);
        console.log("Personal Logs:", JSON.stringify(data.personalLogs, null, 2));
    }
};

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        // Run the controller function
        await attendanceController2.getShiftAttendanceReport(req, res);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
