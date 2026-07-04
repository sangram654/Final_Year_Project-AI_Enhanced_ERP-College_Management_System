import React, { useState, useEffect } from 'react';
import { galleryService } from '../services/api';
import './GalleryPage.css';

const GalleryPage = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    // Helper to get the correct image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/logo2.jpg';
        // If it's a relative path from backend uploads, prepend the API base URL
        if (imageUrl.startsWith('/uploads')) {
            return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imageUrl}`;
        }
        return imageUrl;
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await galleryService.getAll();
            if (response.data.data.length > 0) {
                setImages(response.data.data);
            } else {
                // Default images
                setImages([
                    { title: 'College Main Entrance', category: 'Campus', image: { url: '/clg_maindoor.jpg' } },
                    { title: 'Computer Lab', category: 'Laboratory', image: { url: '/computer_lab.jpg' } },
                    { title: 'Computer Center', category: 'Laboratory', image: { url: '/computer_center.jpg' } },
                    { title: 'HOD Cabin', category: 'Infrastructure', image: { url: '/Hod cabin.jpg' } },
                    { title: 'Administrative Office', category: 'Infrastructure', image: { url: '/administrive office.jpg' } },
                ]);
            }
        } catch (error) {
            // Use default images
            setImages([
                { title: 'College Main Entrance', category: 'Campus', image: { url: '/clg_maindoor.jpg' } },
                { title: 'Computer Lab', category: 'Laboratory', image: { url: '/computer_lab.jpg' } },
                { title: 'Computer Center', category: 'Laboratory', image: { url: '/computer_center.jpg' } },
                { title: 'HOD Cabin', category: 'Infrastructure', image: { url: '/Hod cabin.jpg' } },
                { title: 'Administrative Office', category: 'Infrastructure', image: { url: '/administrive office.jpg' } },
            ]);
        }
        setLoading(false);
    };

    const categories = ['All', ...new Set(images.map(img => img.category))];

    const filteredImages = activeCategory === 'All'
        ? images
        : images.filter(img => img.category === activeCategory);

    return (
        <div className="gallery-page">
            <section className="gallery-hero">
                <div className="container">
                    <h1>Campus Gallery</h1>
                    <p>Explore our world-class facilities and infrastructure</p>
                </div>
            </section>

            <section className="gallery-content">
                <div className="container">
                    {/* Category Filter */}
                    <div className="gallery-filter">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Gallery Grid */}
                    {loading ? (
                        <div className="gallery-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="gallery-grid">
                            {filteredImages.map((image, index) => (
                                <div
                                    key={index}
                                    className="gallery-item"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <img src={getImageUrl(image.image?.url)} alt={image.title} />
                                    <div className="gallery-overlay">
                                        <h3>{image.title}</h3>
                                        <span className="badge">{image.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox */}
            {selectedImage && (
                <div className="lightbox" onClick={() => setSelectedImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
                        <img src={getImageUrl(selectedImage.image?.url)} alt={selectedImage.title} />
                        <div className="lightbox-info">
                            <h3>{selectedImage.title}</h3>
                            <p>{selectedImage.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryPage;
