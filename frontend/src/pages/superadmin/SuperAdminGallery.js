import React, { useState, useEffect } from 'react';
import { FiImage, FiUpload, FiTrash2, FiPlus, FiGrid, FiList, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const SuperAdminGallery = () => {
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [uploadForm, setUploadForm] = useState({
        title: '', category: '', description: '', file: null
    });

    const categories = ['Campus', 'Events', 'Sports', 'Cultural', 'Laboratory', 'Library', 'Hostel'];

    // Helper to get the correct image URL from the database record
    const getImageUrl = (image) => {
        if (image.image?.url) {
            // If it's a relative path from backend, prepend the API base URL
            if (image.image.url.startsWith('/uploads')) {
                return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${image.image.url}`;
            }
            return image.image.url;
        }
        // Keep a safe image fallback if a record has no valid image URL.
        return image.imageUrl || '/logo2.jpg';
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const res = await api.get('/gallery');
            setImages(res.data.data || []);
        } catch (error) {
            console.error('Error fetching gallery images:', error);
            setImages([]);
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.title || !uploadForm.category) {
            toast.error('Please fill required fields');
            return;
        }
        if (!uploadForm.file) {
            toast.error('Please select an image file');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title);
            formData.append('category', uploadForm.category);
            formData.append('description', uploadForm.description || '');
            formData.append('galleryImage', uploadForm.file);

            const res = await api.post('/gallery', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success('Image uploaded successfully!');
                fetchImages(); // Refresh gallery
                setShowUploadModal(false);
                setUploadForm({ title: '', category: '', description: '', file: null });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload image');
        }
    };

    const handleDelete = async (imageId) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            try {
                const res = await api.delete(`/gallery/${imageId}`);
                if (res.data.success) {
                    toast.success('Image deleted successfully');
                    fetchImages(); // Refresh gallery
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete image');
            }
        }
    };

    const filteredImages = selectedCategory
        ? images.filter(img => img.category === selectedCategory)
        : images;

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading gallery...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Gallery Management</h1>
                    <p>Manage college photo gallery</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                    <FiPlus /> Upload Image
                </button>
            </div>

            {/* Filters & View Toggle */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                        <button
                            className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedCategory('')}
                        >
                            All ({images.length})
                        </button>
                        {categories.map((cat) => {
                            const count = images.filter(img => img.category === cat).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={cat}
                                    className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button
                            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <FiGrid />
                        </button>
                        <button
                            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <FiList />
                        </button>
                    </div>
                </div>
            </div>

            {/* Gallery */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
                    {filteredImages.map((image) => (
                        <div key={image._id} className="section-card" style={{ overflow: 'hidden' }}>
                            <div style={{ height: 180, background: 'var(--bg-secondary)', position: 'relative' }}>
                                <img
                                    src={getImageUrl(image)}
                                    alt={image.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.src = '/logo2.jpg'; }}
                                />
                                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                                    <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.9)', padding: 8 }}>
                                        <FiEye />
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: 'rgba(255,255,255,0.9)', padding: 8, color: 'var(--error-color)' }}
                                        onClick={() => handleDelete(image._id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: 'var(--spacing-4)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{image.title}</h4>
                                <span className="badge badge-info">{image.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="section-card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Preview</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredImages.map((image) => (
                                    <tr key={image._id}>
                                        <td>
                                            <img
                                                src={getImageUrl(image)}
                                                alt={image.title}
                                                style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                                onError={(e) => { e.target.src = '/logo2.jpg'; }}
                                            />
                                        </td>
                                        <td><strong>{image.title}</strong></td>
                                        <td><span className="badge badge-info">{image.category}</span></td>
                                        <td>{new Date(image.createdAt || image.uploadedAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(image._id)} style={{ color: 'var(--error-color)' }}>
                                                <FiTrash2 /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredImages.length === 0 && (
                <div className="empty-state">
                    <FiImage size={48} />
                    <h3>No images found</h3>
                    <p>Upload images to the gallery</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><FiUpload /> Upload Image</h2>
                            <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input type="text" className="form-input" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select className="form-select" value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })} required>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={3} value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image File *</label>
                                <input type="file" className="form-input" accept="image/*" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><FiUpload /> Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminGallery;
