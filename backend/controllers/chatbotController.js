const { asyncHandler } = require('../middleware/errorHandler');
const fetch = require('node-fetch');

// ─── Models (lazy-loaded to avoid circular deps) ────────────────────────────
const getModels = () => ({
    Student:           require('../models/Student'),
    Attendance:        require('../models/Attendance'),
    Fee:               require('../models/Fee').Fee,
    Marks:             require('../models/Marks'),
    LeaveApplication:  require('../models/LeaveApplication'),
    Notice:            require('../models/Notice'),
    Book:              require('../models/Book'),  // BookIssue is embedded in Book.js
});

// ─── Clean markdown from LLM output ─────────────────────────────────────────
function cleanMarkdown(text) {
    return text
        .replace(/\*{1,3}([^*\n]*?)\*{1,3}/g, '$1')
        .replace(/_{1,2}([^_\n]*?)_{1,2}/g, '$1')
        .replace(/`([^`\n]*?)`/g, '$1')
        .replace(/#{1,6}\s*/g, '')
        .replace(/^\s*[\*\-\+]\s+/gm, '- ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        .trim();
}

// ─── Tool Definitions for Groq Tool-Calling API ──────────────────────────────
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_my_attendance',
            description: 'Get the current logged-in student\'s attendance summary including percentage and subject-wise breakdown. Use this when user asks about their attendance, hajeri, or presence.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_my_fees',
            description: 'Get the current logged-in student\'s fee status: total fees, paid amount, pending amount, and payment history.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_my_marks',
            description: 'Get the current logged-in student\'s marks and grades for all subjects.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_leave_status',
            description: 'Get the current user\'s leave applications and their approval status.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_notice_board',
            description: 'Get the latest notices/announcements from the college notice board.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_library_status',
            description: 'Get the current user\'s issued library books and any overdue fines.',
            parameters: { type: 'object', properties: {}, required: [] }
        }
    },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────
async function executeTool(toolName, userId, role) {
    const models = getModels();

    try {
        if (toolName === 'get_my_attendance') {
            const student = await models.Student.findOne({ user: userId });
            if (!student) return { error: 'Student profile not found.' };

            const records = await models.Attendance.find({ student: student._id })
                .sort({ date: -1 })
                .limit(60)
                .lean();

            const total = records.length;
            // Status enum: 'Present', 'Absent', 'Late', 'Leave'
            const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

            return {
                overall_percentage: `${percentage}%`,
                classes_attended: present,
                total_classes: total,
                status: parseFloat(percentage) >= 75 ? 'Good - above 75% threshold' : 'Low - below 75%, attendance shortage risk',
            };
        }

        if (toolName === 'get_my_fees') {
            const student = await models.Student.findOne({ user: userId });
            if (!student) return { error: 'Student profile not found.' };

            const fees = await models.Fee.find({ student: student._id }).lean();
            const totalFees = fees.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
            const paidFees  = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
            const pending   = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

            return {
                total_fees: `₹${totalFees.toLocaleString('en-IN')}`,
                paid_amount: `₹${paidFees.toLocaleString('en-IN')}`,
                pending_amount: `₹${pending.toLocaleString('en-IN')}`,
                status: pending <= 0 ? 'All fees paid - No dues!' : `₹${pending.toLocaleString('en-IN')} still pending`,
                fee_records: fees.length,
            };
        }

        if (toolName === 'get_my_marks') {
            const student = await models.Student.findOne({ user: userId });
            if (!student) return { error: 'Student profile not found.' };

            const marksRaw = await models.Marks.find({ student: student._id })
                .populate('subject', 'name')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            if (!marksRaw.length) return { message: 'No marks records found yet.' };

            const subjects = marksRaw.map(m => ({
                subject: m.subject?.name || 'Unknown',
                marks_obtained: m.obtainedMarks || 0,
                total_marks: m.maxMarks || 100,
                percentage: m.maxMarks ? `${((m.obtainedMarks / m.maxMarks) * 100).toFixed(1)}%` : 'N/A',
                grade: m.grade || 'N/A',
                exam_type: m.examType || 'Exam',
                status: m.status || 'Pass',
            }));

            return { marks: subjects, total_subjects: subjects.length };
        }

        if (toolName === 'get_leave_status') {
            const leaves = await models.LeaveApplication.find({ applicant: userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();

            if (!leaves.length) return { message: 'No leave applications found.' };

            return {
                total_applications: leaves.length,
                applications: leaves.map(l => ({
                    from: l.fromDate ? new Date(l.fromDate).toLocaleDateString('en-IN') : 'N/A',
                    to: l.toDate ? new Date(l.toDate).toLocaleDateString('en-IN') : 'N/A',
                    reason: l.reason || 'N/A',
                    status: l.status || 'Pending',
                    type: l.leaveType || 'Leave',
                }))
            };
        }

        if (toolName === 'get_notice_board') {
            const notices = await models.Notice.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('title description createdAt')
                .lean();

            if (!notices.length) return { message: 'No active notices at the moment.' };

            return {
                notices: notices.map(n => ({
                    title: n.title,
                    summary: n.description?.substring(0, 120) + (n.description?.length > 120 ? '...' : ''),
                    date: new Date(n.createdAt).toLocaleDateString('en-IN'),
                }))
            };
        }

        if (toolName === 'get_library_status') {
            let BookIssue;
            try { BookIssue = require('../models/Book').BookIssue; } catch(e) { BookIssue = null; }

            if (!BookIssue) return { message: 'Library data unavailable.' };

            // BookIssue.student references User (not Student)
            const issued = await BookIssue.find({
                student: userId,
                returnDate: null,
                status: { $in: ['issued', 'overdue'] }
            })
            .populate('book', 'title author')
            .lean();

            if (!issued.length) return { message: 'No books currently issued to you.' };

            return {
                books_issued: issued.length,
                books: issued.map(b => ({
                    title: b.book?.title || 'Unknown',
                    author: b.book?.author || 'Unknown',
                    issue_date: b.issueDate ? new Date(b.issueDate).toLocaleDateString('en-IN') : 'N/A',
                    due_date: b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-IN') : 'N/A',
                    fine: b.fine ? `₹${b.fine}` : 'No fine',
                }))
            };
        }

        return { error: `Unknown tool: ${toolName}` };
    } catch (err) {
        console.error(`Tool ${toolName} error:`, err.message);
        return { error: `Could not retrieve data: ${err.message}` };
    }
}

// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(user) {
    const roleLabel = user?.role ? user.role.replace('_', ' ') : 'user';
    return `You are Sammy, a smart AI assistant for Samarth College of Engineering & Management ERP System.

