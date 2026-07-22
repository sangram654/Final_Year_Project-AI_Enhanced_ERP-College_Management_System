import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiArrowLeft, FiSave, FiAlertTriangle, FiUsers, FiUser,
    FiCalendar, FiClock, FiFileText, FiTarget, FiPlus, FiX, FiTrash2
} from 'react-icons/fi';
import { noticeService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './CreateNotice.css';

const CreateNotice = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium',
        publishDate: '',
        expiryDate: '',
        targeting: {
            type: 'all',
            roles: [],
            departments: [],
            classes: [],
            individuals: []
        }
    });

    // State for class selection
    const [newClass, setNewClass] = useState({
        department: '',
        semester: '',
        section: ''
    });

    // Available options - MUST MATCH BACKEND SCHEMA EXACTLY
    const noticeTypes = [
        { value: 'general', label: 'General Notice' },
        { value: 'announcement', label: 'Announcement' },
        { value: 'academic', label: 'Academic Notice' },
        { value: 'administrative', label: 'Administrative Notice' },
        { value: 'event', label: 'Event Notification' },
        { value: 'exam', label: 'Exam Notice' },
        { value: 'urgent', label: 'Urgent Notice' }
    ];

    // Priority levels - MUST MATCH BACKEND SCHEMA (medium, not normal)
    const priorityLevels = [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
        { value: 'urgent', label: 'Urgent' }
    ];

    const targetingTypes = [
        { value: 'all', label: 'Everyone' },
        { value: 'roles', label: 'Specific Roles' },
        { value: 'departments', label: 'Specific Departments' },
        { value: 'classes', label: 'Specific Classes' }
    ];

    // Roles - MUST MATCH BACKEND SCHEMA
    const availableRoles = [
        { value: 'student', label: 'Students' },
        { value: 'teacher', label: 'Teachers' },
        { value: 'parent', label: 'Parents' },
        { value: 'admin', label: 'Administrators' },
        { value: 'super_admin', label: 'Super Administrators' },
        { value: 'accountant', label: 'Accountants' },
        { value: 'librarian', label: 'Librarians' },
        { value: 'receptionist', label: 'Receptionists' }
    ];

    // Departments - MUST MATCH BACKEND SCHEMA EXACTLY
    const availableDepartments = [
        'Computer Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics Engineering',
        'Information Technology',
        'Artificial Intelligence and Machine Learning'
    ];

    // Semesters for class targeting
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    // Sections for class targeting - MUST MATCH BACKEND SCHEMA
    const sections = ['A', 'B', 'C', 'D'];

    // Handle form changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle targeting type change
    const handleTargetingTypeChange = (e) => {
        const targetingType = e.target.value;
        setFormData(prev => ({
            ...prev,
            targeting: {
                type: targetingType,
                roles: [],
                departments: [],
                classes: [],
                individuals: []
            }
        }));
        // Reset new class state
        setNewClass({ department: '', semester: '', section: '' });
    };

    // Handle role selection
    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            targeting: {
                ...prev.targeting,
                roles: prev.targeting.roles.includes(role)
                    ? prev.targeting.roles.filter(r => r !== role)
                    : [...prev.targeting.roles, role]
            }
        }));
    };

    // Handle department selection
    const handleDepartmentToggle = (department) => {
        setFormData(prev => ({
            ...prev,
            targeting: {
                ...prev.targeting,
                departments: prev.targeting.departments.includes(department)
                    ? prev.targeting.departments.filter(d => d !== department)
                    : [...prev.targeting.departments, department]
            }
        }));
    };

    // Handle new class field changes
    const handleNewClassChange = (e) => {
        const { name, value } = e.target;
        setNewClass(prev => ({
            ...prev,
            [name]: name === 'semester' ? (value ? parseInt(value) : '') : value
        }));
    };

    // Add a class to the targeting
    const handleAddClass = () => {
        if (!newClass.department || !newClass.semester || !newClass.section) {
            toast.error('Please select department, semester, and section');
            return;
        }

        // Check if class already exists
        const exists = formData.targeting.classes.some(
            cls => cls.department === newClass.department &&
                   cls.semester === newClass.semester &&
                   cls.section === newClass.section
        );

        if (exists) {
            toast.warning('This class is already added');
            return;
        }

        setFormData(prev => ({
            ...prev,
            targeting: {
                ...prev.targeting,
                classes: [...prev.targeting.classes, { ...newClass }]
            }
        }));

        // Reset new class state
        setNewClass({ department: '', semester: '', section: '' });
    };

    // Remove a class from the targeting
    const handleRemoveClass = (index) => {
        setFormData(prev => ({
            ...prev,
            targeting: {
                ...prev.targeting,
                classes: prev.targeting.classes.filter((_, i) => i !== index)
            }
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!formData.content.trim()) {
            toast.error('Please enter content');
            return;
        }

        // Validate targeting based on type
        if (formData.targeting.type === 'roles' && formData.targeting.roles.length === 0) {
            toast.error('Please select at least one role');
            return;
        }
        if (formData.targeting.type === 'departments' && formData.targeting.departments.length === 0) {
            toast.error('Please select at least one department');
            return;
        }
        if (formData.targeting.type === 'classes' && formData.targeting.classes.length === 0) {
            toast.error('Please add at least one class');
            return;
        }

        setLoading(true);
        try {
            // Prepare data - only include relevant targeting fields
            const targetingData = {
                type: formData.targeting.type
            };

            // Only include the relevant targeting field based on type
            if (formData.targeting.type === 'roles') {
                targetingData.roles = formData.targeting.roles;
            } else if (formData.targeting.type === 'departments') {
                targetingData.departments = formData.targeting.departments;
            } else if (formData.targeting.type === 'classes') {
                targetingData.classes = formData.targeting.classes;
            }
            // For 'all' type, no additional fields needed

            const noticeData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type,
                priority: formData.priority,
                targeting: targetingData
            };

            // Add dates if provided
            if (formData.publishDate) {
                noticeData.publishDate = new Date(formData.publishDate).toISOString();
            }
            if (formData.expiryDate) {
                noticeData.expiryDate = new Date(formData.expiryDate).toISOString();
            }

            console.log('Submitting notice data:', noticeData);

            const response = await noticeService.create(noticeData);

            toast.success('Notice created successfully!');

            // Navigate back to notices dashboard
            navigate('../notices');
        } catch (error) {
            console.error('Error creating notice:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create notice';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(-1); // Go back to previous page
    };

    // Set default publish date to now and default expiry date to 7 days from now
    useEffect(() => {
        const now = new Date();
        const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        
        const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        const localNextWeek = new Date(nextWeek.getTime() - (nextWeek.getTimezoneOffset() * 60000));

        setFormData(prev => ({
            ...prev,
            publishDate: prev.publishDate || localNow.toISOString().slice(0, 16),
            expiryDate: prev.expiryDate || localNextWeek.toISOString().slice(0, 16)
        }));
    }, []);

    return (
        <div className="create-notice">
            <div className="create-notice-header">
                <button
                    type="button"
                    className="back-btn"
                    onClick={handleCancel}
                >
                    <FiArrowLeft />
                    Back
                </button>
                <h1>
                    <FiFileText className="header-icon" />
                    Create Notice
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="notice-form">
                {/* Basic Information */}
                <div className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label htmlFor="title">
                            Title <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Enter notice title"
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">
                            Content <span className="required">*</span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            placeholder="Enter notice content..."
                            rows="6"
                            maxLength={5000}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="type">Notice Type</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                            >
                                {noticeTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="priority">Priority Level</label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                            >
                                {priorityLevels.map(priority => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Scheduling */}
                <div className="form-section">
                    <h2>
                        <FiCalendar />
                        Scheduling
                    </h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="publishDate">
                                <FiClock />
                                Publish Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                id="publishDate"
                                name="publishDate"
                                value={formData.publishDate}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="expiryDate">
                                <FiClock />
                                Expiry Date & Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                id="expiryDate"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                min={formData.publishDate}
                            />
                        </div>
                    </div>
                </div>

                {/* Targeting */}
                <div className="form-section">
                    <h2>
                        <FiTarget />
                        Target Audience
                    </h2>

                    <div className="form-group">
                        <label htmlFor="targetingType">Who should receive this notice?</label>
                        <select
                            id="targetingType"
                            value={formData.targeting.type}
                            onChange={handleTargetingTypeChange}
                        >
                            {targetingTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Selection */}
                    {formData.targeting.type === 'roles' && (
                        <div className="form-group">
                            <label>Select Roles:</label>
                            <div className="checkbox-grid">
                                {availableRoles.map(role => (
                                    <label key={role.value} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.targeting.roles.includes(role.value)}
                                            onChange={() => handleRoleToggle(role.value)}
                                        />
                                        <span>{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Department Selection */}
                    {formData.targeting.type === 'departments' && (
                        <div className="form-group">
                            <label>Select Departments:</label>
                            <div className="checkbox-grid">
                                {availableDepartments.map(department => (
                                    <label key={department} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.targeting.departments.includes(department)}
                                            onChange={() => handleDepartmentToggle(department)}
                                        />
                                        <span>{department}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Class Selection */}
                    {formData.targeting.type === 'classes' && (
                        <div className="form-group">
                            <label>Add Classes:</label>

                            {/* Add Class Form */}
                            <div className="class-selector">
                                <select
                                    name="department"
                                    value={newClass.department}
                                    onChange={handleNewClassChange}
                                >
                                    <option value="">Select Department</option>
                                    {availableDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>

                                <select
                                    name="semester"
                                    value={newClass.semester}
                                    onChange={handleNewClassChange}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>

                                <select
                                    name="section"
                                    value={newClass.section}
                                    onChange={handleNewClassChange}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(sec => (
                                        <option key={sec} value={sec}>Section {sec}</option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    className="btn-add-class"
                                    onClick={handleAddClass}
                                >
                                    <FiPlus /> Add
                                </button>
                            </div>

                            {/* Selected Classes List */}
                            {formData.targeting.classes.length > 0 && (
                                <div className="selected-classes">
                                    <label>Selected Classes:</label>
                                    <div className="class-tags">
                                        {formData.targeting.classes.map((cls, index) => (
                                            <div key={index} className="class-tag">
                                                <span>
                                                    {cls.department} - Sem {cls.semester} - Sec {cls.section}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveClass(index)}
                                                    className="btn-remove-class"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleCancel}
                    >
                        <FiX />
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        <FiSave />
                        {loading ? 'Creating...' : 'Create Notice'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateNotice;