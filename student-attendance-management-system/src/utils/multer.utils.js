import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        // Sanitize filename and add random suffix to prevent collisions
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const randomSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(sanitizedName);
        const nameWithoutExt = path.basename(sanitizedName, ext);
        cb(null, `${Date.now()}-${randomSuffix}-${nameWithoutExt}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        // Only allow image files
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPEG, PNG, and WebP image files are allowed for photo'), false);
        }
    } else if (file.fieldname === 'file') {
        // Only allow CSV files
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
    } else {
        return cb(new Error('Invalid field name'), false);
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1, // Only one file per request
    },
});
