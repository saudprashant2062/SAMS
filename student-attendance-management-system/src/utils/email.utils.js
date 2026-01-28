import transporter from '../config/nodemailer.js';

/* =====================================================
   SEND PASSWORD RESET EMAIL
===================================================== */
export const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Student Attendance System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <div style="background-color: #007bff; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Student Attendance System</h1>
                </div>

                <!-- Body -->
                <div style="padding: 30px; color: #333;">
                    <h2 style="font-size: 20px; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="font-size: 16px; line-height: 1.5;">
                        We received a request to reset the password for your account associated with <strong>${email}</strong>.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 25px; font-size: 16px; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #555;">
                        This link is valid for <strong>1 hour</strong>. After that, it will expire, and you will need to request a new password reset.
                    </p>

                    <!-- Warning Section -->
                    <div style="border-left: 4px solid #ff4d4f; background-color: #fff4f4; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #a70000; font-weight: bold;">
                            ⚠️ If you did not request a password reset, please ignore this email. Do not share the link with anyone.
                        </p>
                    </div>

                    <p style="font-size: 14px; color: #777; margin-top: 20px;">
                        For extra security, make sure your new password is strong and unique.
                    </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                    &copy; ${new Date().getFullYear()} Student Attendance System. All rights reserved.<br/>
                    If you have any questions, contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff;">${process.env.EMAIL_USER}</a>.
                </div>

            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export default { sendPasswordResetEmail };
