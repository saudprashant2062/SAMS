import prisma from '../config/prisma.js';

/**
 * Cleanup expired refresh tokens and password reset tokens
 * This should be run periodically (e.g., via cron job)
 */
export const cleanupExpiredTokens = async () => {
    try {
        const now = new Date();

        // Delete expired refresh tokens
        const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        });

        // Delete expired password reset tokens
        const deletedPasswordResets = await prisma.passwordReset.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        });

        console.log(
            `Cleanup completed: ${deletedRefreshTokens.count} refresh tokens, ${deletedPasswordResets.count} password reset tokens deleted`,
        );

        return {
            refreshTokensDeleted: deletedRefreshTokens.count,
            passwordResetsDeleted: deletedPasswordResets.count,
        };
    } catch (error) {
        console.error('Error during token cleanup:', error);
        throw error;
    }
};

/**
 * Schedule cleanup to run every 24 hours
 */
export const scheduleTokenCleanup = () => {
    // Run immediately on startup
    cleanupExpiredTokens();

    // Run every 24 hours (86400000 ms)
    setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

    console.log('Token cleanup scheduled to run every 24 hours');
};

