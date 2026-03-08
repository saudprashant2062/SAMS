import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const dirs = ['uploads', 'uploads/profile-pictures', 'uploads/imports'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ---------- Profile Picture Storage ---------- */
const profilePictureStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/profile-pictures'),
    filename: (_req, file, cb) => {
        const randomSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${randomSuffix}${ext}`);
    },
});

/* ---------- Import File Storage ---------- */
const importFileStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/imports'),
    filename: (_req, file, cb) => {
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const randomSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(sanitizedName);
        const nameWithoutExt = path.basename(sanitizedName, ext);
        cb(null, `${Date.now()}-${randomSuffix}-${nameWithoutExt}${ext}`);
    },
});

/* ---------- File Filters ---------- */
const imageFilter = (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, and WebP image files are allowed'), false);
    }
    cb(null, true);
};

const csvExcelFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];
    const allowedExts = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.includes(file.mimetype) && !allowedExts.includes(ext)) {
        return cb(new Error('Only CSV and Excel (.xlsx, .xls) files are allowed'), false);
    }
    cb(null, true);
};

/* ---------- Multer Instances ---------- */

// For profile picture uploads (photo field)
export const uploadPhoto = multer({
    storage: profilePictureStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB
});

// For CSV/Excel file uploads (file field)
export const uploadFile = multer({
    storage: importFileStorage,
    fileFilter: csvExcelFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB
});

// Combined: photo + file in one request (for forms that have both)
const combinedStorage = multer.diskStorage({
    destination: (_req, file, cb) => {
        if (file.fieldname === 'photo') {
            cb(null, 'uploads/profile-pictures');
        } else {
            cb(null, 'uploads/imports');
        }
    },
    filename: (_req, file, cb) => {
        const randomSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${randomSuffix}${ext}`);
    },
});

export const upload = multer({
    storage: combinedStorage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'photo') {
            imageFilter(req, file, cb);
        } else if (file.fieldname === 'file') {
            csvExcelFilter(req, file, cb);
        } else {
            cb(new Error('Invalid field name'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
