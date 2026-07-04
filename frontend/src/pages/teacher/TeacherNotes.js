import React, { useState, useEffect } from 'react';
import { 
    FiUpload, FiFileText, FiDownload, FiTrash2, FiSearch, FiPlus, FiFile, 
    FiCalendar, FiClock, FiUsers, FiCheckCircle, FiAlertCircle,
    FiEye, FiBook, FiClipboard
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';
import { useAuth } from '../../context/AuthContext';

const TeacherNotes = () => {
    const { profile } = useAuth();
    const backendBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    // Active tab: 'notes' or 'assignments'
    const [activeTab, setActiveTab] = useState('notes');
    
    // Common states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    
    // Notes states
    const [notes, setNotes] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filePreview, setFilePreview] = useState(null); // For local preview before upload
    const [previewNote, setPreviewNote] = useState(null); // For previewing already uploaded notes
    const [uploadForm, setUploadForm] = useState({
        title: '',
        subjectId: '',
        type: 'Notes',
        description: '',
        file: null
    });

    // Assignment states
    const [assignments, setAssignments] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        subjectId: '',
        classId: '',
        description: '',
        instructions: '',
        dueDate: '',
        totalMarks: 100,
        file: null
    });

    useEffect(() => {
        if (profile?.department) {
            fetchSubjects(profile.department);
        } else {
            fetchSubjects();
        }
        fetchClasses();
    }, [profile]);

    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    useEffect(() => {
        if (activeTab === 'notes') {
            fetchNotes();
        } else {
            fetchAssignments();
        }
    }, [activeTab]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notes/my-notes');
            setNotes(res.data.data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load notes');
            setNotes([]);
        }
        setLoading(false);
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assignments/teacher');
            setAssignments(res.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            // Fallback: show empty list if API not ready
            setAssignments([]);
        }
        setLoading(false);
    };

    const fetchSubjects = async (department) => {
        try {
            const url = department ? `/subjects?department=${encodeURIComponent(department)}` : '/subjects';
            const res = await api.get(url);
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

    const fetchSubmissions = async (assignmentId) => {
        try {
            const res = await api.get(`/assignments/${assignmentId}/submissions`);
            setSubmissions(res.data.data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setSubmissions([]);
        }
    };

    // Notes handlers
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setUploadForm({ ...uploadForm, file: selectedFile });

        // Clean up previous preview URL
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }

        if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setFilePreview(objectUrl);
        } else {
            setFilePreview(null);
        }
    };

    const closeUploadModal = () => {
        setShowUploadModal(false);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        setUploadForm({ title: '', subjectId: '', type: 'Notes', description: '', file: null });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.title || !uploadForm.subjectId) {
            toast.error('Please fill all required fields');
            return;
        }

        if (!uploadForm.file) {
            toast.error('Please select a file to upload');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('subjectId', uploadForm.subjectId);
            formData.append('type', uploadForm.type);
            formData.append('description', uploadForm.description);
            formData.append('noteFile', uploadForm.file);

            await api.post('/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Notes uploaded successfully!');
            closeUploadModal();
            fetchNotes();
        } catch (error) {
            console.error('Error uploading note:', error);
            toast.error(error.response?.data?.message || 'Failed to upload notes');
        }
        setSubmitting(false);
    };

    const handleDownload = async (note) => {
        try {
            const res = await api.get(`/notes/${note._id}/download`);
            if (res.data.success) {
                const fileUrl = `${backendBaseUrl}${res.data.data.downloadUrl}`;
                const link = document.createElement('a');
                link.href = fileUrl;
                link.target = '_blank';
                link.download = res.data.data.filename || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Download started');
                fetchNotes();
            }
        } catch (error) {
            console.error('Error downloading:', error);
            toast.error('Failed to download file');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await api.delete(`/notes/${noteId}`);
                toast.success('Note deleted successfully');
                fetchNotes();
            } catch (error) {
                console.error('Error deleting note:', error);
                toast.error(error.response?.data?.message || 'Failed to delete note');
            }
        }
    };

    // Assignment handlers
    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!assignmentForm.title || !assignmentForm.subjectId || !assignmentForm.classId || !assignmentForm.dueDate) {
            toast.error('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', assignmentForm.title);
            formData.append('subjectId', assignmentForm.subjectId);
            formData.append('classId', assignmentForm.classId);
            formData.append('description', assignmentForm.description);
            formData.append('instructions', assignmentForm.instructions);
            formData.append('dueDate', assignmentForm.dueDate);
            formData.append('totalMarks', assignmentForm.totalMarks);
            if (assignmentForm.file) {
                formData.append('assignmentFile', assignmentForm.file);
            }

            await api.post('/assignments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Assignment created successfully!');
            setShowAssignmentModal(false);
            resetAssignmentForm();
            fetchAssignments();
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to create assignment');
        }
        setSubmitting(false);
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment? All submissions will be lost.')) {
            try {
                await api.delete(`/assignments/${assignmentId}`);
                toast.success('Assignment deleted successfully');
                fetchAssignments();
            } catch (error) {
                console.error('Error deleting assignment:', error);
                toast.error(error.response?.data?.message || 'Failed to delete assignment');
            }
        }
    };

    const handleViewSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        await fetchSubmissions(assignment._id);
        setShowSubmissionsModal(true);
    };

    const handleGradeSubmission = async (submissionId, marks, feedback) => {
        try {
            await api.put(`/assignments/submissions/${submissionId}/grade`, {
                marks,
                feedback
            });
            toast.success('Submission graded successfully');
            fetchSubmissions(selectedAssignment._id);
        } catch (error) {
            console.error('Error grading submission:', error);
            toast.error('Failed to grade submission');
        }
    };

    const resetAssignmentForm = () => {
        setAssignmentForm({
            title: '',
            subjectId: '',
            classId: '',
            description: '',
            instructions: '',
            dueDate: '',
            totalMarks: 100,
            file: null
        });
    };

    // Filters
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = !filterSubject || note.subject?._id === filterSubject;
        return matchesSearch && matchesSubject;
    });

    const filteredAssignments = assignments.filter(assignment => {
        const matchesSearch = assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            assignment.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = !filterSubject || assignment.subject?._id === filterSubject;
        return matchesSearch && matchesSubject;
    });

    // Utility functions
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Notes': return '📖';
            case 'Assignment': return '📝';
            case 'Syllabus': return '📋';
            case 'Question Paper': return '📄';
            case 'Presentation': return '📊';
            case 'Lab Manual': return '🔬';
            default: return '📄';
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getAssignmentStatus = (assignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        if (dueDate < now) return { label: 'Past Due', color: 'var(--error-color)', icon: <FiAlertCircle /> };
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 2) return { label: `${daysLeft}d left`, color: 'var(--warning-color)', icon: <FiClock /> };
        return { label: 'Active', color: 'var(--success-color)', icon: <FiCheckCircle /> };
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading {activeTab}...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Notes & Assignments</h1>
                    <p>Upload study materials and manage assignments</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => activeTab === 'notes' ? setShowUploadModal(true) : setShowAssignmentModal(true)}
                >
                    <FiPlus /> {activeTab === 'notes' ? 'Upload Notes' : 'Create Assignment'}
                </button>
            </div>

            {/* Tabs */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                        style={{
                            padding: 'var(--spacing-4) var(--spacing-6)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: activeTab === 'notes' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'notes' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)'
                        }}
                    >
                        <FiBook /> Study Materials ({notes.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assignments')}
                        style={{
                            padding: 'var(--spacing-4) var(--spacing-6)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: activeTab === 'assignments' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)'
                        }}
                    >
                        <FiClipboard /> Assignments ({assignments.length})
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <select
                            className="form-select"
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(subject => (
                                <option key={subject._id} value={subject._id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes Tab Content */}
            {activeTab === 'notes' && (
                <>
                    {filteredNotes.length > 0 ? (
                        <div className="materials-grid" style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                            {filteredNotes.map((note) => (
                                <div
                                    key={note._id}
                                    className="material-card"
                                    style={{
                                        background: 'white',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--spacing-4)',
                                        display: 'flex',
                                        gap: 'var(--spacing-4)',
                                        alignItems: 'flex-start',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div className="material-icon" style={{ fontSize: '1.3rem', marginTop: '2px' }}>
                                        {getTypeIcon(note.type)}
                                    </div>
                                    <div className="material-content">
                                        <h3 style={{ margin: '0 0 var(--spacing-1)', lineHeight: 1.3 }}>{note.title}</h3>
                                        <p className="material-subject" style={{ margin: 0, color: 'var(--text-secondary)' }}>{note.subject?.name || 'Unknown Subject'}</p>
                                        <div className="material-meta" style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center', marginTop: 'var(--spacing-2)' }}>
                                            <span className="badge badge-info">{note.type}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{formatFileSize(note.file?.size)}</span>
                                        </div>
                                        <div className="material-stats" style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center', marginTop: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)' }}>
                                                <FiDownload /> {note.downloads || 0} downloads
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>{formatDate(note.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="material-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setPreviewNote(note)}>
                                            <FiEye /> Preview
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(note)}>
                                            <FiDownload /> Download
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleDeleteNote(note._id)}
                                            style={{ color: 'var(--error-color)' }}
                                        >
                                            <FiTrash2 /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="section-card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <FiFileText size={48} />
                                <h3>No Notes Found</h3>
                                <p>{searchQuery ? 'No notes match your search.' : 'Upload your first study material to get started.'}</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Assignments Tab Content */}
            {activeTab === 'assignments' && (
                <>
                    {filteredAssignments.length > 0 ? (
                        <div className="materials-grid" style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                            {filteredAssignments.map((assignment) => {
                                const status = getAssignmentStatus(assignment);
                                return (
                                    <div
                                        key={assignment._id}
                                        className="material-card"
                                        style={{
                                            borderLeft: `4px solid ${status.color}`,
                                            background: 'white',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--border-color)',
                                            padding: 'var(--spacing-4)',
                                            display: 'flex',
                                            gap: 'var(--spacing-4)',
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <div className="material-icon" style={{ fontSize: '1.3rem', marginTop: '2px' }}>📝</div>
                                        <div className="material-content">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                                                <h3 style={{ margin: 0 }}>{assignment.title}</h3>
                                            </div>
                                            <p className="material-subject">{assignment.subject?.name || 'Unknown Subject'}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 'var(--spacing-1) 0' }}>
                                                Class: {assignment.class?.name || 'All Classes'}
                                            </p>
                                            <div className="material-meta" style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span className="badge" style={{ background: status.color, color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    {status.icon} {status.label}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                                    <FiCalendar /> Due: {formatDate(assignment.dueDate)}
                                                </span>
                                            </div>
                                            <div className="material-stats" style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-2)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <FiUsers /> {assignment.submissionCount || 0} submissions
                                                </span>
                                                <span>Max: {assignment.totalMarks} marks</span>
                                            </div>
                                        </div>
                                        <div className="material-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleViewSubmissions(assignment)}
                                            >
                                                <FiEye /> View Submissions
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDeleteAssignment(assignment._id)}
                                                style={{ color: 'var(--error-color)' }}
                                            >
                                                <FiTrash2 /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="section-card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <FiClipboard size={48} />
                                <h3>No Assignments Found</h3>
                                <p>{searchQuery ? 'No assignments match your search.' : 'Create your first assignment to get started.'}</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Upload Notes Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={closeUploadModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><FiUpload /> Upload Study Material</h2>
                            <button className="modal-close" onClick={closeUploadModal}>×</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                    placeholder="Enter note title"
                                    required
                                />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        className="form-select"
                                        value={uploadForm.subjectId}
                                        onChange={(e) => setUploadForm({ ...uploadForm, subjectId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {['First Year (FE)', 'Second Year (SE)', 'Third Year (TE)', 'Fourth/Final Year (BE)'].map((yearLabel, index) => {
                                            const startSem = index * 2 + 1;
                                            const endSem = index * 2 + 2;
                                            const yearSubjects = subjects.filter(
                                                s => !s.code?.startsWith('RANDOM') && s.semester >= startSem && s.semester <= endSem
                                            );
                                            
                                            if (yearSubjects.length === 0) return null;
                                            
                                            return (
                                                <optgroup key={yearLabel} label={yearLabel}>
                                                    {yearSubjects.map(subject => (
                                                        <option key={subject._id} value={subject._id}>
                                                            Sem {subject.semester} - {subject.code}: {subject.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                        {subjects.filter(s => s.code?.startsWith('RANDOM')).length > 0 && (
                                            <optgroup label="Other / Random">
                                                {subjects.filter(s => s.code?.startsWith('RANDOM')).map(subject => (
                                                    <option key={subject._id} value={subject._id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={uploadForm.type}
                                        onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                    >
                                        <option value="Notes">Notes</option>
                                        <option value="Question Paper">Question Paper</option>
                                        <option value="Presentation">Presentation</option>
                                        <option value="Lab Manual">Lab Manual</option>
                                        <option value="Syllabus">Syllabus</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    placeholder="Brief description..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">File * (PDF, DOC, PPT, etc.)</label>
                                <div style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--spacing-4)',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'var(--bg-secondary)'
                                }}>
                                    <input
                                        type="file"
                                        id="file-input"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
                                    />
                                    <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                                        {uploadForm.file ? (
                                            <div>
                                                <FiFile size={24} style={{ color: 'var(--primary-color)' }} />
                                                <p style={{ margin: 'var(--spacing-1) 0 0', fontWeight: 500 }}>{uploadForm.file.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatFileSize(uploadForm.file.size)}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <FiUpload size={24} style={{ color: 'var(--text-muted)' }} />
                                                <p style={{ margin: 'var(--spacing-1) 0 0', color: 'var(--text-muted)' }}>Click to select a file</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Local Preview inside Modal */}
                            {filePreview && (
                                <div style={{ 
                                    marginTop: 'var(--spacing-4)', 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: 'var(--radius-md)', 
                                    overflow: 'hidden' 
                                }}>
                                    <div style={{ 
                                        background: 'var(--bg-secondary)', 
                                        padding: 'var(--spacing-2) var(--spacing-3)', 
                                        fontSize: '0.875rem', 
                                        borderBottom: '1px solid var(--border-color)', 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <strong>Selected File Preview</strong>
                                        <span 
                                            style={{ color: 'var(--error-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} 
                                            onClick={() => {
                                                if (filePreview) URL.revokeObjectURL(filePreview);
                                                setFilePreview(null);
                                            }}
                                        >
                                            Hide Preview
                                        </span>
                                    </div>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        {uploadForm.file?.type === 'application/pdf' || uploadForm.file?.name?.toLowerCase().endsWith('.pdf') ? (
                                            <iframe 
                                                src={filePreview} 
                                                width="100%" 
                                                height="100%" 
                                                style={{ border: 'none' }} 
                                                title="Local PDF Preview" 
                                            />
                                        ) : (
                                            <img 
                                                src={filePreview} 
                                                alt="Local Preview" 
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeUploadModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <FiUpload /> {submitting ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Assignment Modal */}
            {showAssignmentModal && (
                <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2><FiClipboard /> Create Assignment</h2>
                            <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="form-group">
                                <label className="form-label">Assignment Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={assignmentForm.title}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                    placeholder="e.g., Unit 1 Assignment - Data Structures"
                                    required
                                />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        className="form-select"
                                        value={assignmentForm.subjectId}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {['First Year (FE)', 'Second Year (SE)', 'Third Year (TE)', 'Fourth/Final Year (BE)'].map((yearLabel, index) => {
                                            const startSem = index * 2 + 1;
                                            const endSem = index * 2 + 2;
                                            const yearSubjects = subjects.filter(
                                                s => !s.code?.startsWith('RANDOM') && s.semester >= startSem && s.semester <= endSem
                                            );
                                            
                                            if (yearSubjects.length === 0) return null;
                                            
                                            return (
                                                <optgroup key={yearLabel} label={yearLabel}>
                                                    {yearSubjects.map(subject => (
                                                        <option key={subject._id} value={subject._id}>
                                                            Sem {subject.semester} - {subject.code}: {subject.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                        {subjects.filter(s => s.code?.startsWith('RANDOM')).length > 0 && (
                                            <optgroup label="Other / Random">
                                                {subjects.filter(s => s.code?.startsWith('RANDOM')).map(subject => (
                                                    <option key={subject._id} value={subject._id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select
                                        className="form-select"
                                        value={assignmentForm.classId}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls._id} value={cls._id}>
                                                {cls.name} {cls.division ? `- ${cls.division}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Due Date *</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Marks</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={assignmentForm.totalMarks}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: parseInt(e.target.value) })}
                                        min="1"
                                        max="500"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={assignmentForm.description}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                                    placeholder="Brief description of the assignment..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instructions</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={assignmentForm.instructions}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                                    placeholder="Specific instructions for students..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Attachment (Optional)</label>
                                <div style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--spacing-3)',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'var(--bg-secondary)'
                                }}>
                                    <input
                                        type="file"
                                        id="assignment-file-input"
                                        style={{ display: 'none' }}
                                        onChange={(e) => setAssignmentForm({ ...assignmentForm, file: e.target.files[0] })}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png"
                                    />
                                    <label htmlFor="assignment-file-input" style={{ cursor: 'pointer' }}>
                                        {assignmentForm.file ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}>
                                                <FiFile style={{ color: 'var(--primary-color)' }} />
                                                <span>{assignmentForm.file.name}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({formatFileSize(assignmentForm.file.size)})</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)', color: 'var(--text-muted)' }}>
                                                <FiUpload /> Attach question paper or reference material
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowAssignmentModal(false); resetAssignmentForm(); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <FiPlus /> {submitting ? 'Creating...' : 'Create Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Submissions Modal */}
            {showSubmissionsModal && selectedAssignment && (
                <div className="modal-overlay" onClick={() => setShowSubmissionsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <div>
                                <h2><FiUsers /> Submissions</h2>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedAssignment.title}</p>
                            </div>
                            <button className="modal-close" onClick={() => setShowSubmissionsModal(false)}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)' }}>
                            {submissions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                    {submissions.map((submission) => (
                                        <div 
                                            key={submission._id} 
                                            style={{ 
                                                padding: 'var(--spacing-4)', 
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--bg-secondary)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 var(--spacing-1)' }}>{submission.student?.name || 'Unknown Student'}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                        Roll No: {submission.student?.rollNumber || 'N/A'} • 
                                                        Submitted: {formatDate(submission.submittedAt)}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    {submission.marks !== undefined && submission.marks !== null ? (
                                                        <span className="badge badge-success">
                                                            {submission.marks}/{selectedAssignment.totalMarks}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-warning">Not Graded</span>
                                                    )}
                                                </div>
                                            </div>
                                            {submission.file && (
                                                <div style={{ marginTop: 'var(--spacing-2)' }}>
                                                    <a 
                                                        href={`${backendBaseUrl}${submission.file.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        <FiDownload /> Download Submission
                                                    </a>
                                                </div>
                                            )}
                                            {/* Quick Grade Form */}
                                            <div style={{ marginTop: 'var(--spacing-3)', display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="Marks"
                                                    defaultValue={submission.marks}
                                                    min="0"
                                                    max={selectedAssignment.totalMarks}
                                                    style={{ width: '80px' }}
                                                    id={`marks-${submission._id}`}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Feedback (optional)"
                                                    defaultValue={submission.feedback}
                                                    style={{ flex: 1 }}
                                                    id={`feedback-${submission._id}`}
                                                />
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => {
                                                        const marks = document.getElementById(`marks-${submission._id}`).value;
                                                        const feedback = document.getElementById(`feedback-${submission._id}`).value;
                                                        if (marks) {
                                                            handleGradeSubmission(submission._id, parseInt(marks), feedback);
                                                        }
                                                    }}
                                                >
                                                    <FiCheckCircle /> Grade
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                                    <FiUsers size={48} />
                                    <h3>No Submissions Yet</h3>
                                    <p>Students haven't submitted this assignment yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Note Preview Modal */}
            {previewNote && (
                <div className="modal-overlay" onClick={() => setPreviewNote(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                    <FiEye /> Preview: {previewNote.title}
                                </h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {previewNote.subject?.name} • {previewNote.type}
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setPreviewNote(null)}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                            {previewNote.file?.mimeType === 'application/pdf' || previewNote.file?.name?.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={`${backendBaseUrl}${previewNote.file.url}#toolbar=0`} 
                                    width="100%" 
                                    height="500px" 
                                    style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} 
                                    title="PDF Preview"
                                />
                            ) : previewNote.file?.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewNote.file?.name) ? (
                                <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)' }}>
                                    <img 
                                        src={`${backendBaseUrl}${previewNote.file.url}`} 
                                        alt={previewNote.title} 
                                        style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} 
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiFileText size={64} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }} />
                                    <h3>Preview Not Available</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>
                                        Preview is only supported for PDF and image files. You can download the file to view its contents.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
                            <button className="btn btn-secondary" onClick={() => setPreviewNote(null)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { handleDownload(previewNote); setPreviewNote(null); }}>
                                <FiDownload /> Download Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherNotes;
