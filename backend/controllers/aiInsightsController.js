const { asyncHandler } = require('../middleware/errorHandler');
const fetch = require('node-fetch');

const Student    = require('../models/Student');
const Attendance = require('../models/Attendance');
const { Fee }    = require('../models/Fee');
const Marks      = require('../models/Marks');
const { BookIssue } = require('../models/Book');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Helper: call Groq for text generation ────────────────────────────────────
async function callGroq(systemPrompt, userPrompt) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

    const resp = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 1200,
            stream: false,
            response_format: { type: 'json_object' }
        })
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Groq API ${resp.status}: ${JSON.stringify(err)}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '{}';
}

// ─── Gather ERP data for analysis ─────────────────────────────────────────────
async function gatherInsightData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [totalStudents, totalAttendance, recentAttendance, prevAttendance, feeData, marksData, overdueBooks] = await Promise.all([
        Student.countDocuments({ isActive: true }),

        Attendance.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] } } } }
        ]),

        // Current 30 days attendance by department
        Attendance.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$department', total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] } } } }
        ]),

        // Previous 30 days attendance by department
        Attendance.aggregate([
            { $match: { date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: { _id: '$department', total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] } } } }
        ]),

        // Fee collection summary
        Fee.aggregate([
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' },
                paidAmount: { $sum: '$paidAmount' },
                dueAmount: { $sum: '$dueAmount' }
            }}
        ]),

        // Marks — grade distribution
        Marks.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Overdue books
        BookIssue.countDocuments({ status: 'overdue' })
    ]);

    // Overall attendance rate
    const attSummary = totalAttendance[0] || { total: 0, present: 0 };
    const overallRate = attSummary.total > 0
        ? ((attSummary.present / attSummary.total) * 100).toFixed(1)
        : 'N/A';

    // Department-wise attendance + change vs prev period
    const prevMap = {};
    prevAttendance.forEach(d => {
        prevMap[d._id] = d.total > 0 ? (d.present / d.total * 100) : 0;
    });

    const deptAttendance = recentAttendance.map(d => {
        const curr = d.total > 0 ? (d.present / d.total * 100) : 0;
        const prev = prevMap[d._id] || curr;
        const change = (curr - prev).toFixed(1);
        return {
            department: d._id || 'Unknown',
            attendance_rate: `${curr.toFixed(1)}%`,
            change_vs_last_month: `${change > 0 ? '+' : ''}${change}%`,
            flag: curr < 75 ? 'LOW' : (curr < 80 ? 'WATCH' : 'OK')
        };
    }).sort((a, b) => parseFloat(a.attendance_rate) - parseFloat(b.attendance_rate));

    // Fee summary
    const feeGroups = {};
    let totalFeeAmount = 0, totalPaid = 0, totalDue = 0;
    feeData.forEach(f => {
        feeGroups[f._id] = { count: f.count, total: f.totalAmount };
        totalFeeAmount += f.totalAmount || 0;
        totalPaid += f.paidAmount || 0;
        totalDue += f.dueAmount || 0;
    });
    const collectionRate = totalFeeAmount > 0
        ? ((totalPaid / totalFeeAmount) * 100).toFixed(1)
        : 'N/A';

    // Grade distribution
    const gradeBreakdown = {};
    marksData.forEach(g => { gradeBreakdown[g._id || 'Ungraded'] = g.count; });

    return {
        summary_date: new Date().toLocaleDateString('en-IN'),
        total_active_students: totalStudents,
        attendance: {
            overall_rate_last_30_days: `${overallRate}%`,
            total_records: attSummary.total,
            by_department: deptAttendance
        },
        fees: {
            collection_rate: `${collectionRate}%`,
            total_amount: `₹${totalFeeAmount.toLocaleString('en-IN')}`,
            paid_amount: `₹${totalPaid.toLocaleString('en-IN')}`,
            due_amount: `₹${totalDue.toLocaleString('en-IN')}`,
            by_status: feeGroups
        },
        marks: {
            grade_distribution: gradeBreakdown
        },
        library: {
            overdue_books: overdueBooks
        }
    };
}

// ─── @desc  Run AI-powered ERP analytics ──────────────────────────────────────
// @route GET /api/ai/insights
// @access Private — admin, super_admin
const getInsights = asyncHandler(async (req, res) => {
    // 1. Gather live ERP data
    let erpData;
    try {
        erpData = await gatherInsightData();
    } catch (dbErr) {
        console.error('AI Insights DB error:', dbErr.message);
        return res.status(500).json({ success: false, message: 'Failed to gather ERP data for analysis.' });
    }

    // 2. Build LLM prompt
    const systemPrompt = `You are an expert educational analytics AI for Samarth College of Engineering & Management.
Analyze the provided ERP data and return a JSON response with EXACTLY these keys:
{
  "summary": "2-3 sentence overall academic health summary",
  "anomalies": ["array of strings, each is a specific concern or anomaly detected from the data"],
  "recommendations": ["array of strings, each is a concrete actionable recommendation for the admin"],
  "health_score": <integer 0-100 representing overall institutional health>,
  "health_label": "Excellent|Good|Fair|Needs Attention|Critical"
}
Be specific with numbers and department names. Keep tone professional but accessible. Max 5 anomalies, max 5 recommendations.`;

    const userPrompt = `Here is the current ERP data snapshot for Samarth College:\n${JSON.stringify(erpData, null, 2)}\n\nPlease analyze this data and provide insights.`;

    // 3. Call Groq
    let insights;
    try {
        const rawJson = await callGroq(systemPrompt, userPrompt);
        insights = JSON.parse(rawJson);
    } catch (aiErr) {
        console.error('AI Insights LLM error:', aiErr.message);
        // Return data-only response if LLM fails
        return res.json({
            success: true,
            data: {
                erpData,
                insights: {
                    summary: 'AI analysis is currently unavailable. Review the ERP data below directly.',
                    anomalies: [],
                    recommendations: [],
                    health_score: null,
                    health_label: 'N/A'
                },
                generated_at: new Date(),
                source: 'data-only-fallback'
            }
        });
    }

    // 4. Return combined response
    return res.json({
        success: true,
        data: {
            erpData,
            insights,
            generated_at: new Date(),
            source: 'groq-agent'
        }
    });
});

module.exports = { getInsights };
