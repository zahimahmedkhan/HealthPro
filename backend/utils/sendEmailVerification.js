import fs from "fs";
import path from "path";
import transporter from "../config/nodeMailer.js";
import { fileURLToPath } from "url";
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendVerificationToEmail = async (otp, userEmail, userName, frontendBaseUrl) => {
    try {
        // Read HTML template and inject data
        const templatePath = path.join(__dirname, "../templates/otpEmail.html");

        let htmlTemplate = "";
        try {
            htmlTemplate = fs.readFileSync(templatePath, "utf-8");
        } catch (fileError) {
            console.warn("⚠️ Template file not found, using simple HTML");
            htmlTemplate = `
                <h2>Your OTP</h2>
                <p>Hi {{userName}},</p>
                <p>Your OTP is: <strong>{{otp}}</strong></p>
                <p>This OTP will expire in 5 minutes.</p>
            `;
        }

        htmlTemplate = htmlTemplate
            .replace("{{userName}}", userName || "User")
            .replace("{{otp}}", otp);

        const subject = `Your OTP Verification Code - Health Dashboard`;

        const mailOptions = {
            from: process.env.USER_EMAIL || process.env.EMAIL_USER,
            to: userEmail,
            subject: subject,
            html: htmlTemplate,
            headers: {
                'X-Priority': '3',
                'Importance': 'normal',
                'X-MSMail-Priority': 'Normal',
                'X-Mailer': 'HealthDashboard/1.0',
                'MIME-Version': '1.0',
                'Content-Type': 'text/html; charset=UTF-8'
            }
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("❌ Error sending verification email:", error.message);
        throw error;
    }
};

const sendOtpToEmail = async (otp, email, userName) => {
    try {
        // Read HTML template and inject data
        const templatePath = path.join(__dirname, "../templates/otpEmail.html");
        
        let htmlTemplate = "";
        try {
            htmlTemplate = fs.readFileSync(templatePath, "utf-8");
        } catch (fileError) {
            console.warn("⚠️ Template file not found, using simple HTML");
            htmlTemplate = `
                <h2>Your OTP</h2>
                <p>Hi {{userName}},</p>
                <p>Your OTP is: <strong>{{otp}}</strong></p>
                <p>This OTP will expire in 5 minutes.</p>
            `;
        }

        htmlTemplate = htmlTemplate
            .replace("{{userName}}", userName || "User")
            .replace("{{otp}}", otp);

        const mailOptions = {
            from: process.env.USER_EMAIL || process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Verification Code",
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("❌ Error sending OTP email:", error.message);
        throw error;
    }
}

export { sendVerificationToEmail, sendOtpToEmail };