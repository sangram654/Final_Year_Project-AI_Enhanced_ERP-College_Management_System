const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/libraryController');

// All routes require authentication
router.use(protect);

// Student/Teacher routes (must be before admin routes to avoid conflicts)
router.get('/my-books', authorize('student', 'teacher'), getMyBooks);
router.get('/browse', authorize('student', 'teacher'), browseBooks);
router.get('/book/:id', authorize('student', 'teacher'), getBookDetails);

// Librarian/Admin routes
router.get('/dashboard', authorize('librarian', 'super_admin', 'admin'), getLibraryDashboard);

// Books CRUD
router.get('/books', authorize('librarian', 'super_admin', 'admin'), getBooks);
router.post('/books', authorize('librarian', 'super_admin', 'admin'), addBook);
router.put('/books/:id', authorize('librarian', 'super_admin', 'admin'), updateBook);
router.delete('/books/:id', authorize('librarian', 'super_admin', 'admin'), deleteBook);

// Eligible borrowers
router.get('/eligible-users', authorize('librarian', 'super_admin', 'admin'), getEligibleUsers);

// Issue / Return
router.get('/issues', authorize('librarian', 'super_admin', 'admin'), getIssuedBooks);
router.post('/issue', authorize('librarian', 'super_admin', 'admin'), issueBook);
router.put('/return/:issueId', authorize('librarian', 'super_admin', 'admin'), returnBook);
router.delete('/issue/:id', authorize('librarian', 'super_admin', 'admin'), deleteIssue);

module.exports = router;
