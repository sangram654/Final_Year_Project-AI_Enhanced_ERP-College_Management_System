import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiCheck, FiX, FiUsers, FiBook, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const TeacherMarks = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedExam, setSelectedExam] = useState('Internal 1');
    const [marksData, setMarksData] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [maxMarks, setMaxMarks] = useState(20);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    // Fetch teacher's teaching assignments on mount
    const fetchMyAssignments = useCallback(async () => {
        setLoadingAssignments(true);
        try {
            const res = await api.get('/teaching-assignments/my-assignments');
            setAssignments(res.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load your teaching assignments');
        }
        setLoadingAssignments(false);
    }, []);

    const fetchStudentsAndMarks = useCallback(async () => {
        if (!selectedAssignment) return;

        setLoading(true);
        try {
            // Fetch students for the assignment
            const res = await api.get(`/teaching-assignments/${selectedAssignment._id}/students`);
            const studentList = res.data.data || [];
            setStudents(studentList);

            // Initialize marks for all students
            const initialMarks = {};
            studentList.forEach(s => {
                initialMarks[s._id] = { obtained: 0, max: maxMarks };
            });

            // Try to fetch existing marks
            try {
                const classInfo = selectedAssignment.classId;
                const marksRes = await api.get('/marks', {
                    params: {
                        subjectId: selectedAssignment.subjectId?._id,
                        examType: selectedExam,
                        department: classInfo?.department,
                        semester: classInfo?.semester || selectedAssignment.semester
                    }
                });

                if (marksRes.data.data && marksRes.data.data.length > 0) {
                    marksRes.data.data.forEach(mark => {
                        const studentId = mark.student?._id || mark.student;
                        if (initialMarks[studentId]) {
                            initialMarks[studentId] = {
                                obtained: mark.obtainedMarks || 0,
                                max: mark.maxMarks || maxMarks,
                                markId: mark._id
                            };
                        }
                    });
                    toast.info('Existing marks loaded');
                }
            } catch (err) {
                console.log('No existing marks found');
            }

            setMarksData(initialMarks);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load students');
            setStudents([]);
        }
        setLoading(false);
    }, [selectedAssignment, selectedExam, maxMarks]);

    useEffect(() => {
        fetchMyAssignments();
    }, [fetchMyAssignments]);

    // Fetch students when assignment is selected
    useEffect(() => {
        if (selectedAssignment) {
            fetchStudentsAndMarks();
        } else {
            setStudents([]);
            setMarksData({});
        }
    }, [selectedAssignment, selectedExam, fetchStudentsAndMarks]);

    // Update max marks based on exam type and subject config
    useEffect(() => {
        const subjectMaxMarks = selectedAssignment?.subjectId?.maxMarks;
        if (subjectMaxMarks) {
            switch (selectedExam) {
                case 'Internal 1':
                case 'Internal 2':
                    setMaxMarks(subjectMaxMarks.internal || 20);
                    break;
                case 'Mid Term':
                    setMaxMarks(50);
                    break;
                case 'End Term':
                    setMaxMarks(subjectMaxMarks.theory || 80);
                    break;
                case 'Practical':
                    setMaxMarks(subjectMaxMarks.practical || 20);
                    break;
                default:
                    setMaxMarks(20);
            }
        } else {
            switch (selectedExam) {
                case 'Internal 1':
                case 'Internal 2':
                    setMaxMarks(20);
                    break;
                case 'Mid Term':
                    setMaxMarks(50);
                    break;
                case 'End Term':
                    setMaxMarks(100);
                    break;
                case 'Practical':
                    setMaxMarks(20);
                    break;
                default:
                    setMaxMarks(20);
            }
        }
    }, [selectedExam, selectedAssignment]);

    const handleMarksChange = (studentId, value) => {
        const numValue = parseInt(value) || 0;
        setMarksData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                obtained: Math.min(Math.max(0, numValue), prev[studentId]?.max || maxMarks)
            }
        }));
    };

    const calculateGrade = (obtained, max) => {
        const percentage = (obtained / max) * 100;
        if (percentage >= 90) return { grade: 'O', color: 'var(--success-color)' };
        if (percentage >= 80) return { grade: 'A+', color: 'var(--success-color)' };
        if (percentage >= 70) return { grade: 'A', color: 'var(--primary-color)' };
        if (percentage >= 60) return { grade: 'B+', color: 'var(--primary-color)' };
        if (percentage >= 50) return { grade: 'B', color: 'var(--warning-color)' };
        if (percentage >= 40) return { grade: 'C', color: 'var(--warning-color)' };
        if (percentage >= 33) return { grade: 'D', color: 'var(--warning-color)' };
        return { grade: 'F', color: 'var(--error-color)' };
    };

    const handleSubmit = async () => {
        if (!selectedAssignment) {
            toast.error('Please select a teaching assignment');
            return;
        }

        if (students.length === 0) {
            toast.error('No students to save marks');
            return;
        }

        setSubmitting(true);
        try {
            const marksToSave = students.map(student => ({
                studentId: student._id,
                marksObtained: marksData[student._id]?.obtained || 0,
                maxMarks: marksData[student._id]?.max || maxMarks
            }));

            await api.post('/marks/bulk', {
                assignmentId: selectedAssignment._id,
                examType: selectedExam,
                marks: marksToSave
            });

            toast.success('Marks saved successfully!');
            setEditMode(false);
        } catch (error) {
            console.error('Error saving marks:', error);
            toast.error(error.response?.data?.message || 'Failed to save marks');
        }
        setSubmitting(false);
    };

    // Handle assignment selection
    const handleAssignmentSelect = (assignmentId) => {
        const assignment = assignments.find(a => a._id === assignmentId);
        setSelectedAssignment(assignment || null);
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Enter Marks</h1>
                    <p>Enter and manage student marks for your assigned subjects</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    {editMode ? (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                <FiCheck /> {submitting ? 'Saving...' : 'Save Marks'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                                <FiX /> Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditMode(true)}
                            disabled={students.length === 0}
                        >
                            <FiEdit2 /> Edit Marks
                        </button>
                    )}
                </div>
            </div>

            {/* Teaching Assignment & Exam Selection */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <div className="form-group">
                        <label className="form-label">
                            <FiBook style={{ marginRight: '8px' }} />
                            Teaching Assignment *
                        </label>
                        {loadingAssignments ? (
                            <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                                Loading assignments...
                            </div>
                        ) : (
                            <select
                                className="form-select"
                                value={selectedAssignment?._id || ''}
                                onChange={(e) => handleAssignmentSelect(e.target.value)}
                            >
                                <option value="">Select Teaching Assignment</option>
                                {assignments.map(assignment => (
                                    <option key={assignment._id} value={assignment._id}>
                                        {assignment.subjectId?.code || 'N/A'} - {assignment.subjectId?.name || 'N/A'}
                                        ({assignment.classId?.department || 'N/A'} - Sem {assignment.classId?.semester || assignment.semester}, Sec {assignment.classId?.section || 'N/A'})
                                    </option>
                                ))}
                            </select>
                        )}
                        {assignments.length === 0 && !loadingAssignments && (
                            <small style={{ color: 'var(--warning-color)', marginTop: '4px', display: 'block' }}>
                                No teaching assignments found. Please contact admin.
                            </small>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            <FiFileText style={{ marginRight: '8px' }} />
                            Exam Type
                        </label>
                        <select
                            className="form-select"
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="Internal 1">Internal 1 (Max: {selectedAssignment?.subjectId?.maxMarks?.internal || 20})</option>
                            <option value="Internal 2">Internal 2 (Max: {selectedAssignment?.subjectId?.maxMarks?.internal || 20})</option>
                            <option value="Mid Term">Mid Term (Max: 50)</option>
                            <option value="End Term">End Term (Max: {selectedAssignment?.subjectId?.maxMarks?.theory || 80})</option>
                            <option value="Practical">Practical (Max: {selectedAssignment?.subjectId?.maxMarks?.practical || 20})</option>
                        </select>
                    </div>
                </div>

                {/* Auto-resolved class info */}
                {selectedAssignment && (
                    <div style={{
                        padding: 'var(--spacing-4) var(--spacing-6)',
                        background: 'var(--primary-color-light)',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: 'var(--spacing-6)',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <small style={{ color: 'var(--text-secondary)' }}>Department</small>
                            <p style={{ margin: 0, fontWeight: '600' }}>{selectedAssignment.classId?.department || 'N/A'}</p>
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)' }}>Semester</small>
                            <p style={{ margin: 0, fontWeight: '600' }}>{selectedAssignment.classId?.semester || selectedAssignment.semester}</p>
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)' }}>Section</small>
                            <p style={{ margin: 0, fontWeight: '600' }}>{selectedAssignment.classId?.section || 'N/A'}</p>
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)' }}>Subject</small>
                            <p style={{ margin: 0, fontWeight: '600' }}>{selectedAssignment.subjectId?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <small style={{ color: 'var(--text-secondary)' }}>Max Marks</small>
                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary-color)' }}>{maxMarks}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Marks Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Student Marks - {selectedExam}</h2>
                    <span className="badge badge-info">Max Marks: {maxMarks}</span>
                </div>
                <div className="table-container">
                    {loading ? (
                        <div className="page-loading" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="spinner"></div>
                            <p>Loading students...</p>
                        </div>
                    ) : students.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Name</th>
                                    <th>Marks Obtained</th>
                                    <th>Percentage</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const marks = marksData[student._id] || { obtained: 0, max: maxMarks };
                                    const percentage = marks.max > 0 ? ((marks.obtained / marks.max) * 100).toFixed(1) : '0.0';
                                    const gradeInfo = calculateGrade(marks.obtained, marks.max);
                                    return (
                                        <tr key={student._id}>
                                            <td><strong>{student.rollNumber}</strong></td>
                                            <td>{student.user?.firstName} {student.user?.lastName}</td>
                                            <td>
                                                {editMode ? (
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        style={{ width: 80 }}
                                                        value={marks.obtained}
                                                        min={0}
                                                        max={marks.max}
                                                        onChange={(e) => handleMarksChange(student._id, e.target.value)}
                                                    />
                                                ) : (
                                                    <span>{marks.obtained} / {marks.max}</span>
                                                )}
                                            </td>
                                            <td>{percentage}%</td>
                                            <td>
                                                <span className="badge" style={{ background: gradeInfo.color, color: 'white' }}>
                                                    {gradeInfo.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                            <FiUsers size={48} />
                            <h3>No Students Found</h3>
                            <p>{selectedAssignment
                                ? 'No students enrolled in this class.'
                                : 'Please select a teaching assignment to load students.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics */}
            {students.length > 0 && (
                <div className="summary-grid" style={{ marginTop: 'var(--spacing-6)' }}>
                    <div className="summary-card">
                        <div className="summary-icon total">
                            <FiUsers />
                        </div>
                        <div className="summary-content">
                            <h3>{students.length}</h3>
                            <p>Total Students</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon present">
                            <FiCheck />
                        </div>
                        <div className="summary-content">
                            <h3>{students.filter(s => (marksData[s._id]?.obtained || 0) >= (maxMarks * 0.33)).length}</h3>
                            <p>Passed (≥33%)</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon absent">
                            <FiX />
                        </div>
                        <div className="summary-content">
                            <h3>{students.filter(s => (marksData[s._id]?.obtained || 0) < (maxMarks * 0.33)).length}</h3>
                            <p>Failed (&lt;33%)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherMarks;
