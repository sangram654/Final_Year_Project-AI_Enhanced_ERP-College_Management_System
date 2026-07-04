import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch, FiX, FiHome, FiBook, FiArrowLeft, FiLayers } from 'react-icons/fi';
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

// Common FE Classes (Divisions A, B, C, D) - Generic & Shared across all departments
const feCommonClasses = [
    // Division A
    {
        _id: "mock_fe_div_a_sem_1",
        name: "FE - Div A - Sem 1 (Engineering Physics)",
        department: "Common (First Year)",
        semester: 1,
        section: "A",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. K. R.", lastName: "Mahajan (FE HOD)" } },
        roomNumber: "FE-101",
        isActive: true,
        isMock: true,
        isFE: true
    },
    {
        _id: "mock_fe_div_a_sem_2",
        name: "FE - Div A - Sem 2 (Basic Electrical Engg)",
        department: "Common (First Year)",
        semester: 2,
        section: "A",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. K. R.", lastName: "Mahajan (FE HOD)" } },
        roomNumber: "FE-101",
        isActive: true,
        isMock: true,
        isFE: true
    },
    // Division B
    {
        _id: "mock_fe_div_b_sem_1",
        name: "FE - Div B - Sem 1 (Engineering Chemistry)",
        department: "Common (First Year)",
        semester: 1,
        section: "B",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. S. V.", lastName: "Joshi" } },
        roomNumber: "FE-102",
        isActive: true,
        isMock: true,
        isFE: true
    },
    {
        _id: "mock_fe_div_b_sem_2",
        name: "FE - Div B - Sem 2 (Basic Mechanical Engg)",
        department: "Common (First Year)",
        semester: 2,
        section: "B",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. S. V.", lastName: "Joshi" } },
        roomNumber: "FE-102",
        isActive: true,
        isMock: true,
        isFE: true
    },
    // Division C
    {
        _id: "mock_fe_div_c_sem_1",
        name: "FE - Div C - Sem 1 (Engineering Mechanics)",
        department: "Common (First Year)",
        semester: 1,
        section: "C",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. A. M.", lastName: "Kulkarni" } },
        roomNumber: "FE-103",
        isActive: true,
        isMock: true,
        isFE: true
    },
    {
        _id: "mock_fe_div_c_sem_2",
        name: "FE - Div C - Sem 2 (Basic Electronics)",
        department: "Common (First Year)",
        semester: 2,
        section: "C",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. A. M.", lastName: "Kulkarni" } },
        roomNumber: "FE-103",
        isActive: true,
        isMock: true,
        isFE: true
    },
    // Division D
    {
        _id: "mock_fe_div_d_sem_1",
        name: "FE - Div D - Sem 1 (Programming in C)",
        department: "Common (First Year)",
        semester: 1,
        section: "D",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. N. D.", lastName: "Patel" } },
        roomNumber: "FE-104",
        isActive: true,
        isMock: true,
        isFE: true
    },
    {
        _id: "mock_fe_div_d_sem_2",
        name: "FE - Div D - Sem 2 (Engineering Graphics)",
        department: "Common (First Year)",
        semester: 2,
        section: "D",
        batch: "2025",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. N. D.", lastName: "Patel" } },
        roomNumber: "FE-104",
        isActive: true,
        isMock: true,
        isFE: true
    }
];

