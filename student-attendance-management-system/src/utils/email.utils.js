import transporter from '../config/nodemailer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, '../../../SAMS_FRONTEND/public/Academia.png');

/* =====================================================
   SEND PASSWORD RESET EMAIL
 ===================================================== */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Student Attendance System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        attachments: [
            {
                filename: 'Academia.png',
                path: LOGO_PATH,
                cid: 'academiaLogo',
            },
        ],
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

            <!-- Header -->
            <div style="background-color: #003366; padding: 20px; text-align: center;">
                <img 
                    src="cid:academiaLogo" 
                    alt="Academia Logo" 
                    style="max-height: 60px; margin-bottom: 10px;"
                />
                <h1 style="color: #ffffff; font-size: 22px; margin: 0;">
                    Student Attendance System
                </h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px; color: #333;">
                <h2 style="font-size: 20px; margin-bottom: 15px;">
                    Password Reset Request
                </h2>

                <p style="font-size: 16px; line-height: 1.6;">
                    We received a request to reset the password for the account associated with:
                </p>

                <p style="font-size: 16px; font-weight: bold;">
                    ${email}
                </p>

                <div style="text-align: center; margin: 35px 0;">
                    <a 
                        href="${resetUrl}"
                        style="
                            background-color: #007bff;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 14px 30px;
                            font-size: 16px;
                            border-radius: 6px;
                            display: inline-block;
                        ">
                        Reset Password
                    </a>
                </div>

                <p style="font-size: 14px; color: #555;">
                    ⏱ This link is valid for <strong>1 hour</strong>.  
                    If it expires, please request a new password reset.
                </p>

                <!-- Warning -->
                <div style="
                    border-left: 4px solid #ff4d4f;
                    background-color: #fff4f4;
                    padding: 15px;
                    margin-top: 25px;
                    border-radius: 4px;
                ">
                    <p style="margin: 0; color: #a70000; font-weight: bold;">
                        ⚠ If you did not request this, please ignore this email.
                        Do not share this link with anyone.
                    </p>
                </div>

                <p style="font-size: 14px; color: #777; margin-top: 25px;">
                    For security reasons, choose a strong and unique password.
                </p>
            </div>

            <!-- Footer -->
            <div style="
                background-color: #f1f1f1;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #777;
            ">
                © ${new Date().getFullYear()} Academia – Student Attendance System  
                <br />
                Need help? Contact
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">
                    ${process.env.EMAIL_USER}
                </a>
            </div>

        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

/* =====================================================
   SEND ATTENDANCE WARNING EMAIL
 ===================================================== */
export const sendAttendanceWarningEmail = async (student, warnings) => {
    const mailOptions = {
        from: `"Student Attendance System" <${process.env.EMAIL_USER}>`,
        to: student.user.email,
        subject: '⚠️ Low Attendance Warning',
        attachments: [
            {
                filename: 'Academia.png',
                path: LOGO_PATH,
                cid: 'academiaLogo',
            },
        ],
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <div style="background-color: #003366; padding: 20px; text-align: center;">
                <img src="cid:academiaLogo" alt="Academia Logo" style="max-height: 60px; margin-bottom: 10px;"/>
                <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Attendance Warning</h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px; color: #333;">
                <p style="font-size: 16px;">Hello <strong>${student.user.fullname}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.6;">
                    This is an automated warning regarding your attendance for this month. 
                    Our records indicate that your attendance in the following subjects is currently <strong>below 80%</strong>:
                </p>

                <div style="margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">Subject</th>
                                <th style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">Attendance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${warnings.map(w => `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #dee2e6;">${w.subject}</td>
                                    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #dc3545; font-weight: bold;">
                                        ${w.percentage}%
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="border-left: 4px solid #ffc107; background-color: #fff9e6; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">
                        IMPORTANT: Maintaining at least 80% attendance is mandatory for academic eligibility. 
                        Please ensure you attend your future classes regularly to improve your percentage.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #777;">
                © ${new Date().getFullYear()} Academia – Student Attendance System
            </div>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export default { sendPasswordResetEmail, sendAttendanceWarningEmail };
