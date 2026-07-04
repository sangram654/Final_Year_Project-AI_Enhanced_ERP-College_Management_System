import React, { useState, useEffect } from 'react';
import { 
    FiFileText, FiDownload, FiSearch, FiFile, FiEye, FiBook, FiClipboard, FiUpload, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../student/StudentPages.css';

const StudentNotes = () => {
    const { profile } = useAuth();
    const backendBaseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    
    const [activeTab, setActiveTab] = useState('notes');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [subjects, setSubjects] = useState([]);
    const [notes, setNotes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    const [previewNote, setPreviewNote] = useState(null); // For previewing notes
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null); // Local preview for submission file if image/pdf

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (profile) {
            if (activeTab === 'notes') {
                fetchNotes();
            } else {
                fetchAssignments();
            }
        }
    }, [activeTab, profile]);

    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchNotes = async () => {
        if (!profile?.department || !profile?.semester) return;
        setLoading(true);
        try {
            const res = await api.get('/notes', {
                params: {
                    department: profile.department,
                    semester: profile.semester
                }
            });
            setNotes(res.data.data || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast.error('Failed to load study materials');
        }
        setLoading(false);
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assignments/student');
            setAssignments(res.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setAssignments([]);
        }
        setLoading(false);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setSubmissionFile(selectedFile);

        if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setFilePreview(objectUrl);
        } else {
            setFilePreview(null);
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!submissionFile) return toast.error('Please select a file to submit');

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('submissionFile', submissionFile);

            await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Assignment submitted successfully!');
            closeSubmitModal();
            fetchAssignments();
        } catch (error) {
            console.error('Error submitting assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to submit assignment');
        }
        setSubmitting(false);
    };

    const closeSubmitModal = () => {
        setShowSubmitModal(false);
        setSelectedAssignment(null);
        setSubmissionFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
    };

    const handleDownloadNote = async (note) => {
        try {
            const res = await api.get(`/notes/${note._id}/download`);
            if (res.data.success) {
                window.open(`${backendBaseUrl}${res.data.data.downloadUrl}`, '_blank');
            }
        } catch (error) {
            console.error('Error downloading note:', error);
            toast.error('Download failed');
        }
    };

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              n.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = !filterSubject || n.subject?._id === filterSubject;
        return matchesSearch && matchesSubject;
    });

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              a.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = !filterSubject || a.subject?._id === filterSubject;
        return matchesSearch && matchesSubject;
    });

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const formatFileSize = (b) => {
        if (!b) return 'N/A';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    };

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

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Study Materials & Assignments</h1>
                    <p>Access notes, syllabus, and submit your assignments</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="section-card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('notes')} 
                        style={{ 
                            padding: '15px 20px', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontWeight: 500,
                            color: activeTab === 'notes' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'notes' ? '2px solid var(--primary-color)' : 'none' 
                        }}
                    >
                        <FiBook /> Study Materials ({notes.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('assignments')} 
                        style={{ 
                            padding: '15px 20px', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontWeight: 500,
                            color: activeTab === 'assignments' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary-color)' : 'none' 
                        }}
                    >
                        <FiClipboard /> Assignments ({assignments.length})
                    </button>
                </div>

                {/* Search & Filter */}
                <div style={{ padding: '15px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="form-input" 
                            style={{ paddingLeft: '40px' }} 
                            placeholder={`Search ${activeTab === 'notes' ? 'materials' : 'assignments'}...`} 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <select className="form-select" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                            <option value="">All Subjects</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes Tab Content */}
            {activeTab === 'notes' ? (
                <div className="materials-grid" style={{ display: 'grid', gap: '15px' }}>
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map(note => (
                            <div key={note._id} className="material-card" style={{ background: 'white', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '24px', color: 'var(--primary-color)' }}>
                                        {getTypeIcon(note.type)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{note.title}</h3>
                                        <p style={{ margin: '2px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{note.subject?.name}</p>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <span className="badge badge-info">{note.type}</span>
                                            <span>{formatFileSize(note.file?.size)}</span>
                                            <span>{formatDate(note.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setPreviewNote(note)}>
                                        <FiEye /> Preview
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadNote(note)}>
                                        <FiDownload /> Download
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="section-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FiFileText size={48} style={{ marginBottom: '10px' }} />
                            <h3>No Study Materials Found</h3>
                            <p>No documents have been uploaded for your semester yet.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Assignments Tab Content */
                <div className="materials-grid" style={{ display: 'grid', gap: '15px' }}>
                    {filteredAssignments.length > 0 ? (
                        filteredAssignments.map(a => {
                            const isPastDue = new Date(a.dueDate) < new Date();
                            const statusColor = a.hasSubmitted 
                                ? (a.submission?.status === 'Graded' ? 'var(--success-color)' : '#0284c7') 
                                : (isPastDue ? 'var(--error-color)' : 'var(--warning-color)');

                            return (
                                <div 
                                    key={a._id} 
                                    className="material-card" 
                                    style={{ 
                                        background: 'white', 
                                        padding: '20px', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: '10px', 
                                        borderLeft: `5px solid ${statusColor}`, 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '15px' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}>📝 {a.title}</h3>
                                            <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                {a.subject?.name} • By {a.teacher?.user ? `${a.teacher.user.firstName} ${a.teacher.user.lastName}` : 'Teacher'}
                                            </p>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: '6px' }}>
                                                <span>Due: {formatDate(a.dueDate)}</span>
                                                <span>Marks: {a.totalMarks}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {a.hasSubmitted ? (
                                                a.submission?.status === 'Graded' ? (
                                                    <span className="badge badge-success">
                                                        Graded: {a.submission.marks} / {a.totalMarks}
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-info" style={{ background: '#0284c7' }}>
                                                        Submitted
                                                    </span>
                                                )
                                            ) : (
                                                isPastDue ? (
                                                    <span className="badge badge-danger" style={{ background: 'var(--error-color)', color: 'white' }}>
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-warning">
                                                        Pending
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {a.description && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{a.description}</p>}
                                    {a.instructions && (
                                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                                            <strong>Instructions:</strong>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{a.instructions}</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                        {a.file && a.file.url ? (
                                            <a href={`${backendBaseUrl}${a.file.url}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FiDownload /> Reference File
                                            </a>
                                        ) : <div />}

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {a.hasSubmitted ? (
                                                a.submission?.file?.url && (
                                                    <a href={`${backendBaseUrl}${a.submission.file.url}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                                        <FiEye /> View My Submission
                                                    </a>
                                                )
                                            ) : (
                                                !isPastDue && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedAssignment(a); setShowSubmitModal(true); }}>
                                                        <FiUpload /> Submit Assignment
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {a.submission?.feedback && (
                                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '13px', color: 'var(--success-color)' }}>
                                            <strong>Feedback:</strong> {a.submission.feedback}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="section-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FiClipboard size={48} style={{ marginBottom: '10px' }} />
                            <h3>No Assignments Found</h3>
                            <p>No assignments have been assigned to your class.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Note Preview Modal */}
            {previewNote && (
                <div className="modal-overlay" onClick={() => setPreviewNote(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiEye /> Preview: {previewNote.title}
                                </h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {previewNote.subject?.name} • {previewNote.type}
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setPreviewNote(null)}><FiX /></button>
                        </div>
                        <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                            {previewNote.file?.mimeType === 'application/pdf' || previewNote.file?.name?.toLowerCase().endsWith('.pdf') ? (
                                <iframe 
                                    src={`${backendBaseUrl}${previewNote.file.url}#toolbar=0`} 
                                    width="100%" 
                                    height="500px" 
                                    style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                                    title="PDF Preview"
                                />
                            ) : previewNote.file?.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewNote.file?.name) ? (
                                <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px' }}>
                                    <img 
                                        src={`${backendBaseUrl}${previewNote.file.url}`} 
                                        alt={previewNote.title} 
                                        style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '4px' }} 
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiFileText size={64} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                                    <h3>Preview Not Available</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                        Preview is only supported for PDF and image files. You can download the file to view its contents.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: '15px var(--spacing-4)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setPreviewNote(null)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { handleDownloadNote(previewNote); setPreviewNote(null); }}>
                                <FiDownload /> Download Material
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Assignment Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="modal-overlay" onClick={closeSubmitModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2><FiUpload /> Submit Assignment</h2>
                            <button className="modal-close" onClick={closeSubmitModal}><FiX /></button>
                        </div>
                        <form onSubmit={handleSubmitAssignment} style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ margin: '0 0 5px' }}>{selectedAssignment.title}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    Subject: {selectedAssignment.subject?.name}
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Select File * (PDF or Image)</label>
                                <div style={{ border: '2px dashed var(--border-color)', padding: '25px', textAlign: 'center', borderRadius: '10px', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                                    <input 
                                        type="file" 
                                        id="submit-file-input" 
                                        hidden 
                                        onChange={handleFileChange} 
                                        accept=".pdf,.png,.jpg,.jpeg" 
                                    />
                                    <label htmlFor="submit-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                                        {submissionFile ? (
                                            <div style={{ color: 'var(--primary-color)' }}>
                                                <FiFileText size={40} />
                                                <p style={{ margin: '5px 0', fontWeight: 600 }}>{submissionFile.name}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatFileSize(submissionFile.size)}</p>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                <FiUpload size={40} />
                                                <p>Click to select PDF or image file</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Local Preview inside submit modal */}
                            {filePreview && (
                                <div style={{ marginTop: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>Submission Preview</strong>
                                        <span style={{ color: 'var(--error-color)', cursor: 'pointer' }} onClick={() => { URL.revokeObjectURL(filePreview); setFilePreview(null); setSubmissionFile(null); }}>Remove</span>
                                    </div>
                                    <div style={{ height: '250px' }}>
                                        {submissionFile?.type === 'application/pdf' ? (
                                            <iframe src={filePreview} width="100%" height="100%" style={{ border: 'none' }} title="Submission Local PDF Preview" />
                                        ) : (
                                            <img src={filePreview} alt="Submission Local Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeSubmitModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentNotes;