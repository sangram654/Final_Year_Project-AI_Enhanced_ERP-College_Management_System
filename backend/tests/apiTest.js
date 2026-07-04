// Test script to verify all API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let testResults = [];

const log = (module, test, status, details = '') => {
    const result = { module, test, status, details };
    testResults.push(result);
    console.log(`[${status}] ${module}: ${test}${details ? ` - ${details}` : ''}`);
};

const api = axios.create({ baseURL: BASE_URL });

const runTests = async () => {
    console.log('\n========================================');
    console.log('  ERP SYSTEM - API VERIFICATION REPORT');
    console.log('========================================\n');

    // Store tokens for each role
    let tokens = {};
    let profiles = {};

    // ============ AUTH TESTS ============
    console.log('\n--- AUTHENTICATION ---\n');

    // Login as each role
    const credentials = [
        { email: 'admin@samarthcollege.edu.in', password: 'admin123', role: 'admin' },
        { email: 'teacher1@samarthcollege.edu.in', password: 'teacher123', role: 'teacher' },
        { email: 'student1@samarthcollege.edu.in', password: 'student123', role: 'student' },
        { email: 'parent1@gmail.com', password: 'parent123', role: 'parent' },
    ];

    for (const cred of credentials) {
        try {
            const res = await api.post('/auth/login', { email: cred.email, password: cred.password });
            tokens[cred.role] = res.data.token;
            profiles[cred.role] = res.data.user;
            log('Auth', `Login as ${cred.role}`, 'PASS');
        } catch (err) {
            log('Auth', `Login as ${cred.role}`, 'FAIL', err.response?.data?.message || err.message);
        }
    }

    // ============ STUDENT MODULE ============
    console.log('\n--- STUDENT MODULE ---\n');

    const studentId = profiles.student?.studentProfile;
    const studentToken = tokens.student;

    // Test attendance fetch
    try {
        const res = await api.get(`/attendance/student/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Fetch attendance', res.data.success ? 'PASS' : 'FAIL', `${res.data.summary?.total || 0} records`);
    } catch (err) {
        log('Student', 'Fetch attendance', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test attendance summary
    try {
        const res = await api.get(`/attendance/summary/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Attendance summary', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.overall?.percentage || 0}%`);
    } catch (err) {
        log('Student', 'Attendance summary', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test leave application
    try {
        const res = await api.post('/leave', {
            leaveType: 'Sick Leave',
            fromDate: new Date().toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            reason: 'Test leave application from API test'
        }, { headers: { Authorization: `Bearer ${studentToken}` } });
        log('Student', 'Apply leave', res.data.success ? 'PASS' : 'FAIL');
    } catch (err) {
        log('Student', 'Apply leave', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test my leaves
    try {
        const res = await api.get('/leave/my-leaves', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get my leaves', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.length || 0} applications`);
    } catch (err) {
        log('Student', 'Get my leaves', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test student fees
    try {
        const res = await api.get(`/fees/student/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get fees', res.data.success ? 'PASS' : 'FAIL', `Total: ₹${res.data.summary?.total || 0}`);
    } catch (err) {
        log('Student', 'Get fees', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test notes
    try {
        const res = await api.get('/notes', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get notes', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} notes`);
    } catch (err) {
        log('Student', 'Get notes', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test marks
    try {
        const res = await api.get(`/marks/student/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get marks', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.length || 0} records`);
    } catch (err) {
        log('Student', 'Get marks', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test backlogs
    try {
        const res = await api.get(`/marks/backlogs/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get backlogs', res.data.success ? 'PASS' : 'FAIL', `${res.data.summary?.open || 0} open`);
    } catch (err) {
        log('Student', 'Get backlogs', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test scholarships
    try {
        const res = await api.get('/scholarships', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('Student', 'Get scholarships', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} available`);
    } catch (err) {
        log('Student', 'Get scholarships', 'FAIL', err.response?.data?.message || err.message);
    }

    // ============ TEACHER MODULE ============
    console.log('\n--- TEACHER MODULE ---\n');

    const teacherToken = tokens.teacher;
    const teacherProfile = profiles.teacher?.teacherProfile;

    // Test get students
    try {
        const res = await api.get('/students', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        log('Teacher', 'Get students', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} students`);
    } catch (err) {
        log('Teacher', 'Get students', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test mark attendance
    try {
        const studentsRes = await api.get('/students?limit=3', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        const students = studentsRes.data.data || [];

        if (students.length > 0) {
            const subjectsRes = await api.get('/admin/subjects', {
                headers: { Authorization: `Bearer ${tokens.admin}` }
            });
            const subjects = subjectsRes.data.data || [];

            if (subjects.length > 0) {
                const attendanceData = students.map(s => ({
                    studentId: s._id,
                    status: 'Present'
                }));

                const res = await api.post('/attendance/mark', {
                    subjectId: subjects[0]._id,
                    date: new Date().toISOString().split('T')[0],
                    attendanceData
                }, { headers: { Authorization: `Bearer ${teacherToken}` } });

                log('Teacher', 'Mark attendance', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.length || 0} records created`);
            } else {
                log('Teacher', 'Mark attendance', 'SKIP', 'No subjects found');
            }
        } else {
            log('Teacher', 'Mark attendance', 'SKIP', 'No students found');
        }
    } catch (err) {
        log('Teacher', 'Mark attendance', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test upload notes (without file)
    try {
        const res = await api.get('/notes/my-notes', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        log('Teacher', 'Get my notes', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.length || 0} notes`);
    } catch (err) {
        log('Teacher', 'Get my notes', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test enter marks
    try {
        const studentsRes = await api.get('/students?limit=1', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        const students = studentsRes.data.data || [];
        const subjectsRes = await api.get('/admin/subjects', {
            headers: { Authorization: `Bearer ${tokens.admin}` }
        });
        const subjects = subjectsRes.data.data || [];

        if (students.length > 0 && subjects.length > 0) {
            const res = await api.post('/marks', {
                studentId: students[0]._id,
                subjectId: subjects[0]._id,
                examType: 'Unit Test 1',
                marksObtained: 75,
                maxMarks: 100,
                semester: 5,
                academicYear: '2024-25'
            }, { headers: { Authorization: `Bearer ${teacherToken}` } });
            log('Teacher', 'Enter marks', res.data.success ? 'PASS' : 'FAIL');
        } else {
            log('Teacher', 'Enter marks', 'SKIP', 'No students or subjects');
        }
    } catch (err) {
        log('Teacher', 'Enter marks', 'FAIL', err.response?.data?.message || err.message);
    }

    // ============ ADMIN MODULE ============
    console.log('\n--- ADMIN MODULE ---\n');

    const adminToken = tokens.admin;

    // Test dashboard
    try {
        const res = await api.get('/admin/dashboard', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log('Admin', 'Get dashboard', res.data.success ? 'PASS' : 'FAIL', `${res.data.data?.counts?.students || 0} students`);
    } catch (err) {
        log('Admin', 'Get dashboard', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test get all users
    try {
        const res = await api.get('/admin/users', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log('Admin', 'Get users', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} users`);
    } catch (err) {
        log('Admin', 'Get users', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test get subjects
    try {
        const res = await api.get('/admin/subjects', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log('Admin', 'Get subjects', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} subjects`);
    } catch (err) {
        log('Admin', 'Get subjects', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test fee structures
    try {
        const res = await api.get('/fees/structures', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log('Admin', 'Get fee structures', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} structures`);
    } catch (err) {
        log('Admin', 'Get fee structures', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test pending leaves
    try {
        const res = await api.get('/leave/pending', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        log('Admin', 'Get pending leaves', res.data.success ? 'PASS' : 'FAIL', `${res.data.count || 0} pending`);
    } catch (err) {
        log('Admin', 'Get pending leaves', 'FAIL', err.response?.data?.message || err.message);
    }

    // Test approve leave
    try {
        const pendingRes = await api.get('/leave/pending', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const pendingLeaves = pendingRes.data.data || [];

        if (pendingLeaves.length > 0) {
            const res = await api.put(`/leave/${pendingLeaves[0]._id}/review`, {
                status: 'Approved',
                remarks: 'Approved by test script'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            log('Admin', 'Approve leave', res.data.success ? 'PASS' : 'FAIL');
        } else {
            log('Admin', 'Approve leave', 'SKIP', 'No pending leaves');
        }
    } catch (err) {
        log('Admin', 'Approve leave', 'FAIL', err.response?.data?.message || err.message);
    }

    // ============ PARENT MODULE ============
    console.log('\n--- PARENT MODULE ---\n');

    const parentToken = tokens.parent;

    // Test ward dashboard
    try {
        const res = await api.get('/parents/ward-dashboard', {
            headers: { Authorization: `Bearer ${parentToken}` }
        });
        log('Parent', 'Get ward dashboard', res.data.success ? 'PASS' : 'FAIL');
    } catch (err) {
        log('Parent', 'Get ward dashboard', 'FAIL', err.response?.data?.message || err.message);
    }

    // ============ SUMMARY ============
    console.log('\n========================================');
    console.log('             TEST SUMMARY');
    console.log('========================================\n');

    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const skipped = testResults.filter(r => r.status === 'SKIP').length;

    console.log(`PASSED:  ${passed}`);
    console.log(`FAILED:  ${failed}`);
    console.log(`SKIPPED: ${skipped}`);
    console.log(`TOTAL:   ${testResults.length}`);

    if (failed > 0) {
        console.log('\n--- FAILED TESTS ---\n');
        testResults.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  ❌ ${r.module}: ${r.test}`);
            console.log(`     Error: ${r.details}`);
        });
    }

    console.log('\n========================================\n');
};

runTests().catch(console.error);
