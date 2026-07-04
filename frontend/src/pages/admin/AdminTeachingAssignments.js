import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiBook, FiUser, FiUsers, FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const AdminTeachingAssignments = () => {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

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
            setAssignments(res.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load teaching assignments');
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

    // Filter assignments
    const filteredAssignments = assignments.filter(assignment => {
        const matchesSearch =
            assignment.teacherId?.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.teacherId?.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.subjectId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.subjectId?.code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = !filterDepartment || assignment.classId?.department === filterDepartment;

        return matchesSearch && matchesDepartment;
    });

    // Get selected class details
    const selectedClass = classes.find(c => c._id === formData.classId);

    // Filter subjects based on selected class
    const filteredSubjects = subjects.filter(s => {
        if (!selectedClass) return true;
        return s.department === selectedClass.department && s.semester === selectedClass.semester;
    });

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Teaching Assignments</h1>
                    <p>Manage teacher-to-class-subject assignments</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <FiPlus /> Add Assignment
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
                                placeholder="Search by teacher or subject..."
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
                        <FiBook />
                    </div>
                    <div className="summary-content">
                        <h3>{assignments.length}</h3>
                        <p>Total Assignments</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiUser />
                    </div>
                    <div className="summary-content">
                        <h3>{new Set(assignments.map(a => a.teacherId?._id)).size}</h3>
                        <p>Teachers Assigned</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{new Set(assignments.map(a => a.classId?._id)).size}</h3>
                        <p>Classes Covered</p>
                    </div>
                </div>
            </div>

            {/* Info about Classes */}
            {classes.length === 0 && !loading && (
                <div className="section-card" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)', background: 'var(--warning-color-light)', borderLeft: '4px solid var(--warning-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
                        <div>
                            <strong>Note:</strong> No classes found. Classes are auto-generated from student data.
                            <br />
                            <small>Click "Sync Classes" to create classes based on existing students.</small>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSyncClasses}
                            disabled={syncing}
                        >
                            <FiRefreshCw className={syncing ? 'spin' : ''} />
                            {syncing ? 'Syncing...' : 'Sync Classes from Students'}
                        </button>
                    </div>
                </div>
            )}

            {/* Assignments Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>All Assignments</h2>
                    <span className="badge badge-info">{filteredAssignments.length} records</span>
                </div>
                <div className="table-container">
                    {loading ? (
                        <div className="page-loading" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="spinner"></div>
                            <p>Loading assignments...</p>
                        </div>
                    ) : filteredAssignments.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Semester</th>
                                    <th>Academic Year</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map((assignment) => (
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
                                            <br />
                                            <small>{assignment.classId?.department} - Sec {assignment.classId?.section}</small>
                                        </td>
                                        <td>
                                            <strong>{assignment.subjectId?.code}</strong>
                                            <br />
                                            <small>{assignment.subjectId?.name}</small>
                                        </td>
                                        <td>Sem {assignment.semester}</td>
                                        <td>{assignment.academicYear}</td>
                                        <td>
                                            <span className={`badge ${assignment.isActive ? 'badge-success' : 'badge-error'}`}>
                                                {assignment.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => openModal(assignment)}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleDelete(assignment._id)}
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
                            <FiBook size={48} />
                            <h3>No Assignments Found</h3>
                            <p>Click "Add Assignment" to create your first teaching assignment.</p>
                        </div>
                    )}
                </div>
            </div>

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
                                    {classes.length === 0 && (
                                        <small style={{ color: 'var(--warning-color)' }}>
                                            No classes found. Please create classes first.
                                        </small>
                                    )}
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
                                    {formData.classId && filteredSubjects.length === 0 && (
                                        <small style={{ color: 'var(--warning-color)' }}>
                                            No subjects found for this class's department and semester.
                                        </small>
                                    )}
                                </div>

                                {/* Auto-filled fields display */}
                                {selectedClass && (
                                    <div style={{
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--primary-color-light)',
                                        borderRadius: 'var(--radius-md)',
                                        marginTop: 'var(--spacing-4)'
                                    }}>
                                        <small style={{ color: 'var(--text-secondary)' }}>Auto-filled from class:</small>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>
                                            Semester: {selectedClass.semester} |
                                            Academic Year: {selectedClass.academicYear}
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

export default AdminTeachingAssignments;
