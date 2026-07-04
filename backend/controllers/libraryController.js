const { Book, BookIssue } = require('../models/Book');
const Student = require('../models/Student');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get users eligible to borrow books
// @route   GET /api/library/eligible-users
// @access  Private (Librarian, Super Admin, Admin)
const getEligibleUsers = asyncHandler(async (req, res) => {
    const { search, limit = 200 } = req.query;

    const query = {
        isActive: true,
        role: { $in: ['student', 'teacher'] },
    };

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const users = await User.find(query)
        .select('firstName lastName email role')
        .sort({ firstName: 1, lastName: 1 })
        .limit(parseInt(limit, 10));

    res.json({
        success: true,
        data: users,
    });
});

// @desc    Get all books
// @route   GET /api/library/books
// @access  Private (Librarian, Super Admin, Admin)
const getBooks = asyncHandler(async (req, res) => {
    const { search, category, department, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
        query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (department) query.department = department;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
        .populate('addedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: books,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Add a new book
// @route   POST /api/library/books
// @access  Private (Librarian, Super Admin, Admin)
const addBook = asyncHandler(async (req, res) => {
    const { title, author, isbn, publisher, category, department, totalCopies, shelfLocation } = req.body;

    // Check if ISBN already exists
    if (isbn) {
        const existing = await Book.findOne({ isbn });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A book with this ISBN already exists',
            });
        }
    }

    const book = await Book.create({
        title,
        author,
        isbn,
        publisher,
        category,
        department,
        totalCopies,
        availableCopies: totalCopies,
        shelfLocation,
        addedBy: req.user.id,
    });

    res.status(201).json({
        success: true,
        message: 'Book added successfully',
        data: book,
    });
});

// @desc    Update a book
// @route   PUT /api/library/books/:id
// @access  Private (Librarian, Super Admin, Admin)
const updateBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const { title, author, isbn, publisher, category, department, totalCopies, shelfLocation, isActive } = req.body;

    // Adjust available copies if total copies changed
    if (totalCopies !== undefined) {
        const issuedCopies = book.totalCopies - book.availableCopies;
        if (totalCopies < issuedCopies) {
            return res.status(400).json({
                success: false,
                message: `Cannot reduce total copies below ${issuedCopies} (currently issued)`,
            });
        }
        book.availableCopies = totalCopies - issuedCopies;
        book.totalCopies = totalCopies;
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (isbn !== undefined) book.isbn = isbn;
    if (publisher) book.publisher = publisher;
    if (category) book.category = category;
    if (department) book.department = department;
    if (shelfLocation) book.shelfLocation = shelfLocation;
    if (isActive !== undefined) book.isActive = isActive;

    await book.save();

    res.json({
        success: true,
        message: 'Book updated successfully',
        data: book,
    });
});

// @desc    Delete a book
// @route   DELETE /api/library/books/:id
// @access  Private (Librarian, Super Admin, Admin)
const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if any copies are issued
    const issuedCount = await BookIssue.countDocuments({ book: req.params.id, status: 'issued' });
    if (issuedCount > 0) {
        return res.status(400).json({
            success: false,
            message: `Cannot delete book. ${issuedCount} copies are currently issued.`,
        });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Book deleted successfully' });
});

// @desc    Issue a book to student
// @route   POST /api/library/issue
// @access  Private (Librarian, Super Admin, Admin)
const issueBook = asyncHandler(async (req, res) => {
    const { bookId, studentId, issueDate, dueDate } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
        return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
        return res.status(400).json({ success: false, message: 'No copies available for issue' });
    }

    let resolvedStudentId = studentId;
    let student = await User.findById(resolvedStudentId);

    // Accept Student profile ID as well, then resolve to linked User ID.
    if (!student) {
        const studentProfile = await Student.findById(studentId).select('user');
        if (studentProfile?.user) {
            resolvedStudentId = studentProfile.user;
            student = await User.findById(resolvedStudentId);
        }
    }

    const normalizedRole = (student?.role || '').toLowerCase();
    if (!student || (normalizedRole !== 'student' && normalizedRole !== 'teacher')) {
        return res.status(400).json({ success: false, message: 'Invalid student/teacher ID' });
    }

    // Check if student already has this book
    const existingIssue = await BookIssue.findOne({ book: bookId, student: resolvedStudentId, status: 'issued' });
    if (existingIssue) {
        return res.status(400).json({ success: false, message: 'This book is already issued to this user' });
    }

    const issue = await BookIssue.create({
        book: bookId,
        student: resolvedStudentId,
        issuedBy: req.user.id,
        issueDate: issueDate || new Date(),
        dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
    });

    // Decrease available copies
    book.availableCopies -= 1;
    await book.save();

    const populatedIssue = await BookIssue.findById(issue._id)
        .populate('book', 'title author isbn')
        .populate('student', 'firstName lastName email')
        .populate('issuedBy', 'firstName lastName');

    res.status(201).json({
        success: true,
        message: 'Book issued successfully',
        data: populatedIssue,
    });
});

