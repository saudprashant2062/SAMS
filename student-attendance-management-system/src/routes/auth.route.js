import express from 'express';
import {
    login,
    logout,
    refreshToken,
    resetPassword,
    forgotPassword,
    resetPasswordWithToken,
    getMe,
} from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
    authLimiter,
    passwordResetLimiter,
    refreshTokenLimiter,
} from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

/* --------------------------
   AUTH ROUTES
--------------------------- */
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshTokenLimiter, refreshToken);
router.get('/me', authMiddleware, getMe);
router.patch('/reset-password', authMiddleware, resetPassword);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password-token', passwordResetLimiter, resetPasswordWithToken);

export default router;