// Department Specific Mock Classes (SE, TE, BE only)
const mockDeptClasses = [
    // Computer Engineering
    {
        _id: "mock_ce_3",
        name: "SE - Sem 3 (Data Structures & Algorithms)",
        department: "Computer Engineering",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Sunita", lastName: "Patil" } },
        roomNumber: "LH-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_4",
        name: "SE - Sem 4 (Object Oriented Programming)",
        department: "Computer Engineering",
        semester: 4,
        section: "B",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Vikas", lastName: "Joshi" } },
        roomNumber: "LH-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_5",
        name: "TE - Sem 5 (Computer Networks)",
        department: "Computer Engineering",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Anil", lastName: "Mehta" } },
        roomNumber: "LH-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_6",
        name: "TE - Sem 6 (Database Management Systems)",
        department: "Computer Engineering",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Sneha", lastName: "Deshmukh" } },
        roomNumber: "LH-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_7",
        name: "BE - Sem 7 (Artificial Intelligence)",
        department: "Computer Engineering",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. K. P.", lastName: "Singh" } },
        roomNumber: "LH-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_8",
        name: "BE - Sem 8 (Cloud Computing)",
        department: "Computer Engineering",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Rahul", lastName: "Kulkarni" } },
        roomNumber: "LH-402",
        isActive: true,
        isMock: true
    },

    // Mechanical Engineering
    {
        _id: "mock_me_3",
        name: "SE - Sem 3 (Thermodynamics)",
        department: "Mechanical Engineering",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Manoj", lastName: "Tiwari" } },
        roomNumber: "ME-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_me_4",
        name: "SE - Sem 4 (Strength of Materials)",
        department: "Mechanical Engineering",
        semester: 4,
        section: "B",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Abhay", lastName: "Kulkarni" } },
        roomNumber: "ME-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_me_5",
        name: "TE - Sem 5 (Heat Transfer)",
        department: "Mechanical Engineering",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Sagar", lastName: "Shinde" } },
        roomNumber: "ME-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_me_6",
        name: "TE - Sem 6 (Design of Machine Elements)",
        department: "Mechanical Engineering",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Vijay", lastName: "Rathod" } },
        roomNumber: "ME-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_me_7",
        name: "BE - Sem 7 (CAD/CAM)",
        department: "Mechanical Engineering",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Sandeep", lastName: "Jadhav" } },
        roomNumber: "ME-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_me_8",
        name: "BE - Sem 8 (Refrigeration & AC)",
        department: "Mechanical Engineering",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Mahesh", lastName: "Gupta" } },
        roomNumber: "ME-402",
        isActive: true,
        isMock: true
    },

    // Civil Engineering
    {
        _id: "mock_ce_civ_3",
        name: "SE - Sem 3 (Surveying)",
        department: "Civil Engineering",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Anand", lastName: "Kulkarni" } },
        roomNumber: "CE-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_civ_4",
        name: "SE - Sem 4 (Fluid Mechanics)",
        department: "Civil Engineering",
        semester: 4,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Dilip", lastName: "Joshi" } },
        roomNumber: "CE-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_civ_5",
        name: "TE - Sem 5 (Structural Analysis)",
        department: "Civil Engineering",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Vinayak", lastName: "Deshpande" } },
        roomNumber: "CE-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_civ_6",
        name: "TE - Sem 6 (Geotechnical Engineering)",
        department: "Civil Engineering",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Prakash", lastName: "More" } },
        roomNumber: "CE-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_civ_7",
        name: "BE - Sem 7 (Quantity Surveying & Estimation)",
        department: "Civil Engineering",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Satish", lastName: "Patil" } },
        roomNumber: "CE-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ce_civ_8",
        name: "BE - Sem 8 (Construction Management)",
        department: "Civil Engineering",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Ashok", lastName: "Chavan" } },
        roomNumber: "CE-402",
        isActive: true,
        isMock: true
    },

    // Electrical Engineering
    {
        _id: "mock_ee_3",
        name: "SE - Sem 3 (Network Analysis)",
        department: "Electrical Engineering",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Mangesh", lastName: "Datar" } },
        roomNumber: "EE-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ee_4",
        name: "SE - Sem 4 (DC Machines & Transformers)",
        department: "Electrical Engineering",
        semester: 4,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Vivek", lastName: "Sane" } },
        roomNumber: "EE-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ee_5",
        name: "TE - Sem 5 (Power Systems I)",
        department: "Electrical Engineering",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Shruti", lastName: "Kulkarni" } },
        roomNumber: "EE-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ee_6",
        name: "TE - Sem 6 (Power Electronics)",
        department: "Electrical Engineering",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Pradeep", lastName: "Joshi" } },
        roomNumber: "EE-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ee_7",
        name: "BE - Sem 7 (Electric Drives & Control)",
        department: "Electrical Engineering",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Hemant", lastName: "Mahajan" } },
        roomNumber: "EE-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ee_8",
        name: "BE - Sem 8 (Smart Grid)",
        department: "Electrical Engineering",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Nitin", lastName: "Puranik" } },
        roomNumber: "EE-402",
        isActive: true,
        isMock: true
    },

    // Electronics Engineering
    {
        _id: "mock_extc_3",
        name: "SE - Sem 3 (Electronic Devices & Circuits)",
        department: "Electronics Engineering",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Archana", lastName: "Vaidya" } },
        roomNumber: "EX-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_extc_4",
        name: "SE - Sem 4 (Digital System Design)",
        department: "Electronics Engineering",
        semester: 4,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Jayant", lastName: "Bapat" } },
        roomNumber: "EX-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_extc_5",
        name: "TE - Sem 5 (Microcontrollers & Applications)",
        department: "Electronics Engineering",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Rohit", lastName: "Khare" } },
        roomNumber: "EX-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_extc_6",
        name: "TE - Sem 6 (VLSI Design)",
        department: "Electronics Engineering",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Chetan", lastName: "Wagh" } },
        roomNumber: "EX-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_extc_7",
        name: "BE - Sem 7 (Embedded Systems)",
        department: "Electronics Engineering",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Varsha", lastName: "Apte" } },
        roomNumber: "EX-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_extc_8",
        name: "BE - Sem 8 (Digital Signal Processing)",
        department: "Electronics Engineering",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Sanjay", lastName: "Deshpande" } },
        roomNumber: "EX-402",
        isActive: true,
        isMock: true
    },

    // Information Technology
    {
        _id: "mock_it_3",
        name: "SE - Sem 3 (Data Structures)",
        department: "Information Technology",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Yogesh", lastName: "Kadam" } },
        roomNumber: "IT-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_it_4",
        name: "SE - Sem 4 (Database Systems)",
        department: "Information Technology",
        semester: 4,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Swati", lastName: "Nikam" } },
        roomNumber: "IT-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_it_5",
        name: "TE - Sem 5 (Operating Systems)",
        department: "Information Technology",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Dipak", lastName: "Patil" } },
        roomNumber: "IT-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_it_6",
        name: "TE - Sem 6 (Web Technology)",
        department: "Information Technology",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Manish", lastName: "Sharma" } },
        roomNumber: "IT-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_it_7",
        name: "BE - Sem 7 (Big Data Analytics)",
        department: "Information Technology",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Kavita", lastName: "Rao" } },
        roomNumber: "IT-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_it_8",
        name: "BE - Sem 8 (Cyber Security)",
        department: "Information Technology",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Sandeep", lastName: "Bhosale" } },
        roomNumber: "IT-402",
        isActive: true,
        isMock: true
    },

    // Artificial Intelligence and Machine Learning
    {
        _id: "mock_ai_3",
        name: "SE - Sem 3 (Data Structures & Algorithms)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 3,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Rupali", lastName: "Chavan" } },
        roomNumber: "AI-201",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ai_4",
        name: "SE - Sem 4 (Database Management Systems)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 4,
        section: "A",
        batch: "2024",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Sagar", lastName: "Joshi" } },
        roomNumber: "AI-202",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ai_5",
        name: "TE - Sem 5 (Introduction to ML)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 5,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Poonam", lastName: "Zope" } },
        roomNumber: "AI-301",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ai_6",
        name: "TE - Sem 6 (Neural Networks & Deep Learning)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 6,
        section: "A",
        batch: "2023",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Hemant", lastName: "Bhandari" } },
        roomNumber: "AI-302",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ai_7",
        name: "BE - Sem 7 (Natural Language Processing)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 7,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Prof. Snehal", lastName: "Kharat" } },
        roomNumber: "AI-401",
        isActive: true,
        isMock: true
    },
    {
        _id: "mock_ai_8",
        name: "BE - Sem 8 (Computer Vision)",
        department: "Artificial Intelligence and Machine Learning",
        semester: 8,
        section: "A",
        batch: "2022",
        academicYear: "2024-2025",
        classTeacher: { user: { firstName: "Dr. Vinod", lastName: "Patil" } },
        roomNumber: "AI-402",
        isActive: true,
        isMock: true
    }
];

