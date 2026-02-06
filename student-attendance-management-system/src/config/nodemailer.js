import nodemailer from 'nodemailer';

// Create and configure nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Email configuration error:', error.message);
        }
    } else {
        if (process.env.NODE_ENV === 'development') {
            console.log('Email server is ready to send messages');
        }
    }
});

export default transporter;