// @desc    Return a book
// @route   PUT /api/library/return/:issueId
// @access  Private (Librarian, Super Admin, Admin)
const returnBook = asyncHandler(async (req, res) => {
    const issue = await BookIssue.findById(req.params.issueId).populate('book');
    if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    if (issue.status === 'returned') {
        return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    // Calculate fine (Flat ₹100 for overdue + ₹50 for every month of delay)
    const today = new Date();
    let fine = 0;
    if (today > issue.dueDate) {
        const daysLate = Math.ceil((today - issue.dueDate) / (1000 * 60 * 60 * 24));
        fine = 100;
        const monthsLate = Math.floor((daysLate - 1) / 30);
        if (monthsLate > 0) {
            fine += monthsLate * 50;
        }
    }

    issue.status = 'returned';
    issue.returnDate = today;
    issue.fine = fine;
    await issue.save();

    // Increase available copies
    const book = await Book.findById(issue.book._id);
    book.availableCopies += 1;
    await book.save();

    res.json({
        success: true,
        message: fine > 0 ? `Book returned. Fine: ₹${fine}` : 'Book returned successfully',
        data: issue,
    });
});

// @desc    Get all issued books
// @route   GET /api/library/issues
// @access  Private (Librarian, Super Admin, Admin)
const getIssuedBooks = asyncHandler(async (req, res) => {
    const { status, studentId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
        if (status === 'overdue') {
            query.status = { $in: ['issued', 'overdue'] };
            query.dueDate = { $lt: new Date() };
        } else {
            query.status = status;
        }
    }
    if (studentId) query.student = studentId;

    const total = await BookIssue.countDocuments(query);
    const issues = await BookIssue.find(query)
        .populate('book', 'title author isbn')
        .populate('student', 'firstName lastName email')
        .populate('issuedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    // Calculate active fine dynamically for non-returned overdue books
    const today = new Date();
    const updatedIssues = issues.map(issue => {
        const issueObj = issue.toObject();
        if (issueObj.status === 'issued' && today > issueObj.dueDate) {
            const daysLate = Math.ceil((today - issueObj.dueDate) / (1000 * 60 * 60 * 24));
            let calculatedFine = 100;
            const monthsLate = Math.floor((daysLate - 1) / 30);
            if (monthsLate > 0) {
                calculatedFine += monthsLate * 50;
            }
            issueObj.fine = calculatedFine;
        }
        return issueObj;
    });

    res.json({
        success: true,
        data: updatedIssues,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get library dashboard stats
// @route   GET /api/library/dashboard
// @access  Private (Librarian, Super Admin, Admin)
const getLibraryDashboard = asyncHandler(async (req, res) => {
    const totalBooks = await Book.countDocuments();
    const totalIssued = await BookIssue.countDocuments({ status: 'issued' });
    const overdueBooks = await BookIssue.countDocuments({
        status: 'issued',
        dueDate: { $lt: new Date() },
    });
    const totalFineCollected = await BookIssue.aggregate([
        { $match: { fine: { $gt: 0 }, finePaid: true } },
        { $group: { _id: null, total: { $sum: '$fine' } } },
    ]);

    const recentIssues = await BookIssue.find()
        .populate('book', 'title author')
        .populate('student', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

    res.json({
        success: true,
        data: {
            stats: {
                totalBooks,
                totalIssued,
                overdueBooks,
                totalFineCollected: totalFineCollected[0]?.total || 0,
            },
            recentIssues,
        },
    });
});

// @desc    Get my borrowed books (for student/teacher)
// @route   GET /api/library/my-books
// @access  Private (Student, Teacher)
const getMyBooks = asyncHandler(async (req, res) => {
    const { status } = req.query;
    
    const query = { student: req.user.id };
    if (status) {
        if (status === 'overdue') {
            query.status = { $in: ['issued', 'overdue'] };
            query.dueDate = { $lt: new Date() };
        } else {
            query.status = status;
        }
    }

    const issues = await BookIssue.find(query)
        .populate('book', 'title author isbn publisher category shelfLocation')
        .populate('issuedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

    // Calculate active fine dynamically for non-returned overdue books
    const today = new Date();
    const updatedIssues = issues.map(issue => {
        const issueObj = issue.toObject();
        if (issueObj.status === 'issued' && today > issueObj.dueDate) {
            const daysLate = Math.ceil((today - issueObj.dueDate) / (1000 * 60 * 60 * 24));
            let calculatedFine = 100;
            const monthsLate = Math.floor((daysLate - 1) / 30);
            if (monthsLate > 0) {
                calculatedFine += monthsLate * 50;
            }
            issueObj.fine = calculatedFine;
        }
        return issueObj;
    });

    // Calculate summary
    const currentlyBorrowed = updatedIssues.filter(i => i.status === 'issued').length;
    const totalBorrowed = updatedIssues.length;
    const overdue = updatedIssues.filter(i => i.status === 'issued' && new Date(i.dueDate) < new Date()).length;
    const totalFines = updatedIssues.reduce((sum, i) => sum + (i.fine || 0), 0);
    const unpaidFines = updatedIssues.filter(i => i.fine > 0 && !i.finePaid).reduce((sum, i) => sum + i.fine, 0);

    res.json({
        success: true,
        data: updatedIssues,
        summary: {
            currentlyBorrowed,
            totalBorrowed,
            overdue,
            totalFines,
            unpaidFines,
        },
    });
});

// @desc    Browse available books (for student/teacher)
// @route   GET /api/library/browse
// @access  Private (Student, Teacher)
const browseBooks = asyncHandler(async (req, res) => {
    const { search, category, department, page = 1, limit = 20 } = req.query;
    const query = { isActive: true, availableCopies: { $gt: 0 } };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { isbn: { $regex: search, $options: 'i' } },
        ];
    }
    if (category) query.category = category;
    if (department) query.department = department;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
        .select('title author isbn publisher category department totalCopies availableCopies shelfLocation')
        .sort({ title: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    res.json({
        success: true,
        data: books,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
        },
    });
});

// @desc    Get book details (for student/teacher)
// @route   GET /api/library/book/:id
// @access  Private (Student, Teacher)
const getBookDetails = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id)
        .select('title author isbn publisher category department totalCopies availableCopies shelfLocation description');

    if (!book) {
        return res.status(404).json({
            success: false,
            message: 'Book not found',
        });
    }

    // Check if user has already borrowed this book
    const existingIssue = await BookIssue.findOne({
        book: req.params.id,
        student: req.user.id,
        status: 'issued',
    });

        res.json({
        success: true,
        data: {
            ...book.toObject(),
            alreadyBorrowed: !!existingIssue,
        },
    });
});

// @desc    Delete an issue record
// @route   DELETE /api/library/issue/:id
// @access  Private (Librarian, Super Admin, Admin)
const deleteIssue = asyncHandler(async (req, res) => {
    const issue = await BookIssue.findById(req.params.id);
    if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    // If not returned yet, increment available copies
    if (issue.status !== 'returned') {
        const book = await Book.findById(issue.book);
        if (book) {
            book.availableCopies += 1;
            await book.save();
        }
    }

    await BookIssue.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: 'Issue record deleted successfully',
    });
});

module.exports = {
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    getEligibleUsers,
    issueBook,
    returnBook,
    getIssuedBooks,
    getLibraryDashboard,
    getMyBooks,
    browseBooks,
    getBookDetails,
    deleteIssue,
};