const SuperAdminClasses = () => {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // States for custom navigation/filtering
    const [filterDepartment, setFilterDepartment] = useState(''); // Empty = All Departments Grid
    const [filterYear, setFilterYear] = useState('FE'); // FE, SE, TE, BE. Default to FE when department is opened.

    const [formData, setFormData] = useState({
        name: '',
        department: '',
        semester: '',
        section: 'A',
        batch: '',
        academicYear: '',
        classTeacher: '',
        roomNumber: ''
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

    // Generate current academic year
    const getCurrentAcademicYear = () => {
        const now = new Date();
        const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-${year + 1}`;
    };

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/classes');
            // Merge with department-specific mock classes (SE, TE, BE)
            const dbClasses = res.data.data || [];
            // Remove any duplicates from db classes if they match any mock classes name + department
            const filteredDbClasses = dbClasses.filter(
                db => !mockDeptClasses.some(mock => mock.name === db.name && mock.department === db.department)
            );
            setClasses([...mockDeptClasses, ...filteredDbClasses]);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setClasses(mockDeptClasses);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.department || !formData.semester || !formData.section || !formData.batch || !formData.academicYear) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                name: formData.name || `${formData.department} - Sem ${formData.semester} - Sec ${formData.section}`
            };

            if (selectedClass) {
                await api.put(`/classes/${selectedClass._id}`, payload);
                toast.success('Class updated successfully');
            } else {
                await api.post('/classes', payload);
                toast.success('Class created successfully');
            }
            fetchClasses();
            closeModal();
        } catch (error) {
            console.error('Error saving class:', error);
            toast.error(error.response?.data?.message || 'Failed to save class');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;

        try {
            await api.delete(`/classes/${id}`);
            toast.success('Class deleted successfully');
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Failed to delete class');
        }
    };

    const openModal = (classDoc = null) => {
        if (classDoc) {
            setSelectedClass(classDoc);
            setFormData({
                name: classDoc.name || '',
                department: classDoc.department || '',
                semester: classDoc.semester || '',
                section: classDoc.section || 'A',
                batch: classDoc.batch || '',
                academicYear: classDoc.academicYear || '',
                classTeacher: classDoc.classTeacher?._id || '',
                roomNumber: classDoc.roomNumber || ''
            });
        } else {
            setSelectedClass(null);
            setFormData({
                name: '',
                department: filterDepartment || '',
                semester: filterYear === 'FE' ? '1' : filterYear === 'SE' ? '3' : filterYear === 'TE' ? '5' : '7',
                section: 'A',
                batch: new Date().getFullYear().toString(),
                academicYear: getCurrentAcademicYear(),
                classTeacher: '',
                roomNumber: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedClass(null);
    };

    // Main Filtering Logic
    const getFilteredClasses = () => {
        // Global search overrides specific department selections
        if (searchTerm) {
            const allAvailable = [...feCommonClasses, ...classes];
            return allAvailable.filter(cls => 
                cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cls.department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // If no department is selected, we are in grid mode and don't list classes in a table
        if (!filterDepartment) return [];

        if (filterYear === 'FE') {
            // FE is common. Return the generic Divisions A, B, C, D classes.
            return feCommonClasses;
        } else {
            // Return department specific SE, TE, BE classes
            return classes.filter(cls => {
                const matchesDept = cls.department === filterDepartment;
                const yearLabel = getYearLabel(cls.semester);
                const matchesYear = yearLabel === filterYear;
                return matchesDept && matchesYear;
            });
        }
    };

    const filteredClasses = getFilteredClasses();

    return (
        <div className="student-page animate-fade-in">
            {/* Page Title Header */}
            <div className="page-header">
                <div>
                    <h1>Classes Management</h1>
                    <p>
                        {filterDepartment 
                            ? `Viewing classes for ${filterDepartment}` 
                            : 'Select a department below to view year-wise classes and divisions'}
                    </p>
                </div>
                {filterDepartment && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FiPlus /> Add Class
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
                                placeholder="Search classes globally by name, subject, or department..."
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
                        <span className="badge badge-info">{filteredClasses.length} records found</span>
                    </div>
                    <div className="table-container">
                        {renderClassesTable(filteredClasses, openModal, handleDelete)}
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
                            // Calculate count: 8 classes (4 years * 2 sem/avg)
                            // FE is common (8 classes), SE/TE/BE specific (6 classes) = 14 total classes shown under this dept
                            const deptSpecificCount = classes.filter(c => c.department === dept).length;
                            const totalCount = feCommonClasses.length + deptSpecificCount;

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
                                                <FiBook size={24} />
                                            </div>
                                            <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>{totalCount} Classes</span>
                                        </div>
                                        <h3 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{dept}</h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Includes Common FE Divisions and department-specific SE, TE, and BE classes.
                                        </p>
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'flex-end' }}>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            Open Department →
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
                    {/* Header back navigation */}
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

                    {/* Classes List Table for selected Year */}
                    <div className="section-card">
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>
                                    {filterYear === 'FE' 
                                        ? 'Common First Year Classes (Divisions A, B, C, D)' 
                                        : `${filterYear} Year Subject Classes`}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {filterYear === 'FE' 
                                        ? 'FE is shared across all departments and has a common First Year HOD.' 
                                        : `Specific classes configured for ${filterDepartment}.`}
                                </p>
                            </div>
                            <span className="badge badge-info">{filteredClasses.length} Classes</span>
                        </div>
                        <div className="table-container">
                            {renderClassesTable(filteredClasses, openModal, handleDelete)}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2>{selectedClass ? 'Edit Class' : 'Add New Class'}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={closeModal}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ padding: 'var(--spacing-6)' }}>
                                <div className="form-group">
                                    <label className="form-label">Department *</label>
                                    <select
                                        className="form-select"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Semester *</label>
                                        <select
                                            className="form-select"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                            required
                                        >
                                            <option value="">Select</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <option key={sem} value={sem}>Semester {sem}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section *</label>
                                        <select
                                            className="form-select"
                                            value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            required
                                        >
                                            {['A', 'B', 'C', 'D'].map(sec => (
                                                <option key={sec} value={sec}>Section {sec}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Batch (Year) *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., 2024"
                                            value={formData.batch}
                                            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Year *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., 2024-2025"
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Class Teacher (Optional)</label>
                                    <select
                                        className="form-select"
                                        value={formData.classTeacher}
                                        onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                                    >
                                        <option value="">Select Class Teacher</option>
                                        {teachers.filter(t => !formData.department || t.department === formData.department).map(teacher => (
                                            <option key={teacher._id} value={teacher._id}>
                                                {teacher.user?.firstName} {teacher.user?.lastName} ({teacher.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Room Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Room 101"
                                        value={formData.roomNumber}
                                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Class Name (Auto-generated if empty)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={formData.department && formData.semester ?
                                            `${formData.department} - Sem ${formData.semester} - Sec ${formData.section}` :
                                            'Auto-generated from department, semester, and section'}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ padding: 'var(--spacing-4) var(--spacing-6)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedClass ? 'Update' : 'Create'} Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component to render the classes table
const renderClassesTable = (list, onEdit, onDelete) => {
    if (list.length === 0) {
        return (
            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                <FiHome size={48} />
                <h3>No Classes Found</h3>
                <p>No classes match the selected filters or search terms.</p>
            </div>
        );
    }

    return (
        <table className="table">
            <thead>
                <tr>
                    <th>Class / Subject Name</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Batch</th>
                    <th>Academic Year</th>
                    <th>Class Teacher</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {list.map((cls) => (
                    <tr key={cls._id}>
                        <td><strong>{cls.name}</strong></td>
                        <td>{cls.department}</td>
                        <td>
                            <span className="badge badge-info" style={{ fontWeight: 600 }}>
                                {getYearLabel(cls.semester)}
                            </span>
                        </td>
                        <td>Sem {cls.semester}</td>
                        <td>{cls.section}</td>
                        <td>{cls.batch}</td>
                        <td>{cls.academicYear}</td>
                        <td>
                            {cls.classTeacher ? (
                                <>
                                    {cls.classTeacher.user?.firstName} {cls.classTeacher.user?.lastName}
                                </>
                            ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not assigned</span>
                            )}
                        </td>
                        <td>
                            <span className={`badge ${cls.isActive ? 'badge-success' : 'badge-error'}`}>
                                {cls.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            {cls.isMock ? (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                    System Generated
                                </span>
                            ) : (
                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => onEdit(cls)}
                                        title="Edit"
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => onDelete(cls._id)}
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

export default SuperAdminClasses;
