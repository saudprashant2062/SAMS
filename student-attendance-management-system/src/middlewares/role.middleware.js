import ApiError from '../utils/ApiError.utils.js';

const roleMiddleware = (...allowedRoles) => {
    return (req, _res, next) => {
        // 1️⃣ Auth check
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }

        // 2️⃣ Normalize roles
        const userRole = String(req.user.role).toUpperCase();
        const roles = allowedRoles.map(role => role.toUpperCase());

        // 3️⃣ Authorization check
        if (!roles.includes(userRole)) {
            return next(new ApiError(403, 'Access forbidden: insufficient permissions'));
        }

        // 4️⃣ Pass control
        next();
    };
};

export default roleMiddleware;
