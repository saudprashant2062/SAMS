import asyncHandler from '../utils/asyncHandler.utils.js';
import ApiError from '../utils/ApiError.utils.js';
import ApiResponse from '../utils/ApiResponse.utils.js';
import {
    loginService,
    logoutService,
    refreshTokenService,
    resetPasswordService,
    forgotPasswordService,
    resetPasswordWithTokenService,
    getMeService,
} from '../services/auth.service.js';
import {
    AuthLoginValidator,
    resetPasswordValidator,
    forgotPasswordValidator,
    resetPasswordWithTokenValidator,
} from '../validators/auth.validator.js';

/* =====================================================
   GET CURRENT USER (ME)
===================================================== */
export const getMe = asyncHandler(async (req, res) => {
    const user = await getMeService(req.user.id);
    res.status(200).json(new ApiResponse(200, user, 'User profile fetched'));
});

/* =====================================================
   LOGIN
===================================================== */
export const login = asyncHandler(async (req, res) => {
    // Validate input
    const parsed = AuthLoginValidator.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const { email, password } = parsed.data;

    //  Call service
    const result = await loginService({ email, password });

    res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

/* =====================================================
   LOGOUT
===================================================== */
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    await logoutService(refreshToken);

    res.clearCookie('refreshToken');
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/* =====================================================
   REFRESH TOKEN
===================================================== */
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    const result = await refreshTokenService(refreshToken);
    res.status(200).json(new ApiResponse(200, result, 'Access token refreshed'));
});

/* =====================================================
   RESET PASSWORD
===================================================== */
export const resetPassword = asyncHandler(async (req, res) => {
    //  Validate input
    const parsed = resetPasswordValidator.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const { oldPassword, newPassword } = parsed.data;
    const userId = req.user.id;

    // Call service
    await resetPasswordService({ userId, oldPassword, newPassword });
    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
});

/* =====================================================
   FORGOT PASSWORD
===================================================== */
export const forgotPassword = asyncHandler(async (req, res) => {
    // Validate input
    console.log('Request Body:', req.body.email);
    const parsed = forgotPasswordValidator.safeParse(req.body.email);

    console.error('Parsed Result:', parsed);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const { email } = parsed.data;

    // Call service
    await forgotPasswordService(email);
    res.status(200).json(new ApiResponse(200, null, 'Password reset link sent to email'));
});

/* =====================================================
   RESET PASSWORD WITH TOKEN
===================================================== */
export const resetPasswordWithToken = asyncHandler(async (req, res) => {
    // Validate input
    const parsed = resetPasswordWithTokenValidator.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(422, 'Validation failed', parsed.error.format());
    }

    const { token, newPassword } = parsed.data;

    // Call service
    await resetPasswordWithTokenService({ token, newPassword });
    res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
});
