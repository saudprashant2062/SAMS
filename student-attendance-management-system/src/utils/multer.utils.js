import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'photo') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed for photo'), false);
        }
    } else if (file.fieldname === 'file') {
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
    } else {
        return cb(new Error('Invalid field name'), false);
    }
    cb(null, true);
};

export const upload = multer({ storage, fileFilter });
