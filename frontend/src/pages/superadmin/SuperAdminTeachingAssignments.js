import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiBook, FiUser, FiUsers, FiSearch, FiX, FiRefreshCw, FiArrowLeft, FiLayers, FiDownload, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

// Helper to get Year Label based on semester
const getYearLabel = (semester) => {
    const sem = parseInt(semester);
    if (sem === 1 || sem === 2) return 'FE';
    if (sem === 3 || sem === 4) return 'SE';
    if (sem === 5 || sem === 6) return 'TE';
    if (sem === 7 || sem === 8) return 'BE';
    return 'N/A';
};

// Common FE Teaching Assignments (Divisions A, B, C, D)
const feCommonAssignments = [
    // Division A
    {
        _id: "mock_ta_fe_a_sem1",
        teacherId: { employeeId: "EMP_FE_1", user: { firstName: "Dr. K. R.", lastName: "Mahajan (FE HOD)" } },
        classId: { name: "FE - Div A", displayName: "FE - Div A", department: "Common (First Year)", section: "A" },
        subjectId: { code: "FE101", name: "Engineering Physics" },
        semester: 1,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_fe_a_sem2",
        teacherId: { employeeId: "EMP_FE_1", user: { firstName: "Dr. K. R.", lastName: "Mahajan (FE HOD)" } },
        classId: { name: "FE - Div A", displayName: "FE - Div A", department: "Common (First Year)", section: "A" },
        subjectId: { code: "FE102", name: "Basic Electrical Engg" },
        semester: 2,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    // Division B
    {
        _id: "mock_ta_fe_b_sem1",
        teacherId: { employeeId: "EMP_FE_2", user: { firstName: "Prof. S. V.", lastName: "Joshi" } },
        classId: { name: "FE - Div B", displayName: "FE - Div B", department: "Common (First Year)", section: "B" },
        subjectId: { code: "FE103", name: "Engineering Chemistry" },
        semester: 1,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_fe_b_sem2",
        teacherId: { employeeId: "EMP_FE_2", user: { firstName: "Prof. S. V.", lastName: "Joshi" } },
        classId: { name: "FE - Div B", displayName: "FE - Div B", department: "Common (First Year)", section: "B" },
        subjectId: { code: "FE104", name: "Basic Mechanical Engg" },
        semester: 2,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    // Division C
    {
        _id: "mock_ta_fe_c_sem1",
        teacherId: { employeeId: "EMP_FE_3", user: { firstName: "Prof. A. M.", lastName: "Kulkarni" } },
        classId: { name: "FE - Div C", displayName: "FE - Div C", department: "Common (First Year)", section: "C" },
        subjectId: { code: "FE105", name: "Engineering Mechanics" },
        semester: 1,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_fe_c_sem2",
        teacherId: { employeeId: "EMP_FE_3", user: { firstName: "Prof. A. M.", lastName: "Kulkarni" } },
        classId: { name: "FE - Div C", displayName: "FE - Div C", department: "Common (First Year)", section: "C" },
        subjectId: { code: "FE106", name: "Basic Electronics" },
        semester: 2,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    // Division D
    {
        _id: "mock_ta_fe_d_sem1",
        teacherId: { employeeId: "EMP_FE_4", user: { firstName: "Prof. N. D.", lastName: "Patel" } },
        classId: { name: "FE - Div D", displayName: "FE - Div D", department: "Common (First Year)", section: "D" },
        subjectId: { code: "FE107", name: "Programming in C" },
        semester: 1,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_fe_d_sem2",
        teacherId: { employeeId: "EMP_FE_4", user: { firstName: "Prof. N. D.", lastName: "Patel" } },
        classId: { name: "FE - Div D", displayName: "FE - Div D", department: "Common (First Year)", section: "D" },
        subjectId: { code: "FE108", name: "Engineering Graphics" },
        semester: 2,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    }
];

// Department Specific Mock Teaching Assignments (SE, TE, BE only)
const mockDeptAssignments = [
    // Computer Engineering
    {
        _id: "mock_ta_ce_3",
        teacherId: { employeeId: "EMP_CE_3", user: { firstName: "Dr. Sunita", lastName: "Patil" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Computer Engineering", section: "A" },
        subjectId: { code: "CE301", name: "Data Structures & Algorithms" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ce_4",
        teacherId: { employeeId: "EMP_CE_4", user: { firstName: "Prof. Vikas", lastName: "Joshi" } },
        classId: { name: "SE - Div B", displayName: "SE - Div B", department: "Computer Engineering", section: "B" },
        subjectId: { code: "CE302", name: "Object Oriented Programming" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ce_5",
        teacherId: { employeeId: "EMP_CE_5", user: { firstName: "Dr. Anil", lastName: "Mehta" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Computer Engineering", section: "A" },
        subjectId: { code: "CE501", name: "Computer Networks" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ce_6",
        teacherId: { employeeId: "EMP_CE_6", user: { firstName: "Prof. Sneha", lastName: "Deshmukh" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Computer Engineering", section: "A" },
        subjectId: { code: "CE601", name: "Database Management Systems" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ce_7",
        teacherId: { employeeId: "EMP_CE_7", user: { firstName: "Dr. K. P.", lastName: "Singh" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Computer Engineering", section: "A" },
        subjectId: { code: "CE701", name: "Artificial Intelligence" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ce_8",
        teacherId: { employeeId: "EMP_CE_8", user: { firstName: "Prof. Rahul", lastName: "Kulkarni" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Computer Engineering", section: "A" },
        subjectId: { code: "CE801", name: "Cloud Computing" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Mechanical Engineering
    {
        _id: "mock_ta_me_3",
        teacherId: { employeeId: "EMP_ME_1", user: { firstName: "Prof. Manoj", lastName: "Tiwari" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Mechanical Engineering", section: "A" },
        subjectId: { code: "ME301", name: "Thermodynamics" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_me_4",
        teacherId: { employeeId: "EMP_ME_2", user: { firstName: "Dr. Abhay", lastName: "Kulkarni" } },
        classId: { name: "SE - Div B", displayName: "SE - Div B", department: "Mechanical Engineering", section: "B" },
        subjectId: { code: "ME302", name: "Strength of Materials" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_me_5",
        teacherId: { employeeId: "EMP_ME_3", user: { firstName: "Prof. Sagar", lastName: "Shinde" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Mechanical Engineering", section: "A" },
        subjectId: { code: "ME501", name: "Heat Transfer" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_me_6",
        teacherId: { employeeId: "EMP_ME_4", user: { firstName: "Dr. Vijay", lastName: "Rathod" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Mechanical Engineering", section: "A" },
        subjectId: { code: "ME601", name: "Design of Machine Elements" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_me_7",
        teacherId: { employeeId: "EMP_ME_5", user: { firstName: "Prof. Sandeep", lastName: "Jadhav" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Mechanical Engineering", section: "A" },
        subjectId: { code: "ME701", name: "CAD/CAM" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_me_8",
        teacherId: { employeeId: "EMP_ME_6", user: { firstName: "Dr. Mahesh", lastName: "Gupta" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Mechanical Engineering", section: "A" },
        subjectId: { code: "ME801", name: "Refrigeration & AC" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Civil Engineering
    {
        _id: "mock_ta_civ_3",
        teacherId: { employeeId: "EMP_CE_1", user: { firstName: "Prof. Anand", lastName: "Kulkarni" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE301", name: "Surveying" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_civ_4",
        teacherId: { employeeId: "EMP_CE_2", user: { firstName: "Dr. Dilip", lastName: "Joshi" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE302", name: "Fluid Mechanics" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_civ_5",
        teacherId: { employeeId: "EMP_CE_3", user: { firstName: "Prof. Vinayak", lastName: "Deshpande" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE501", name: "Structural Analysis" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_civ_6",
        teacherId: { employeeId: "EMP_CE_4", user: { firstName: "Dr. Prakash", lastName: "More" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE601", name: "Geotechnical Engineering" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_civ_7",
        teacherId: { employeeId: "EMP_CE_5", user: { firstName: "Prof. Satish", lastName: "Patil" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE701", name: "Quantity Surveying & Estimation" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_civ_8",
        teacherId: { employeeId: "EMP_CE_6", user: { firstName: "Dr. Ashok", lastName: "Chavan" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Civil Engineering", section: "A" },
        subjectId: { code: "CE801", name: "Construction Management" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Electrical Engineering
    {
        _id: "mock_ta_ee_3",
        teacherId: { employeeId: "EMP_EE_1", user: { firstName: "Prof. Mangesh", lastName: "Datar" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE301", name: "Network Analysis" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ee_4",
        teacherId: { employeeId: "EMP_EE_2", user: { firstName: "Dr. Vivek", lastName: "Sane" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE302", name: "DC Machines & Transformers" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ee_5",
        teacherId: { employeeId: "EMP_EE_3", user: { firstName: "Prof. Shruti", lastName: "Kulkarni" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE501", name: "Power Systems I" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ee_6",
        teacherId: { employeeId: "EMP_EE_4", user: { firstName: "Dr. Pradeep", lastName: "Joshi" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE601", name: "Power Electronics" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ee_7",
        teacherId: { employeeId: "EMP_EE_5", user: { firstName: "Prof. Hemant", lastName: "Mahajan" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE701", name: "Electric Drives & Control" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ee_8",
        teacherId: { employeeId: "EMP_EE_6", user: { firstName: "Dr. Nitin", lastName: "Puranik" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Electrical Engineering", section: "A" },
        subjectId: { code: "EE801", name: "Smart Grid" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Electronics Engineering
    {
        _id: "mock_ta_extc_3",
        teacherId: { employeeId: "EMP_EX_1", user: { firstName: "Prof. Archana", lastName: "Vaidya" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX301", name: "Electronic Devices & Circuits" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_extc_4",
        teacherId: { employeeId: "EMP_EX_2", user: { firstName: "Dr. Jayant", lastName: "Bapat" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX302", name: "Digital System Design" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_extc_5",
        teacherId: { employeeId: "EMP_EX_3", user: { firstName: "Prof. Rohit", lastName: "Khare" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX501", name: "Microcontrollers & Applications" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_extc_6",
        teacherId: { employeeId: "EMP_EX_4", user: { firstName: "Dr. Chetan", lastName: "Wagh" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX601", name: "VLSI Design" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_extc_7",
        teacherId: { employeeId: "EMP_EX_5", user: { firstName: "Prof. Varsha", lastName: "Apte" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX701", name: "Embedded Systems" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_extc_8",
        teacherId: { employeeId: "EMP_EX_6", user: { firstName: "Dr. Sanjay", lastName: "Deshpande" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Electronics Engineering", section: "A" },
        subjectId: { code: "EX801", name: "Digital Signal Processing" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Information Technology
    {
        _id: "mock_ta_it_3",
        teacherId: { employeeId: "EMP_IT_1", user: { firstName: "Prof. Yogesh", lastName: "Kadam" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT301", name: "Data Structures" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_it_4",
        teacherId: { employeeId: "EMP_IT_2", user: { firstName: "Dr. Swati", lastName: "Nikam" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT302", name: "Database Systems" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_it_5",
        teacherId: { employeeId: "EMP_IT_3", user: { firstName: "Prof. Dipak", lastName: "Patil" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT501", name: "Operating Systems" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_it_6",
        teacherId: { employeeId: "EMP_IT_4", user: { firstName: "Dr. Manish", lastName: "Sharma" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT601", name: "Web Technology" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_it_7",
        teacherId: { employeeId: "EMP_IT_5", user: { firstName: "Prof. Kavita", lastName: "Rao" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT701", name: "Big Data Analytics" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_it_8",
        teacherId: { employeeId: "EMP_IT_6", user: { firstName: "Dr. Sandeep", lastName: "Bhosale" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Information Technology", section: "A" },
        subjectId: { code: "IT801", name: "Cyber Security" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },

    // Artificial Intelligence and Machine Learning
    {
        _id: "mock_ta_ai_3",
        teacherId: { employeeId: "EMP_AI_1", user: { firstName: "Prof. Rupali", lastName: "Chavan" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI301", name: "Data Structures & Algorithms" },
        semester: 3,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ai_4",
        teacherId: { employeeId: "EMP_AI_2", user: { firstName: "Dr. Sagar", lastName: "Joshi" } },
        classId: { name: "SE - Div A", displayName: "SE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI302", name: "Database Management Systems" },
        semester: 4,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ai_5",
        teacherId: { employeeId: "EMP_AI_3", user: { firstName: "Prof. Poonam", lastName: "Zope" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI501", name: "Introduction to ML" },
        semester: 5,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ai_6",
        teacherId: { employeeId: "EMP_AI_4", user: { firstName: "Dr. Hemant", lastName: "Bhandari" } },
        classId: { name: "TE - Div A", displayName: "TE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI601", name: "Neural Networks & Deep Learning" },
        semester: 6,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ai_7",
        teacherId: { employeeId: "EMP_AI_5", user: { firstName: "Prof. Snehal", lastName: "Kharat" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI701", name: "Natural Language Processing" },
        semester: 7,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    },
    {
        _id: "mock_ta_ai_8",
        teacherId: { employeeId: "EMP_AI_6", user: { firstName: "Dr. Vinod", lastName: "Patil" } },
        classId: { name: "BE - Div A", displayName: "BE - Div A", department: "Artificial Intelligence and Machine Learning", section: "A" },
        subjectId: { code: "AI801", name: "Computer Vision" },
        semester: 8,
        academicYear: "2024-2025",
        isActive: true,
        isMock: true,
        pdfUrl: "/sample_syllabus.pdf"
    }
];

const SuperAdminTeachingAssignments = () => {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // States for custom navigation/filtering
    const [filterDepartment, setFilterDepartment] = useState(''); // Empty = All Departments Grid
    const [filterYear, setFilterYear] = useState('FE'); // FE, SE, TE, BE. Default to FE when department is opened.

    const [formData, setFormData] = useState({
        teacherId: '',
        classId: '',
        subjectId: '',
        academicYear: '',
        semester: ''
    });

    const departments = [
        'Computer Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics Engineering',
        'Information Technology',
        'Artificial Intelligence and Machine Learning'
    ];

    useEffect(() => {
        fetchAssignments();
        fetchTeachers();
        fetchSubjects();
        fetchClasses();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teaching-assignments');
            // Merge with mock teaching assignments
            const dbAssignments = res.data.data || [];
            // Remove any duplicates from db assignments if they match mock assignments code/semester/dept
            const filteredDbAssignments = dbAssignments.filter(
                db => !mockDeptAssignments.some(
                    mock => mock.subjectId?.name === db.subjectId?.name && mock.classId?.name === db.classId?.name
                )
            );
            setAssignments([...mockDeptAssignments, ...filteredDbAssignments]);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setAssignments(mockDeptAssignments);
        }
        setLoading(false);
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const [syncing, setSyncing] = useState(false);

    const handleSyncClasses = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/classes/sync-from-students');
            toast.success(res.data.message || 'Classes synced from student data!');
            fetchClasses(); // Reload classes
        } catch (error) {
            console.error('Error syncing classes:', error);
            toast.error(error.response?.data?.message || 'Failed to sync classes');
        }
        setSyncing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.teacherId || !formData.classId || !formData.subjectId) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            if (selectedAssignment) {
                await api.put(`/teaching-assignments/${selectedAssignment._id}`, formData);
                toast.success('Assignment updated successfully');
            } else {
                await api.post('/teaching-assignments', formData);
                toast.success('Assignment created successfully');
            }
            fetchAssignments();
            closeModal();
        } catch (error) {
            console.error('Error saving assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to save assignment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) return;

        try {
            await api.delete(`/teaching-assignments/${id}`);
            toast.success('Assignment deleted successfully');
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error('Failed to delete assignment');
        }
    };

    const openModal = (assignment = null) => {
        if (assignment) {
            setSelectedAssignment(assignment);
            setFormData({
                teacherId: assignment.teacherId?._id || '',
                classId: assignment.classId?._id || '',
                subjectId: assignment.subjectId?._id || '',
                academicYear: assignment.academicYear || '',
                semester: assignment.semester || ''
            });
        } else {
            setSelectedAssignment(null);
            setFormData({
                teacherId: '',
                classId: '',
                subjectId: '',
                academicYear: '',
                semester: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAssignment(null);
    };

    // Filter Logic
    const getFilteredAssignments = () => {
        // Global search overrides selections
        if (searchTerm) {
            const allAvailable = [...feCommonAssignments, ...assignments];
            return allAvailable.filter(ta =>
                ta.teacherId?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ta.teacherId?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ta.subjectId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ta.classId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // If no department is selected, we are in grid mode and don't list assignments in a table
        if (!filterDepartment) return [];

        if (filterYear === 'FE') {
            // FE is common. Return generic Divisions A, B, C, D teaching assignments.
            return feCommonAssignments;
        } else {
            // Return department specific SE, TE, BE teaching assignments
            return assignments.filter(ta => {
                const matchesDept = ta.classId?.department === filterDepartment;
                const yearLabel = getYearLabel(ta.semester);
                const matchesYear = yearLabel === filterYear;
                return matchesDept && matchesYear;
            });
        }
    };

    const filteredAssignments = getFilteredAssignments();

    // Get selected class details
    const selectedClass = classes.find(c => c._id === formData.classId);

    // Filter subjects based on selected class
    const filteredSubjects = subjects.filter(s => {
        if (!selectedClass) return true;
        return s.department === selectedClass.department && s.semester === selectedClass.semester;
    });

    return (
        <div className="student-page animate-fade-in">
            {/* Page Title Header */}
            <div className="page-header">
                <div>
                    <h1>Teaching Assignments</h1>
                    <p>
                        {filterDepartment
                            ? `Viewing teacher mapping for ${filterDepartment}`
                            : 'Select a department below to view year-wise teaching assignments'}
                    </p>
                </div>
                {filterDepartment && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FiPlus /> Add Assignment
                    </button>
                )}
            </div>

            {/* Global Search Bar */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search assignments globally by teacher, subject or class..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                    {filterDepartment && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setFilterDepartment('');
                                setSearchTerm('');
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                        >
                            <FiArrowLeft /> Back to Departments
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            {searchTerm ? (
                /* GLOBAL SEARCH RESULTS TABLE */
                <div className="section-card">
                    <div className="section-header">
                        <h2>Search Results</h2>
                        <span className="badge badge-info">{filteredAssignments.length} records found</span>
                    </div>
                    <div className="table-container">
                        {renderAssignmentsTable(filteredAssignments, openModal, handleDelete)}
                    </div>
                </div>
            ) : !filterDepartment ? (
                /* GRID OF DEPARTMENT CARDS */
                <div>
                    <h3 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <FiLayers /> All Departments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
                        {departments.map((dept) => {
                            // Calculate count
                            const deptSpecificCount = assignments.filter(a => a.classId?.department === dept).length;
                            const totalCount = feCommonAssignments.length + deptSpecificCount;

                            return (
                                <div
                                    key={dept}
                                    className="section-card"
                                    style={{
                                        padding: 'var(--spacing-6)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '200px'
                                    }}
                                    onClick={() => {
                                        setFilterDepartment(dept);
                                        setFilterYear('FE'); // Default to First Year
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: 'var(--radius-lg)',
                                                background: 'var(--primary-color-light)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary-color)'
                                            }}>
                                                <FiUsers size={24} />
                                            </div>
                                            <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{totalCount} Assignments</span>
                                        </div>
                                        <h3 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{dept}</h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Configure year-wise teacher mappings for FE, SE, TE and BE.
                                        </p>
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'flex-end' }}>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Open Assignments →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* SINGLE DEPARTMENT YEAR-WISE VIEW */
                <div>
                    {/* Header title */}
                    <div style={{ marginBottom: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>
                            {filterDepartment}
                        </h2>
                    </div>

                    {/* Year Tabs: FE, SE, TE, BE */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-2)',
                        marginBottom: 'var(--spacing-6)',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: 'var(--spacing-4)'
                    }}>
                        {['FE', 'SE', 'TE', 'BE'].map((yr) => {
                            const label = yr === 'FE' ? 'FE (First Year - Common)' :
                                yr === 'SE' ? 'SE (Second Year)' :
                                    yr === 'TE' ? 'TE (Third Year)' :
                                        'BE (Fourth Year)';

                            const isSelected = filterYear === yr;
                            return (
                                <button
                                    key={yr}
                                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilterYear(yr)}
                                    style={{
                                        borderRadius: 'var(--radius-pill)',
                                        padding: 'var(--spacing-2) var(--spacing-6)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Assignments List Table for selected Year */}
                    <div className="section-card">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>
                                    {filterYear === 'FE'
                                        ? 'Common First Year Teacher Allocations (Divisions A, B, C, D)'
                                        : `${filterYear} Year Teacher Allocations`}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {filterYear === 'FE'
                                        ? 'FE teacher mappings are shared across all departments.'
                                        : `Specific allocations configured for ${filterDepartment}.`}
                                </p>
                            </div>
                            <span className="badge badge-info">{filteredAssignments.length} Assignments</span>
                        </div>
                        <div className="table-container">
                            {renderAssignmentsTable(filteredAssignments, openModal, handleDelete)}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{selectedAssignment ? 'Edit Assignment' : 'Add Teaching Assignment'}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={closeModal}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ padding: 'var(--spacing-6)' }}>
                                <div className="form-group">
                                    <label className="form-label">Teacher *</label>
                                    <select
                                        className="form-select"
                                        value={formData.teacherId}
                                        onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher._id} value={teacher._id}>
                                                {teacher.user?.firstName} {teacher.user?.lastName} ({teacher.employeeId}) - {teacher.department}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select
                                        className="form-select"
                                        value={formData.classId}
                                        onChange={(e) => {
                                            const cls = classes.find(c => c._id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                classId: e.target.value,
                                                semester: cls?.semester || '',
                                                academicYear: cls?.academicYear || '',
                                                subjectId: '' // Reset subject when class changes
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls._id} value={cls._id}>
                                                {cls.department} - Sem {cls.semester} - Sec {cls.section} ({cls.academicYear})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        className="form-select"
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                        required
                                        disabled={!formData.classId}
                                    >
                                        <option value="">Select Subject</option>
                                        {filteredSubjects.map(subject => (
                                            <option key={subject._id} value={subject._id}>
                                                {subject.code} - {subject.name} (Sem {subject.semester})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedClass && (
                                    <div style={{
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--primary-color-light)',
                                        borderRadius: 'var(--radius-md)',
                                        marginTop: 'var(--spacing-4)'
                                    }}>
                                        <small style={{ color: 'var(--text-secondary)' }}>Auto-filled details:</small>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>
                                            Semester: {selectedClass.semester} | Academic Year: {selectedClass.academicYear}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ padding: 'var(--spacing-4) var(--spacing-6)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedAssignment ? 'Update' : 'Create'} Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component to render the assignments table
const renderAssignmentsTable = (list, onEdit, onDelete) => {
    if (list.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                <FiBook size={48} />
                <h3>No Assignments Found</h3>
                <p>No teaching assignments match the selected filters.</p>
            </div>
        );
    }

    return (
        <table className="table">
            <thead>
                <tr>
                    <th>Teacher</th>
                    <th>Class Name</th>
                    <th>Year</th>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Academic Year</th>
                    <th>Syllabus / Assignment Document</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {list.map((assignment) => (
                    <tr key={assignment._id}>
                        <td>
                            <strong>
                                {assignment.teacherId?.user?.firstName} {assignment.teacherId?.user?.lastName}
                            </strong>
                            <br />
                            <small style={{ color: 'var(--text-secondary)' }}>
                                {assignment.teacherId?.employeeId}
                            </small>
                        </td>
                        <td>
                            <strong>{assignment.classId?.displayName || assignment.classId?.name}</strong>
                            {assignment.classId?.section && (
                                <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                                    Sec {assignment.classId?.section}
                                </small>
                            )}
                        </td>
                        <td>
                            <span className="badge badge-info" style={{ fontWeight: 600 }}>
                                {getYearLabel(assignment.semester)}
                            </span>
                        </td>
                        <td>
                            <strong>{assignment.subjectId?.code || 'SUB'}</strong>
                            <br />
                            <small>{assignment.subjectId?.name}</small>
                        </td>
                        <td>Sem {assignment.semester}</td>
                        <td>{assignment.academicYear}</td>
                        <td style={{ textAlign: 'center' }}>
                            {assignment.pdfUrl ? (
                                <a
                                    href={assignment.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-secondary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-1)',
                                        color: 'var(--primary-color)',
                                        fontWeight: 600
                                    }}
                                    title="View Document"
                                >
                                    <FiFileText /> View PDF
                                </a>
                            ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>N/A</span>
                            )}
                        </td>
                        <td>
                            <span className={`badge ${assignment.isActive ? 'badge-success' : 'badge-error'}`}>
                                {assignment.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            {assignment.isMock ? (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                    System Generated
                                </span>
                            ) : (
                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => onEdit(assignment)}
                                        title="Edit"
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => onDelete(assignment._id)}
                                        title="Delete"
                                        style={{ color: 'var(--error-color)' }}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default SuperAdminTeachingAssignments;