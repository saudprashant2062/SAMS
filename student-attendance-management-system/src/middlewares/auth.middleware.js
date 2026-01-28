import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import ApiError from '../utils/ApiError.utils.js';

const authMiddleware = async (req, _res, next) => {
    try {
        /* ===============================
           1️⃣ Extract token
        ================================ */
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError(401, 'Authorization token missing'));
        }

        const token = authHeader.split(' ')[1];

        /* ===============================
           2️⃣ Verify token
        ================================ */
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch {
            return next(new ApiError(401, 'Invalid or expired token'));
        }

        /* ===============================
           3️⃣ Fetch user
        ================================ */
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                is_active: true,
                student: {
                    select: {
                        id: true,
                        stdId: true,
                        roll_no: true,
                        section_id: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        teacherId: true,
                        designation: true,
                    },
                },
            },
        });

        if (!user) {
            return next(new ApiError(401, 'User not found'));
        }

        /* ===============================
           4️⃣ Check active status
        ================================ */
        if (!user.is_active) {
            return next(new ApiError(403, 'Account is deactivated'));
        }

        /* ===============================
           5️⃣ Attach user
        ================================ */
        req.user = user;

        next();
    } catch (error) {
        next(new ApiError(500, 'Authentication failed', error.message));
    }
};

export default authMiddleware;
