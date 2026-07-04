import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            <section className="about-hero">
                <div className="container">
                    <h1>About Samarth College</h1>
                    <p>Excellence in Engineering Education Since 2010</p>
                </div>
            </section>

            <section className="about-content">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-text">
                            <h2>Our Vision</h2>
                            <p>
                                To be a premier institution recognized globally for excellence in engineering
                                education, research, and innovation, producing graduates who are leaders in
                                their respective fields and contribute positively to society.
                            </p>

                            <h2>Our Mission</h2>
                            <p>
                                To provide quality education that combines theoretical knowledge with practical
                                skills, foster critical thinking and innovation, and prepare students to meet
                                the challenges of the rapidly evolving technological landscape.
                            </p>

                            <h2>Our History</h2>
                            <p>
                                Established in 2010 under the aegis of Samarth Rural Educational Institute,
                                the college has grown to become one of the leading engineering institutions
                                in the region. Located in Belhe, Pune, we are affiliated to Savitribai Phule
                                Pune University and approved by AICTE.
                            </p>
                        </div>

                        <div className="about-stats">
                            <div className="stat-box">
                                <h3>15+</h3>
                                <p>Years of Excellence</p>
                            </div>
                            <div className="stat-box">
                                <h3>2500+</h3>
                                <p>Students Enrolled</p>
                            </div>
                            <div className="stat-box">
                                <h3>100+</h3>
                                <p>Faculty Members</p>
                            </div>
                            <div className="stat-box">
                                <h3>95%</h3>
                                <p>Placement Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-facilities">
                <div className="container">
                    <h2>Our Facilities</h2>
                    <div className="facilities-grid">
                        <div className="facility-card">
                            <img src="/computer_lab.jpg" alt="Computer Lab" />
                            <h3>Computer Labs</h3>
                            <p>State-of-the-art computer labs with latest hardware and software</p>
                        </div>
                        <div className="facility-card">
                            <img src="/computer_center.jpg" alt="Computer Center" />
                            <h3>Computer Center</h3>
                            <p>Central computing facility with high-speed internet</p>
                        </div>
                        <div className="facility-card">
                            <img src="/administrive office.jpg" alt="Administrative Office" />
                            <h3>Administration</h3>
                            <p>Well-organized administrative block for student services</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
