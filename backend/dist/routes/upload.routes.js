"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `itinerary-${uniqueSuffix}${ext}`);
    }
});
// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Max 10 files per upload
    }
});
/**
 * POST /api/upload
 * Upload a single image
 */
router.post('/', auth_middleware_1.authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = `uploads/${req.file.filename}`;
        res.json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            path: filePath
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file', message: error.message });
    }
});
/**
 * POST /api/upload/multiple
 * Upload multiple images
 */
router.post('/multiple', auth_middleware_1.authenticateToken, upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const files = req.files.map(file => ({
            filename: file.filename,
            path: `uploads/${file.filename}`
        }));
        res.json({
            message: `${files.length} file(s) uploaded successfully`,
            files
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload files', message: error.message });
    }
});
/**
 * DELETE /api/upload/:filename
 * Delete an uploaded file
 */
router.delete('/:filename', auth_middleware_1.authenticateToken, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(__dirname, '../../uploads', filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        fs_1.default.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file', message: error.message });
    }
});
exports.default = router;
