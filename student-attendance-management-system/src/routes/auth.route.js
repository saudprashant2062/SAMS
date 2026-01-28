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

const router = express.Router();

/* --------------------------
   AUTH ROUTES
--------------------------- */
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getMe);
router.patch('/reset-password', authMiddleware, resetPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-token', resetPasswordWithToken);

export default router;
