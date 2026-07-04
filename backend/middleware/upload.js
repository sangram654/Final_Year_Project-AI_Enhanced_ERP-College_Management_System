const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDir = (dir) => {
    const fullPath = path.join(__dirname, '..', 'uploads', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
};

// Storage configuration for different file types
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'general';

        if (file.fieldname === 'profileImage') {
            folder = 'profiles';
        } else if (file.fieldname === 'noteFile' || file.fieldname === 'material') {
            folder = 'notes';
        } else if (file.fieldname === 'document') {
            folder = 'documents';
        } else if (file.fieldname === 'galleryImage') {
            folder = 'gallery';
        } else if (file.fieldname === 'scholarshipDoc') {
            folder = 'scholarships';
        } else if (file.fieldname === 'assignmentFile') {
            folder = 'assignments';
        } else if (file.fieldname === 'submissionFile') {
            folder = 'submissions';
        } else if (file.fieldname === 'faceCapture') {
            folder = 'attendance';
        }

        const uploadPath = createUploadDir(folder);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

    const allAllowed = [...allowedImageTypes, ...allowedDocTypes];

    if (file.fieldname === 'profileImage' || file.fieldname === 'galleryImage') {
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
        }
    } else if (allAllowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: Images, PDF, Word, Excel, PowerPoint'), false);
    }
};

// Different upload configurations
const uploadConfig = {
    profileImage: multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }).single('profileImage'),

    galleryImage: multer({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }).single('galleryImage'),

    noteFile: multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }).single('noteFile'),

    document: multer({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }).single('document'),

    multipleDocuments: multer({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB each
    }).array('documents', 5),

    scholarshipDoc: multer({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }).array('scholarshipDoc', 10),

    assignmentFile: multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }).single('assignmentFile'),

    submissionFile: multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }).single('submissionFile'),

    faceCapture: multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }).single('faceCapture'),
};

// Middleware wrapper with error handling
const uploadMiddleware = (type) => {
    return (req, res, next) => {
        const upload = uploadConfig[type];

        if (!upload) {
            return res.status(400).json({
                success: false,
                message: 'Invalid upload type',
            });
        }

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File size too large',
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            }
            next();
        });
    };
};

module.exports = { 
    uploadMiddleware, 
    uploadConfig,
    uploadAssignment: uploadConfig.assignmentFile,
    uploadSubmission: uploadConfig.submissionFile,
};
