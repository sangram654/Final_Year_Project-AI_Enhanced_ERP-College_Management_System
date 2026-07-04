const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true,
    },
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true,
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    publisher: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        enum: ['Textbook', 'Reference', 'Journal', 'Magazine', 'Novel', 'Biography', 'Other'],
        default: 'Textbook',
    },
    department: {
        type: String,
        enum: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning', 'General'],
        default: 'General',
    },
    totalCopies: {
        type: Number,
        required: true,
        min: 1,
    },
    availableCopies: {
        type: Number,
        required: true,
        min: 0,
    },
    shelfLocation: {
        type: String,
        trim: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

const bookIssueSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    returnDate: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['issued', 'returned', 'overdue', 'lost'],
        default: 'issued',
    },
    fine: {
        type: Number,
        default: 0,
    },
    finePaid: {
        type: Boolean,
        default: false,
    },
    remarks: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

bookIssueSchema.index({ student: 1, status: 1 });
bookIssueSchema.index({ book: 1, status: 1 });

const Book = mongoose.model('Book', bookSchema);
const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = { Book, BookIssue };
