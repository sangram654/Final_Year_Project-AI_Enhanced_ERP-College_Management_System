import React, { useState, useEffect, useCallback } from 'react';
import { FiBook, FiAward, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { marksService } from '../../services/api';
import './StudentPages.css';

const StudentMarks = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [marks, setMarks] = useState([]);
    const [summary, setSummary] = useState({ cgpa: 0, totalCredits: 0, backlogs: 0 });

    const calculateSummary = useCallback((marksData) => {
        const totalCredits = marksData.reduce((sum, m) => sum + (m.subject?.credits || 0), 0);
        const backlogs = marksData.filter(m => m.status === 'Fail' || !(m.status === 'Pass' || m.isPassed)).length;
        const gradePoints = { O: 10, 'A+': 10, A: 9, 'B+': 8, B: 7, C: 6, D: 5, F: 0, AB: 0 };

        let weightedPoints = 0;
        let weightedCredits = 0;
        marksData.forEach((m) => {
            const credits = m.subject?.credits || 0;
            weightedPoints += (gradePoints[m.grade] || 0) * credits;
            weightedCredits += credits;
        });

        const cgpa = weightedCredits > 0 ? (weightedPoints / weightedCredits).toFixed(2) : 0;
        setSummary({ cgpa, totalCredits, backlogs });
    }, []);

    const fetchMarks = useCallback(async () => {
        try {
            const res = await marksService.getStudentMarks(profile._id);
            // Backend returns marks grouped by subject: [{ subject, marks: [...] }, ...]
            // Flatten for our display
            const groupedData = res.data.data || [];
            const flatMarks = groupedData.flatMap(group =>
                group.marks.map(mark => ({
                    ...mark,
                    subject: group.subject,
                    isPassed: mark.status === 'Pass',
                }))
            );
            setMarks(flatMarks);
            calculateSummary(flatMarks);
        } catch (error) {
            console.error('Error fetching marks:', error);
            setMarks([]);
            setSummary({ cgpa: 0, totalCredits: 0, backlogs: 0 });
        }
        setLoading(false);
    }, [profile, calculateSummary]);

    useEffect(() => {
        if (profile?._id) {
            fetchMarks();
        } else {
            setLoading(false);
        }
    }, [profile, fetchMarks]);

    const groupedBySemester = marks.reduce((acc, mark) => {
        const sem = mark.semester || 'Other';
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(mark);
        return acc;
    }, {});

    const getGradeClass = (grade) => {
        if (!grade) return 'D';
        const g = grade.toString();
        if (g.startsWith('A') || g.startsWith('O')) return 'A';
        if (g.startsWith('B')) return 'B';
        if (g.startsWith('C')) return 'C';
        return 'D';
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading marks...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Marks & Results</h1>
                    <p>View your academic performance</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon percentage">
                        <FiTrendingUp />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.cgpa}</h3>
                        <p>CGPA</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiBook />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.totalCredits}</h3>
                        <p>Total Credits</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiAward />
                    </div>
                    <div className="summary-content">
                        <h3>{marks.filter(m => m.status === 'Pass' || m.isPassed).length}</h3>
                        <p>Subjects Passed</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon absent">
                        <FiAlertTriangle />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.backlogs}</h3>
                        <p>Backlogs</p>
                    </div>
                </div>
            </div>

            {/* Marks by Semester */}
            <div className="marks-grid">
                {Object.entries(groupedBySemester)
                    .sort((a, b) => b[0] - a[0])
                    .map(([semester, semesterMarks]) => (
                        <div key={semester} className="semester-section">
                            <div className="semester-header">
                                <h3>Semester {semester}</h3>
                                <div className="sgpa-badge">
                                    SGPA: {(semesterMarks.reduce((sum, m) => {
                                        const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };
                                        return sum + (gradePoints[m.grade] || 0) * (m.subject?.credits || 0);
                                    }, 0) / semesterMarks.reduce((sum, m) => sum + (m.subject?.credits || 0), 0)).toFixed(2)}
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="table marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Credits</th>
                                            <th>Marks</th>
                                            <th>Grade</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {semesterMarks.map((mark) => (
                                            <tr key={mark._id}>
                                                <td>
                                                    <div className="subject-cell">
                                                        <span className="subject-name">{mark.subject?.name}</span>
                                                        <span className="subject-code">{mark.subject?.code}</span>
                                                    </div>
                                                </td>
                                                <td>{mark.subject?.credits}</td>
                                                <td>{mark.obtainedMarks || mark.marksObtained}/{mark.maxMarks}</td>
                                                <td>
                                                    <div className="grade-cell">
                                                        <span className={`grade-badge ${getGradeClass(mark.grade)}`}>
                                                            {mark.grade}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${(mark.status === 'Pass' || mark.isPassed) ? 'badge-success' : 'badge-error'}`}>
                                                        {(mark.status === 'Pass' || mark.isPassed) ? 'Passed' : mark.status || 'Failed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default StudentMarks;
