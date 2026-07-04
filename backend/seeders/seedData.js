require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Attendance2 = require('../models/Attendance2');
const ActivityLog = require('../models/ActivityLog');
const { Fee, FeeStructure } = require('../models/Fee');
const { Scholarship } = require('../models/Scholarship');
const Marks = require('../models/Marks');
const Note = require('../models/Note');
const CollegeGallery = require('../models/CollegeGallery');
const { Book } = require('../models/Book');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ERP_System';

// Seed data
const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data by dropping database to guarantee clean indexes and state
        console.log('🗑️  Clearing existing data by dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped successfully');

        // Rebuild indexes for all registered models synchronously
        console.log('🔧 Recreating database indexes...');
        await Promise.all(
            mongoose.modelNames().map((modelName) => mongoose.model(modelName).createIndexes())
        );
        console.log('✅ Indexes recreated successfully');

        // Define 7 Departments
        const departments = [
            { name: 'Computer Engineering', code: 'CO' },
            { name: 'Mechanical Engineering', code: 'ME' },
            { name: 'Civil Engineering', code: 'CE' },
            { name: 'Electrical Engineering', code: 'EE' },
            { name: 'Electronics Engineering', code: 'EX' },
            { name: 'Information Technology', code: 'IT' },
            { name: 'Artificial Intelligence and Machine Learning', code: 'AI' }
        ];

        // Marathi Names list (5 names per department, first is HOD, then FE, SE, TE, BE teachers)
        const marathiNames = [
            // CO
            { first: 'Suresh', last: 'Patil' },
            { first: 'Amit', last: 'Kadam' },
            { first: 'Sneha', last: 'Shinde' },
            { first: 'Ramesh', last: 'Pawar' },
            { first: 'Vinayak', last: 'Jadhav' },
            // ME
            { first: 'Rahul', last: 'Shinde' },
            { first: 'Vijay', last: 'Patil' },
            { first: 'Anil', last: 'Kadam' },
            { first: 'Sanjay', last: 'Deshmukh' },
            { first: 'Kavita', last: 'Gaikwad' },
            // CE
            { first: 'Sachin', last: 'Jadhav' },
            { first: 'Priya', last: 'Pawar' },
            { first: 'Nitin', last: 'More' },
            { first: 'Amol', last: 'Patil' },
            { first: 'Deepa', last: 'Shinde' },
            // EE
            { first: 'Vijay', last: 'Kadam' },
            { first: 'Sunita', last: 'Jadhav' },
            { first: 'Rajesh', last: 'Patil' }, // SE Electrical Teacher
            { first: 'Vikas', last: 'Deshmukh' },
            { first: 'Jyoti', last: 'More' },
            // EX
            { first: 'Santosh', last: 'Pawar' },
            { first: 'Abhay', last: 'Kadam' },
            { first: 'Seema', last: 'Shinde' },
            { first: 'Swapnil', last: 'Patil' },
            { first: 'Pooja', last: 'Jadhav' },
            // IT
            { first: 'Mahesh', last: 'Gaikwad' },
            { first: 'Sagar', last: 'Pawar' },
            { first: 'Reshma', last: 'More' },
            { first: 'Sachin', last: 'Patil' },
            { first: 'Nutan', last: 'Kadam' },
            // AI
            { first: 'Anand', last: 'Deshmukh' },
            { first: 'Sunil', last: 'Shinde' },
            { first: 'Varsha', last: 'Pawar' },
            { first: 'Rohan', last: 'Jadhav' },
            { first: 'Ashwini', last: 'Kadam' }
        ];

        // 1. Create Subjects
        console.log('📚 Creating subjects...');
        const seededSubjects = [];
        for (const dept of departments) {
            // Seed 4 year-wise subjects
            const subFE = await Subject.create({
                code: `${dept.code}101`,
                name: `Fundamentals of ${dept.name}`,
                department: dept.name,
                semester: 1,
                credits: 4,
                type: 'Theory'
            });
            const subSE = await Subject.create({
                code: `${dept.code}201`,
                name: `Core ${dept.name} Engineering`,
                department: dept.name,
                semester: 3,
                credits: 4,
                type: 'Theory + Practical'
            });
            const subTE = await Subject.create({
                code: `${dept.code}301`,
                name: `Advanced ${dept.name} Applications`,
                department: dept.name,
                semester: 5,
                credits: 4,
                type: 'Theory + Practical'
            });
            const subBE = await Subject.create({
                code: `${dept.code}401`,
                name: `${dept.name} Elective I`,
                department: dept.name,
                semester: 7,
                credits: 3,
                type: 'Theory'
            });

            // Seed Random Notes subject (with unique code to prevent duplicate key error)
            const subRandom = await Subject.create({
                code: `RANDOM_${dept.code}`,
                name: 'Random Notes / Other',
                department: dept.name,
                semester: 1,
                credits: 1,
                type: 'Theory'
            });

            seededSubjects.push({
                department: dept.name,
                subjects: [subFE, subSE, subTE, subBE, subRandom]
            });
        }

        // 2. Create Classes
        console.log('🏫 Creating classes...');
        const seededClasses = [];
        for (const dept of departments) {
            const clsFE = await Class.create({
                name: `FE ${dept.name.split(' ')[0]}`,
                department: dept.name,
                semester: 1,
                section: 'A',
                batch: '2024',
                academicYear: '2024-25',
                roomNumber: `${dept.code}-101`
            });
            const clsSE = await Class.create({
                name: `SE ${dept.name.split(' ')[0]}`,
                department: dept.name,
                semester: 3,
                section: 'A',
                batch: '2024',
                academicYear: '2024-25',
                roomNumber: `${dept.code}-201`
            });
            const clsTE = await Class.create({
                name: `TE ${dept.name.split(' ')[0]}`,
                department: dept.name,
                semester: 5,
                section: 'A',
                batch: '2024',
                academicYear: '2024-25',
                roomNumber: `${dept.code}-301`
            });
            const clsBE = await Class.create({
                name: `BE ${dept.name.split(' ')[0]}`,
                department: dept.name,
                semester: 7,
                section: 'A',
                batch: '2024',
                academicYear: '2024-25',
                roomNumber: `${dept.code}-401`
            });

            seededClasses.push({
                department: dept.name,
                classes: [clsFE, clsSE, clsTE, clsBE]
            });
        }

        // 3. Create Teachers & HODs
        console.log('👨‍🏫 Creating teachers and HODs...');
        const seededTeachers = [];

        for (let d = 0; d < departments.length; d++) {
            const dept = departments[d];
            const deptSubs = seededSubjects.find(s => s.department === dept.name).subjects;
            const deptClasses = seededClasses.find(c => c.department === dept.name).classes;

            const baseNameIndex = d * 5;

            // Create HOD User (Role: admin, Designation: HOD)
            const hodName = marathiNames[baseNameIndex];
            const hodEmail = `${hodName.first.toLowerCase()}${hodName.last.toLowerCase()}123@gmail.com`;
            const hodUser = await User.create({
                email: hodEmail,
                password: `${hodName.first.toLowerCase()}${hodName.last.toLowerCase()}@123`,
                role: 'admin',
                firstName: `Dr. ${hodName.first}`,
                lastName: hodName.last,
                phone: `9876543${d}00`,
                isActive: true,
            });

            const hodProfile = await Teacher.create({
                user: hodUser._id,
                employeeId: `EMP_HOD_${dept.code}`,
                department: dept.name,
                designation: 'HOD',
                qualification: 'Ph.D. in Engineering',
                experience: 18,
                specialization: `${dept.name} Core`,
                subjects: [deptSubs[4]._id],
                assignedClasses: []
            });

            await User.findByIdAndUpdate(hodUser._id, { teacherProfile: hodProfile._id });

            // Create 4 Teachers (one for FE, SE, TE, BE)
            const yearNames = ['FE', 'SE', 'TE', 'BE'];
            const semesters = [1, 3, 5, 7];

            for (let y = 0; y < 4; y++) {
                const teacherName = marathiNames[baseNameIndex + 1 + y];
                const teacherEmail = `${teacherName.first.toLowerCase()}${teacherName.last.toLowerCase()}123@gmail.com`;

                const teacherUser = await User.create({
                    email: teacherEmail,
                    password: `${teacherName.first.toLowerCase()}${teacherName.last.toLowerCase()}@123`,
                    role: 'teacher',
                    firstName: `Prof. ${teacherName.first}`,
                    lastName: teacherName.last,
                    phone: `9876543${d}${y + 1}0`,
                    isActive: true,
                });

                const subjectAssigned = deptSubs[y];
                const classAssigned = deptClasses[y];

                const teacherProfile = await Teacher.create({
                    user: teacherUser._id,
                    employeeId: `EMP_${dept.code}_${yearNames[y]}`,
                    department: dept.name,
                    designation: y === 3 ? 'Professor' : (y === 2 ? 'Associate Professor' : 'Assistant Professor'),
                    qualification: 'M.E. / M.Tech / Ph.D.',
                    experience: 5 + y * 3,
                    specialization: `${dept.name} ${yearNames[y]} Topics`,
                    subjects: [subjectAssigned._id, deptSubs[4]._id],
                    assignedClasses: [{
                        department: dept.name,
                        semester: semesters[y],
                        section: 'A',
                        subject: subjectAssigned._id
                    }]
                });

                await User.findByIdAndUpdate(teacherUser._id, { teacherProfile: teacherProfile._id });
                await Subject.findByIdAndUpdate(subjectAssigned._id, { teacher: teacherProfile._id });

                if (y === 1 || y === 2) {
                    await Class.findByIdAndUpdate(classAssigned._id, { classTeacher: teacherProfile._id });
                }

                seededTeachers.push({
                    email: teacherEmail,
                    department: dept.name,
                    year: yearNames[y],
                    profileId: teacherProfile._id,
                    userId: teacherUser._id,
                    subjectId: subjectAssigned._id
                });
            }
        }

        // 4. Create Students
        console.log('🎓 Creating students...');
        const co_dept = seededSubjects.find(s => s.department === 'Computer Engineering');
        const co_subjects = co_dept.subjects;

        const student1User = await User.create({
            email: 'rahulpatil123@gmail.com',
            password: 'rahulpatil@123',
            role: 'student',
            firstName: 'Rahul',
            lastName: 'Patil',
            phone: '9876543221'
        });

        const student1Profile = await Student.create({
            user: student1User._id,
            rollNumber: 'CO2024001',
            department: 'Computer Engineering',
            course: 'B.E.',
            semester: 5,
            section: 'A',
            batch: '2024',
            dateOfBirth: new Date('2002-05-15'),
            gender: 'Male',
            category: 'General',
            enrolledSubjects: [co_subjects[2]._id, co_subjects[4]._id]
        });
        await User.findByIdAndUpdate(student1User._id, { studentProfile: student1Profile._id });

        const ee_dept = seededSubjects.find(s => s.department === 'Electrical Engineering');
        const ee_subjects = ee_dept.subjects;

        const student2User = await User.create({
            email: 'amitjadhav123@gmail.com',
            password: 'amitjadhav@123',
            role: 'student',
            firstName: 'Amit',
            lastName: 'Jadhav',
            phone: '9876543222'
        });

        const student2Profile = await Student.create({
            user: student2User._id,
            rollNumber: 'EE2024002',
            department: 'Electrical Engineering',
            course: 'B.E.',
            semester: 3,
            section: 'A',
            batch: '2024',
            dateOfBirth: new Date('2003-08-22'),
            gender: 'Male',
            category: 'General',
            enrolledSubjects: [ee_subjects[1]._id, ee_subjects[4]._id]
        });
        await User.findByIdAndUpdate(student2User._id, { studentProfile: student2Profile._id });

        // Add AIML subjects for Last Year students
        const ai_dept = seededSubjects.find(s => s.department === 'Artificial Intelligence and Machine Learning');
        const ai_subjects = ai_dept.subjects;

        // Create Sangram Deshmukh (enrollId: 1)
        const sangramUser = await User.create({
            email: 'sangramdeshmukh2004@gmail.com',
            password: '123456',
            role: 'student',
            firstName: 'Sangram',
            lastName: 'Deshmukh',
            phone: '9876543001',
            enrollId: 1
        });
        const sangramProfile = await Student.create({
            user: sangramUser._id,
            rollNumber: 'AI2024001',
            department: 'Artificial Intelligence and Machine Learning',
            course: 'B.E.',
            semester: 8,
            section: 'A',
            batch: '2024',
            dateOfBirth: new Date('2004-01-01'),
            gender: 'Male',
            category: 'General',
            enrolledSubjects: [ai_subjects[3]._id, ai_subjects[4]._id]
        });
        await User.findByIdAndUpdate(sangramUser._id, { studentProfile: sangramProfile._id });

        // Create Pruthviraj Chavan (enrollId: 2)
        const pruthvirajUser = await User.create({
            email: 'pruthvirajchavan2494@gmail.com',
            password: '123456',
            role: 'student',
            firstName: 'Pruthviraj',
            lastName: 'Chavan',
            phone: '9876543002',
            enrollId: 2
        });
        const pruthvirajProfile = await Student.create({
            user: pruthvirajUser._id,
            rollNumber: 'AI2024002',
            department: 'Artificial Intelligence and Machine Learning',
            course: 'B.E.',
            semester: 8,
            section: 'A',
            batch: '2024',
            dateOfBirth: new Date('2004-02-01'),
            gender: 'Male',
            category: 'General',
            enrolledSubjects: [ai_subjects[3]._id, ai_subjects[4]._id]
        });
        await User.findByIdAndUpdate(pruthvirajUser._id, { studentProfile: pruthvirajProfile._id });

        // Create Chaitanya Autkar (enrollId: 3)
        const chaitanyaUser = await User.create({
            email: 'chaitanyaautkar@gmail.com',
            password: '123456',
            role: 'student',
            firstName: 'Chaitanya',
            lastName: 'Autkar',
            phone: '9876543003',
            enrollId: 3
        });
        const chaitanyaProfile = await Student.create({
            user: chaitanyaUser._id,
            rollNumber: 'AI2024003',
            department: 'Artificial Intelligence and Machine Learning',
            course: 'B.E.',
            semester: 8,
            section: 'A',
            batch: '2024',
            dateOfBirth: new Date('2004-03-01'),
            gender: 'Male',
            category: 'General',
            enrolledSubjects: [ai_subjects[3]._id, ai_subjects[4]._id]
        });
        await User.findByIdAndUpdate(chaitanyaUser._id, { studentProfile: chaitanyaProfile._id });

        // --- ADD DEFAULT DEMO TEACHER FOR LOGIN HINT ---
        const demoTeacherUser = await User.create({
            email: 'ramkadam123@gmail.com',
            password: 'ramkadam@123',
            role: 'teacher',
            firstName: 'Ram',
            lastName: 'Kadam',
            phone: '9876543299',
            isActive: true,
        });

        const demoTeacherProfile = await Teacher.create({
            user: demoTeacherUser._id,
            employeeId: 'EMP_DEFAULT_TEACHER',
            department: 'Electrical Engineering',
            designation: 'Professor',
            qualification: 'Ph.D. in Power Systems',
            experience: 12,
            specialization: 'Electrical Engineering',
            subjects: [ee_subjects[1]._id, ee_subjects[4]._id],
            assignedClasses: [{
                department: 'Electrical Engineering',
                semester: 3,
                section: 'A',
                subject: ee_subjects[1]._id
            }]
        });

        await User.findByIdAndUpdate(demoTeacherUser._id, { teacherProfile: demoTeacherProfile._id });

        // 5. Create Parents
        console.log('👨‍👩‍👧 Creating parents...');
        const parentUser = await User.create({
            email: 'sureshpatil.parent@gmail.com',
            password: 'sureshpatil@123',
            role: 'parent',
            firstName: 'Suresh',
            lastName: 'Patil',
            phone: '9876543231'
        });

        const parentProfile = await Parent.create({
            user: parentUser._id,
            relation: 'Father',
            occupation: 'Agriculture',
            annualIncome: 500000,
            students: [student1Profile._id]
        });
        await User.findByIdAndUpdate(parentUser._id, { parentProfile: parentProfile._id });
        await Student.findByIdAndUpdate(student1Profile._id, { parentGuardian: parentProfile._id });

        // Add parent Pandit Deshmukh linked to child Sangram Deshmukh
        const PanditUser = await User.create({
            email: 'panditdeshmukh1964@gmail.com',
            password: '123456',
            role: 'parent',
            firstName: 'Pandit',
            lastName: 'Deshmukh',
            phone: '9876987612'
        });

        const PanditProfile = await Parent.create({
            user: PanditUser._id,
            relation: 'Father',
            occupation: 'Agriculture',
            annualIncome: 500000,
            students: [sangramProfile._id]
        });
        await User.findByIdAndUpdate(PanditUser._id, { parentProfile: PanditProfile._id });
        await Student.findByIdAndUpdate(sangramProfile._id, { parentGuardian: PanditProfile._id });

        // 6. Create Admin User
        console.log('👤 Creating admin user...');
        await User.create({
            email: 'admin123@gmail.com',
            password: 'admin@123',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            phone: '9876543210',
            isActive: true,
        });

        // 7. Create Super Admin
        console.log('🛡️  Creating super admin...');
        await User.create({
            email: 'superadmin123@gmail.com',
            password: 'superadmin@123',
            role: 'super_admin',
            firstName: 'Super',
            lastName: 'Admin',
            phone: '9876543200',
            isActive: true,
        });

        // 8. Create Accountant
        console.log('💰 Creating accountant...');
        await User.create({
            email: 'accountant@gmail.com',
            password: 'accountant@123',
            role: 'accountant',
            firstName: 'Meena',
            lastName: 'Patil',
            phone: '9876543240',
            isActive: true,
        });

        // 9. Create Librarian
        console.log('📚 Creating librarian...');
        await User.create({
            email: 'librarian@gmail.com',
            password: 'librarian@123',
            role: 'librarian',
            firstName: 'Ramesh',
            lastName: 'Kulkarni',
            phone: '9876543250',
            isActive: true,
        });

        // 10. Create Receptionist
        console.log('🏢 Creating receptionist...');
        await User.create({
            email: 'receptionist@gmail.com',
            password: 'receptionist@123',
            role: 'receptionist',
            firstName: 'Snehal',
            lastName: 'More',
            phone: '9876543260',
            isActive: true,
        });

        // Assign enrollIds to all users who don't have one
        console.log('🆔 Assigning unique enroll IDs to all users...');
        const allUsers = await User.find();
        let nextEnrollId = 4;
        for (const u of allUsers) {
            if (u.enrollId === null || u.enrollId === undefined) {
                while (allUsers.some(user => user.enrollId === nextEnrollId)) {
                    nextEnrollId++;
                }
                u.enrollId = nextEnrollId;
                await u.save();
                nextEnrollId++;
            }
        }
        console.log('✅ Unique enroll IDs assigned successfully');

        // 11. Create Library Books
        console.log('📚 Creating library books...');
        await Book.insertMany([
            {
                title: 'Data Structures and Algorithms',
                author: 'Peter Johnson',
                isbn: '978-0123456789',
                publisher: 'Tech Publications',
                category: 'Textbook',
                department: 'Computer Engineering',
                totalCopies: 5,
                availableCopies: 5,
                shelfLocation: 'CE-101',
            },
            {
                title: 'Basic Electrical Engineering',
                author: 'S. N. Patil',
                isbn: '978-0987654321',
                publisher: 'Academic Press',
                category: 'Textbook',
                department: 'Electrical Engineering',
                totalCopies: 3,
                availableCopies: 3,
                shelfLocation: 'EE-001',
            }
        ]);

        // 12. Create Attendance Records
        console.log('📅 Creating attendance records (July 2025 to 20 April 2026)...');
        const teacherEE_SE = seededTeachers.find(t => t.email === 'rajeshpatil123@gmail.com');
        const subjectEE_SE = ee_subjects[1];

        const usersForAttendance = await User.find({ enrollId: { $ne: null } });
        const studentsForManualAttendance = await Student.find();
        const subjectsCache = await Subject.find();
        const teachersCache = await Teacher.find();

        const attendanceLogsToInsert = [];
        const manualAttendanceToInsert = [];
        const activityLogsToInsert = [];

        const startSeedingDate = new Date('2025-07-01T00:00:00Z');
        const endSeedingDate = new Date('2026-04-20T23:59:59Z');

        // Iterator date
        const dateIterator = new Date(startSeedingDate);
        while (dateIterator <= endSeedingDate) {
            const dayOfWeek = dateIterator.getDay();
            if (dayOfWeek !== 0) { // Skip Sundays
                const baseYear = dateIterator.getFullYear();
                const baseMonth = dateIterator.getMonth();
                const baseDay = dateIterator.getDate();

                // 1. Biometric logs generation
                for (const u of usersForAttendance) {
                    const randSeed = (u.enrollId * 31 + baseDay * 17 + baseMonth * 7) % 100;
                    if (randSeed < 8) continue; // Absent

                    const createLocalTime = (hours, mins, maxOffsetMins) => {
                        const offset = Math.floor(Math.random() * maxOffsetMins);
                        return new Date(baseYear, baseMonth, baseDay, hours, mins + offset);
                    };

                    attendanceLogsToInsert.push({
                        user: String(u.enrollId),
                        deviceId: 'MAIN_GATE',
                        status: 'Present',
                        time: createLocalTime(9, 5, 40)
                    });

                    attendanceLogsToInsert.push({
                        user: String(u.enrollId),
                        deviceId: 'ESP32_STATION',
                        status: 'Present',
                        time: createLocalTime(9, 50, 40)
                    });

                    attendanceLogsToInsert.push({
                        user: String(u.enrollId),
                        deviceId: 'ESP32_STATION',
                        status: 'Present',
                        time: createLocalTime(11, 50, 55)
                    });

                    attendanceLogsToInsert.push({
                        user: String(u.enrollId),
                        deviceId: 'ESP32_STATION',
                        status: 'Present',
                        time: createLocalTime(16, 30, 10)
                    });

                    attendanceLogsToInsert.push({
                        user: String(u.enrollId),
                        deviceId: 'MAIN_GATE',
                        status: 'Present',
                        time: createLocalTime(16, 45, 45)
                    });

                    // 3. Activity logs generation for the last 5 days
                    const logCompareDate = new Date(baseYear, baseMonth, baseDay);
                    if (logCompareDate >= new Date('2026-04-15T00:00:00')) {
                        const roleDisplay = u.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                        const logMsg = `${roleDisplay} ${fullName} marked attendance (Present) via Biometric V2`;
                        activityLogsToInsert.push({
                            userId: u._id,
                            name: fullName,
                            role: u.role,
                            type: 'attendance',
                            message: logMsg,
                            status: 'Present',
                            timestamp: createLocalTime(9, 15, 30)
                        });
                    }
                }

                // 2. Traditional manual logs generation
                for (const s of studentsForManualAttendance) {
                    for (const subId of s.enrolledSubjects) {
                        const subjectDoc = subjectsCache.find(sub => String(sub._id) === String(subId));
                        if (!subjectDoc) continue;

                        const randVal = (s.rollNumber.charCodeAt(s.rollNumber.length - 1) * 31 + baseDay * 17 + baseMonth * 7) % 100;
                        const status = randVal < 8 ? 'Absent' : 'Present';

                        manualAttendanceToInsert.push({
                            student: s._id,
                            subject: subId,
                            teacher: subjectDoc.teacher || (teachersCache[0] ? teachersCache[0]._id : teacherEE_SE.profileId),
                            date: new Date(baseYear, baseMonth, baseDay, 10, 0),
                            status: status,
                            lectureNumber: 1,
                            remarks: status === 'Present' ? 'Checked' : 'Absent',
                            verificationMode: 'Manual',
                            semester: s.semester || 1,
                            department: s.department,
                            section: s.section || 'A'
                        });
                    }
                }
            }
            dateIterator.setDate(dateIterator.getDate() + 1);
        }

        if (sangramUser) {
            const enrollIdStr = String(sangramUser.enrollId);
            const baseYear22 = 2026;
            const baseMonth22 = 5;
            const baseDay22 = 22;

            // Biometric Logs (Gate In, Shift 1, Shift 2, Shift 3, Gate Out)
            attendanceLogsToInsert.push({
                user: enrollIdStr,
                deviceId: 'MAIN_GATE',
                status: 'Present',
                time: new Date(baseYear22, baseMonth22, baseDay22, 9, 5)
            });
            attendanceLogsToInsert.push({
                user: enrollIdStr,
                deviceId: 'ESP32_STATION',
                status: 'Present',
                time: new Date(baseYear22, baseMonth22, baseDay22, 10, 1)
            });
            attendanceLogsToInsert.push({
                user: enrollIdStr,
                deviceId: 'ESP32_STATION',
                status: 'Present',
                time: new Date(baseYear22, baseMonth22, baseDay22, 12, 5)
            });
            attendanceLogsToInsert.push({
                user: enrollIdStr,
                deviceId: 'ESP32_STATION',
                status: 'Present',
                time: new Date(baseYear22, baseMonth22, baseDay22, 15, 0)
            });
            attendanceLogsToInsert.push({
                user: enrollIdStr,
                deviceId: 'MAIN_GATE',
                status: 'Present',
                time: new Date(baseYear22, baseMonth22, baseDay22, 16, 45)
            });

            // Activity Logs for 22-06-2026 Shifts
            const fullName = `${sangramUser.firstName} ${sangramUser.lastName}`;
            activityLogsToInsert.push({
                userId: sangramUser._id,
                name: fullName,
                role: 'student',
                type: 'attendance',
                message: `Student ${fullName} marked attendance (Present) via Biometric V2`,
                status: 'Present',
                timestamp: new Date(baseYear22, baseMonth22, baseDay22, 10, 1)
            });
            activityLogsToInsert.push({
                userId: sangramUser._id,
                name: fullName,
                role: 'student',
                type: 'attendance',
                message: `Student ${fullName} marked attendance (Present) via Biometric V2`,
                status: 'Present',
                timestamp: new Date(baseYear22, baseMonth22, baseDay22, 12, 5)
            });
            activityLogsToInsert.push({
                userId: sangramUser._id,
                name: fullName,
                role: 'student',
                type: 'attendance',
                message: `Student ${fullName} marked attendance (Present) via Biometric V2`,
                status: 'Present',
                timestamp: new Date(baseYear22, baseMonth22, baseDay22, 15, 0)
            });
        }

        console.log(`💾 Inserting ${attendanceLogsToInsert.length} biometric attendance documents...`);
        await Attendance2.insertMany(attendanceLogsToInsert);

        console.log(`💾 Inserting ${manualAttendanceToInsert.length} traditional attendance documents...`);
        await Attendance.insertMany(manualAttendanceToInsert);

        console.log(`💾 Inserting ${activityLogsToInsert.length} activity log documents...`);
        await ActivityLog.insertMany(activityLogsToInsert);
        console.log('✅ Seeding of all attendance records completed successfully');

        // 13. Create Fee Structures
        console.log('💰 Creating fee structures...');
        const feeStructure = await FeeStructure.create({
            name: 'Tuition Fee - Odd Semester 2024-25',
            department: 'All',
            course: 'B.E.',
            academicYear: '2024-25',
            components: [
                { name: 'Tuition Fee', amount: 45000, isOptional: false },
                { name: 'Development Fee', amount: 5000, isOptional: false },
            ],
            totalAmount: 50000,
            dueDate: new Date('2024-12-31')
        });

        await Fee.create({
            student: student2Profile._id,
            feeStructure: feeStructure._id,
            academicYear: '2024-25',
            semester: 3,
            totalAmount: 50000,
            paidAmount: 0,
            dueAmount: 50000,
            status: 'Pending',
            dueDate: new Date('2024-12-31'),
        });

        // 14. Create Marks
        console.log('📊 Creating marks...');
        await Marks.create({
            student: student2Profile._id,
            subject: subjectEE_SE._id,
            enteredBy: teacherEE_SE ? teacherEE_SE.profileId : (teachersCache[0] ? teachersCache[0]._id : null),
            examType: 'Internal',
            obtainedMarks: 85,
            maxMarks: 100,
            semester: 3,
            academicYear: '2024-25',
            grade: 'A+',
            status: 'Pass',
        });

        // 15. Create Gallery Images
        console.log('🖼️  Creating gallery entries...');
        await CollegeGallery.insertMany([
            { title: 'College Entrance', description: 'Samarth College Entrance', category: 'Campus', image: { name: 'entrance.jpg', url: '/entrance.jpg' }, showOnHomePage: true, displayOrder: 1 }
        ]);

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════════╗');
        console.log('║                                                                  ║');
        console.log('║   ✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!                    ║');
        console.log('║                                                                  ║');
        console.log('║   Login Credentials:                                             ║');
        console.log('║   ─────────────────                                              ║');
        console.log('║   Super Admin:  superadmin123@gmail.com / superadmin@123          ║');
        console.log('║   Admin:        admin123@gmail.com / admin@123                  ║');
        console.log('║   EE SE Teacher: rajeshpatil123@gmail.com / rajeshpatil@123      ║');
        console.log('║   CO TE Teacher: rameshpawar123@gmail.com / rameshpawar@123      ║');
        console.log('║   HOD Electrical: vijaykadam123@gmail.com / vijaykadam@123       ║');
        console.log('║   HOD Computer: sureshpatil123@gmail.com / sureshpatil@123       ║');
        console.log('║   Student EE SE: amitjadhav123@gmail.com / amitjadhav@123        ║');
        console.log('║   Student CO TE: rahulpatil123@gmail.com / rahulpatil@123        ║');
        console.log('║   Parent:       sureshpatil.parent@gmail.com / sureshpatil@123    ║');
        console.log('║   Accountant:   accountant@gmail.com / accountant@123           ║');
        console.log('║   Librarian:    librarian@gmail.com / librarian@123               ║');
        console.log('║   Receptionist: receptionist@gmail.com / receptionist@123        ║');
        console.log('║                                                                  ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();