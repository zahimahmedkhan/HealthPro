import nodemailer from 'nodemailer'
import "dotenv/config"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_EMAIL || process.env.EMAIL_USER,
        pass: process.env.USER_PASS || process.env.EMAIL_PASSWORD,
    },
});

export default transporter;