You are speaking with ${user?.firstName || 'a user'} (${roleLabel}).

College Info: 7 departments (Computer Engineering, Mechanical, Civil, Electrical, Electronics, IT, AI & ML), 2500+ students, 15+ years of excellence, 95% placement rate, located in Belhe, Pune.

You have access to tools that let you fetch REAL live data from the ERP:
- get_my_attendance: student attendance data
- get_my_fees: student fee status
- get_my_marks: student marks
- get_leave_status: leave applications
- get_notice_board: latest notices
- get_library_status: issued books

RULES:
1. If the user asks about their data (attendance, fees, marks, leaves, library, notices), ALWAYS call the appropriate tool first to get real data.
2. Use the real data in your answer — include actual numbers, percentages, and amounts.
3. After getting tool results, give a clear, friendly, conversational response.
4. For unrelated questions (general knowledge, coding, etc.), answer normally without tools.
5. Keep answers concise and friendly. Use plain text only — no markdown, bold, asterisks.
6. Write in a natural, helpful tone. Use "you" and "your" to be personal.`;
}

// ─── Local Fallback ───────────────────────────────────────────────────────────
function getLocalFallback(msg = '') {
    const t = msg.toLowerCase();
    if (t.includes('attendance') || t.includes('hajeri'))
        return 'To check attendance: Student → Attendance page. Teachers mark it from Teacher Portal → Attendance. Ask me again when I\'m connected to get your live data!';
    if (t.includes('marks') || t.includes('result'))
        return 'Marks are in Student → Marks & Results. Teachers enter marks from Teacher → Marks Entry.';
    if (t.includes('fees') || t.includes('payment'))
        return 'For fees, open Student/Parent → Fees. You can view paid, pending, and due details there.';
    if (t.includes('leave'))
        return 'Submit leave applications from Student → Leave. Admin approves from Admin → Leave Approvals.';
    if (t.includes('library') || t.includes('book'))
        return 'Check issued books in Student → Library. The librarian manages books from the Librarian portal.';
    return 'I can help with ERP features like attendance, marks, fees, library, and general questions. What would you like to know?';
}

// ─── Main Chat Handler ────────────────────────────────────────────────────────
// @desc    Agentic chatbot — tool-calling loop with live ERP data
// @route   POST /api/chatbot/chat
// @access  Private (JWT) or Public (with limited capabilities)
const sendChatMessage = asyncHandler(async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    const user = req.user || null; // available if protect middleware ran

    if (!message || message.trim().length === 0)
        return res.status(400).json({ success: false, message: 'Message is required' });
    if (message.length > 1000)
        return res.status(400).json({ success: false, message: 'Message is too long.' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    if (!GROQ_API_KEY) {
        return res.json({
            success: true,
            data: { message: getLocalFallback(message), timestamp: new Date(), source: 'local-fallback' }
        });
    }

    try {
        // Build initial message list
        const messages = [
            { role: 'system', content: buildSystemPrompt(user) },
            // Inject up to last 6 turns of conversation history
            ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        // ── Agentic Loop (max 3 tool-call rounds) ──────────────────────────
        let finalResponse = null;
        let toolCallLog = [];
        const MAX_ROUNDS = 3;

        for (let round = 0; round < MAX_ROUNDS; round++) {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages,
                    tools: user ? TOOLS : [],   // Only expose tools if user is authenticated
                    tool_choice: user ? 'auto' : 'none',
                    temperature: 0.7,
                    max_tokens: 800,
                    stream: false
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Groq API error:', response.status, err);
                throw new Error(`Groq API status ${response.status}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];

            if (!choice) throw new Error('Empty response from Groq');

            // ── LLM chose to call tools ─────────────────────────────────────
            if (choice.finish_reason === 'tool_calls' && choice.message?.tool_calls) {
                // Add assistant message with tool_calls to history
                messages.push(choice.message);

                // Execute each tool and collect results
                for (const tc of choice.message.tool_calls) {
                    const toolName = tc.function.name;
                    toolCallLog.push(toolName);
                    console.log(`🤖 Agent calling tool: ${toolName} for user ${user?._id}`);

                    const result = await executeTool(toolName, user?._id, user?.role);

                    // Add tool result to messages
                    messages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: JSON.stringify(result)
                    });
                }
                // Continue loop — LLM will now form a final answer
                continue;
            }

            // ── LLM gave a final text response ──────────────────────────────
            if (choice.message?.content) {
                finalResponse = cleanMarkdown(choice.message.content);
                break;
            }
        }

        if (!finalResponse) {
            finalResponse = getLocalFallback(message);
        }

        return res.json({
            success: true,
            data: {
                message: finalResponse,
                timestamp: new Date(),
                source: toolCallLog.length > 0 ? 'groq-agent' : 'groq-api',
                toolsUsed: toolCallLog,
            }
        });

    } catch (error) {
        console.error('Chatbot agent error:', error.message || error);
        return res.json({
            success: true,
            data: {
                message: getLocalFallback(message),
                timestamp: new Date(),
                source: 'local-fallback'
            }
        });
    }
});

module.exports = { sendChatMessage };