import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch, FiX, FiHome } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const AdminClasses = () => {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

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
            setClasses(res.data.data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load classes');
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
                department: '',
                semester: '',
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

    // Filter classes
    const filteredClasses = classes.filter(cls => {
        const matchesSearch =
            cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.department?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = !filterDepartment || cls.department === filterDepartment;

        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Classes</h1>
                    <p>Manage college classes and divisions</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <FiPlus /> Add Class
                </button>
            </div>

            {/* Filters */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ minWidth: '200px' }}>
                        <select
                            className="form-select"
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiHome />
                    </div>
                    <div className="summary-content">
                        <h3>{classes.length}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{new Set(classes.map(c => c.department)).size}</h3>
                        <p>Departments</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{classes.filter(c => c.isActive).length}</h3>
                        <p>Active Classes</p>
                    </div>
                </div>
            </div>

            {/* Classes Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>All Classes</h2>
                    <span className="badge badge-info">{filteredClasses.length} records</span>
                </div>
                <div className="table-container">
                    {loading ? (
                        <div className="page-loading" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="spinner"></div>
                            <p>Loading classes...</p>
                        </div>
                    ) : filteredClasses.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>Department</th>
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
                                {filteredClasses.map((cls) => (
                                    <tr key={cls._id}>
                                        <td><strong>{cls.name}</strong></td>
                                        <td>{cls.department}</td>
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
                                                <span style={{ color: 'var(--text-secondary)' }}>Not assigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${cls.isActive ? 'badge-success' : 'badge-error'}`}>
                                                {cls.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => openModal(cls)}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleDelete(cls._id)}
                                                    title="Delete"
                                                    style={{ color: 'var(--error-color)' }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                            <FiHome size={48} />
                            <h3>No Classes Found</h3>
                            <p>Click "Add Class" to create your first class.</p>
                        </div>
                    )}
                </div>
            </div>

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

export default AdminClasses;
