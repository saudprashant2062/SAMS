import jwt from 'jsonwebtoken';

const generateRefreshToken = userId => {
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    });

    return refreshToken;
};

const generateAccessToken = userId => {
    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h',
    });

    return accessToken;
};

export { generateRefreshToken, generateAccessToken };
