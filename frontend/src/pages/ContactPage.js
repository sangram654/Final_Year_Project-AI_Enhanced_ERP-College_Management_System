import React from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import './ContactPage.css';

const ContactPage = () => {
    return (
        <div className="contact-page">
            <section className="contact-hero">
                <div className="container">
                    <h1>Contact Us</h1>
                    <p>Get in touch with Samarth College</p>
                </div>
            </section>

            <section className="contact-content">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Info */}
                        <div className="contact-info">
                            <h2>Get In Touch</h2>
                            <p>
                                Have questions about admissions, courses, or anything else?
                                We're here to help!
                            </p>

                            <div className="info-cards">
                                <div className="info-card">
                                    <div className="info-icon">
                                        <FiMapPin />
                                    </div>
                                    <div className="info-content">
                                        <h3>Address</h3>
                                        <p>
                                            Samarth College of Engineering & Management<br />
                                            Belhe, Tal. Junnar<br />
                                            Dist. Pune - 410501<br />
                                            Maharashtra, India
                                        </p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <FiPhone />
                                    </div>
                                    <div className="info-content">
                                        <h3>Phone</h3>
                                        <p>+91-1234567890</p>
                                        <p>+91-0987654321</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <FiMail />
                                    </div>
                                    <div className="info-content">
                                        <h3>Email</h3>
                                        <p>info@samarthcollege.edu.in</p>
                                        <p>admissions@samarthcollege.edu.in</p>
                                    </div>
                                </div>

                                <div className="info-card">
                                    <div className="info-icon">
                                        <FiClock />
                                    </div>
                                    <div className="info-content">
                                        <h3>Office Hours</h3>
                                        <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                                        <p>Saturday: 9:00 AM - 1:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-card">
                            <h2>Send Us a Message</h2>
                            <form className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">First Name</label>
                                        <input type="text" className="form-input" placeholder="Your first name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name</label>
                                        <input type="text" className="form-input" placeholder="Your last name" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" placeholder="your@email.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <select className="form-select">
                                        <option>General Inquiry</option>
                                        <option>Admissions</option>
                                        <option>Technical Support</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea className="form-textarea" rows="5" placeholder="Your message..."></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-full">Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
