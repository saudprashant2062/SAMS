import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.utils.js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email.utils.js';

/* =====================================================
   GET CURRENT USER (ME)
===================================================== */
export const getMeService = async userId => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullname: true,
            email: true,
            role: true,
            phone_number: true,
            photo_url: true,
            is_active: true,
            created_at: true,
            student: {
                select: {
                    id: true,
                    stdId: true,
                    roll_no: true,
                    registration_no: true,
                    batch: {
                        select: {
                            id: true,
                            year: true,
                            name: true,
                        },
                    },
                    section: {
                        include: {
                            department: true,
                            semester: true,
                        },
                    },
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

    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

/* =====================================================
   LOGIN
===================================================== */
export const loginService = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            student: {
                select: {
                    id: true,
                    stdId: true,
                    roll_no: true,
                    registration_no: true,
                    batch: {
                        select: {
                            id: true,
                            year: true,
                            name: true,
                        },
                    },
                    section: {
                        include: {
                            department: true,
                            semester: true,
                        },
                    },
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
    if (!user) throw new ApiError(401, 'No account found with this email address');
    if (!user.is_active)
        throw new ApiError(403, 'Your account has been deactivated. Please contact admin.');

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new ApiError(401, 'Incorrect password. Please try again.');

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    // Return complete user data (excluding password)
    const { password: _, ...userData } = user;

    return {
        user: userData,
        tokens: { accessToken, refreshToken },
    };
};

/* =====================================================
   LOGOUT
===================================================== */
export const logoutService = async refreshToken => {
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    return { message: 'Logged out successfully' };
};

/* =====================================================
   REFRESH TOKEN
===================================================== */
export const refreshTokenService = async refreshToken => {
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken) throw new ApiError(401, 'Invalid refresh token');

    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, 'Refresh token expired or invalid');
    }

    const accessToken = generateAccessToken(payload.id);
    return { accessToken };
};

/* =====================================================
   RESET PASSWORD
===================================================== */
export const resetPasswordService = async ({ userId, oldPassword, newPassword }) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const match = await comparePassword(oldPassword, user.password);
    if (!match) throw new ApiError(401, 'Old password is incorrect');

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    return { message: 'Password updated successfully' };
};

/* =====================================================
   FORGOT PASSWORD
===================================================== */
export const forgotPasswordService = async email => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(404, 'User with this email does not exist');

    if (!user.is_active) throw new ApiError(403, 'Account is deactivated');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    // Create new reset token
    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
    });

    // Send email with reset link
    await sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Password reset link has been sent to your email' };
};

/* =====================================================
   RESET PASSWORD WITH TOKEN
===================================================== */
export const resetPasswordWithTokenService = async ({ token, newPassword }) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const passwordReset = await prisma.passwordReset.findUnique({
        where: { token: hashedToken },
        include: { user: true },
    });

    if (!passwordReset) throw new ApiError(400, 'Invalid or expired reset token');

    if (passwordReset.expiresAt < new Date()) {
        await prisma.passwordReset.delete({ where: { id: passwordReset.id } });
        throw new ApiError(400, 'Reset token has expired');
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword },
    });

    // Delete reset token
    await prisma.passwordReset.delete({ where: { id: passwordReset.id } });

    return { message: 'Password has been reset successfully' };
};
