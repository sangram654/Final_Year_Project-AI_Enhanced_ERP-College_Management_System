const mongoose = require('mongoose');
const Attendance2 = require('./models/Attendance2');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ERP_System');
        console.log("Connected to MongoDB");

        const studentIds = ["1", "2", "3"]; // Sangram, Pruthviraj, Chaitanya

        // 1. Delete all existing records for these students to start fresh
        const deleteRes = await Attendance2.deleteMany({ user: { $in: studentIds } });
        console.log(`Deleted ${deleteRes.deletedCount} old biometric records.`);

        // Helper to generate a date on a specific day with a specific time
        const makeDate = (baseDate, hour, minute) => {
            const d = new Date(baseDate);
            d.setHours(hour, minute, 0, 0);
            return d;
        };

        let logsToInsert = [];

        // Range requested: 10 July 2025 to 20 April 2026
        const startDate = new Date('2025-07-10');
        const endDate = new Date('2026-04-20');

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            // Skip Sunday (0)
            if (currentDate.getDay() === 0) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Generate fake attendance for each student
            for (const enrollId of studentIds) {
                // ~80% attendance rate
                const isPresentToday = Math.random() < 0.80;
                if (!isPresentToday) {
                    continue;
                }

                // If present, generate scans
                // 1. Gate IN (95% chance)
                const hasGateIn = Math.random() < 0.95;
                if (hasGateIn) {
                    const randomMin = Math.floor(Math.random() * 50) + 5; // 9:05 to 9:55
                    const deviceId = Math.random() < 0.5 ? 'MAIN_GATE' : 'SAMARTH_GATE_01';
                    logsToInsert.push({
                        user: enrollId,
                        deviceId: deviceId,
                        status: 'Present',
                        time: makeDate(currentDate, 9, randomMin)
                    });
                }

                // 2. Shift 1 (80% chance)
                const hasShift1 = Math.random() < 0.80;
                if (hasShift1) {
                    const totalMins = Math.floor(Math.random() * 75) + 35; // 9:35 AM to 11:10 AM
                    const hour = 9 + Math.floor(totalMins / 60);
                    const min = totalMins % 60;
                    const deviceId = Math.random() < 0.5 ? 'CLASS_SCANNER' : 'ESP32_STATION';
                    logsToInsert.push({
                        user: enrollId,
                        deviceId: deviceId,
                        status: 'Present',
                        time: makeDate(currentDate, hour, min)
                    });
                }

                // 3. Shift 2 (85% chance)
                const hasShift2 = Math.random() < 0.85;
                if (hasShift2) {
                    const totalMins = Math.floor(Math.random() * 100) + 50; // 11:50 AM to 1:30 PM
                    const hour = 11 + Math.floor(totalMins / 60);
                    const min = totalMins % 60;
                    const deviceId = Math.random() < 0.5 ? 'CLASS_SCANNER' : 'ESP32_STATION';
                    logsToInsert.push({
                        user: enrollId,
                        deviceId: deviceId,
                        status: 'Present',
                        time: makeDate(currentDate, hour, min)
                    });
                }

                // 4. Shift 3 (75% chance)
                const hasShift3 = Math.random() < 0.75;
                if (hasShift3) {
                    const totalMins = Math.floor(Math.random() * 95) + 35; // 2:35 PM to 4:10 PM
                    const hour = 14 + Math.floor(totalMins / 60);
                    const min = totalMins % 60;
                    const deviceId = Math.random() < 0.5 ? 'CLASS_SCANNER' : 'ESP32_STATION';
                    logsToInsert.push({
                        user: enrollId,
                        deviceId: deviceId,
                        status: 'Present',
                        time: makeDate(currentDate, hour, min)
                    });
                }

                // 5. Gate OUT (90% chance)
                const hasGateOut = Math.random() < 0.90;
                if (hasGateOut) {
                    const totalMins = Math.floor(Math.random() * 50) + 35; // 4:35 PM to 5:25 PM
                    const hour = 16 + Math.floor(totalMins / 60);
                    const min = totalMins % 60;
                    const deviceId = Math.random() < 0.5 ? 'MAIN_GATE' : 'SAMARTH_GATE_01';
                    logsToInsert.push({
                        user: enrollId,
                        deviceId: deviceId,
                        status: 'Present',
                        time: makeDate(currentDate, hour, min)
                    });
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add today's Gate IN log (18 June 2026) for all three students
        const todayDate = new Date('2026-06-18');
        for (const enrollId of studentIds) {
            logsToInsert.push({
                user: enrollId,
                deviceId: 'MAIN_GATE',
                status: 'Present',
                time: makeDate(todayDate, 9, 18) // 9:18 AM
            });
            console.log(`Added today's Gate IN log for student enrollId ${enrollId}`);
        }

        console.log(`Generated ${logsToInsert.length} log documents to insert. Inserting...`);
        const insertRes = await Attendance2.insertMany(logsToInsert);
        console.log(`Successfully inserted ${insertRes.length} biometric records into Mongoose!`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
