import express from 'express'
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    forgetPassword,
    verifyEmail,
    resendOtp,
    verifyOtp,
    userNewPassword,
    userProfile,
    updateUserProfile,
    aiSummery,
    getPendingVerifications,
    approveVerification,
} from '../controllers/auth.controller.js';
import { protectedRoute, authorizeRoles } from '../middlewares/protectedRoute.js';
import upload from '../config/multer.js'

const userRoute = express.Router();
const adminRoute = express.Router();

const registerUpload = (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
        return next();
    }

    upload.single("avatar")(req, res, (err) => {
        if (err) {
            console.error("❌ Register Multer Error:", err.message);
            return res.status(400).send({
                status: 400,
                message: "Avatar upload error: " + err.message,
            });
        }
        next();
    });
};

userRoute.post("/register", registerUpload, registerUser);

userRoute.post("/verify-email/:email", verifyEmail);

userRoute.post("/resend-otp/:email", resendOtp);

userRoute.post("/login", loginUser);

userRoute.post("/refresh-token", refreshAccessToken);

userRoute.post("/forget-password", forgetPassword);

userRoute.post("/verify-otp/:email", verifyOtp);

userRoute.post("/new-password/:email", userNewPassword);

userRoute.post("/logout", logoutUser);

userRoute.get("/user-profile", protectedRoute, userProfile);

const profileUpload = (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("multipart/form-data")) {
        return next();
    }

    upload.single("avatar")(req, res, (err) => {
        if (err) {
            console.error("Profile Multer Error:", err.message);
            return res.status(400).send({
                status: 400,
                message: "File upload error: " + err.message,
            });
        }
        next();
    });
};

userRoute.put("/update-profile", protectedRoute, profileUpload, updateUserProfile);

adminRoute.get("/pending-verifications", protectedRoute, authorizeRoles("admin"), getPendingVerifications);
adminRoute.patch("/approve-verification/:userId", protectedRoute, authorizeRoles("admin"), approveVerification);

export { adminRoute };
export default userRoute;