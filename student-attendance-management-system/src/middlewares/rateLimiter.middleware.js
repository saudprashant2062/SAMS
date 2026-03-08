// Rate limiting middleware using express-rate-limit
// Install with: npm install express-rate-limit

let rateLimit;
try {
    const rateLimitModule = await import('express-rate-limit');
    rateLimit = rateLimitModule.default;
} catch (error) {
    console.warn('express-rate-limit not installed. Rate limiting disabled.');
    console.warn('Install with: npm install express-rate-limit');
    // Fallback: pass-through middleware
    rateLimit = () => (req, res, next) => next();
}

/**
 * Rate limiter for authentication endpoints (login)
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
        errors: null,
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
});

/**
 * Rate limiter for forgot-password endpoint (sends emails)
 * More restrictive to prevent email spam
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again after 1 hour.',
        errors: null,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for reset-password-token endpoint
 * More generous since it doesn't send emails
 */
export const resetTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again later.',
        errors: null,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for token refresh endpoint
 * Prevents token enumeration attacks
 */
export const refreshTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many token refresh attempts. Please try again later.',
        errors: null,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
