const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Biometric Hardware se aane wali User ID (String format mein)
    user: {
        type: String,
        required: true
    },
    // Device ki pehchaan (e.g., "SAMARTH_GATE_01")
    deviceId: {
        type: String,
        default: "ESP32_Device"
    },
    // Niche wali fields ko optional (required: false) rakha hai taaki 
    // hardware ka data save hote waqt error na aaye
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false 
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    department: {
        type: String,
        required: false
    },
    semester: {
        type: String,
        required: false
    },
    status: {
        type: String,
        default: "Present"
    },
    subject: {
        type: String,
        required: false
    },
    // Attendance ka time aur date
    time: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance2', attendanceSchema);