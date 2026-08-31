import User from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import { generateExpiryTime } from "../utils/generateExpiryTime.js";
import bcrypt from 'bcrypt'
import { sendOtpToEmail, sendVerificationToEmail } from "../utils/sendEmailVerification.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js"
import { sendResponse } from "../utils/sendResponse.js";
import "dotenv/config"
import { uploadFileToCloudinary } from "../utils/uploadToCloudniary.js";
import { ensureDbConnection } from "../db/db.js";
// Note: AISummery is used in aiSummery function below
import { AISummery } from "../utils/aiSummery.js";
import logAudit from "../utils/logAudit.js";

const registerUser = async (req, res) => {
    try {
        try {
            await ensureDbConnection();
        } catch (dbError) {
            console.error("❌ DB unavailable during register:", dbError.message);
            return res.status(503).send({
                status: 503,
                message: "Database unavailable. Please try again in a moment.",
            });
        }

        const {
            userName,
            email,
            password,
            role,
            specialization,
            licenseNumber,
            labName,
            labLicenseNumber,
        } = req.body;

        // Validate required fields
        if (!userName || !email || !password) {
            return res.status(400).send({
                status: 400,
                message: "Username, email, and password are required"
            });
        }

        const allowedRoles = ["patient", "doctor", "lab"];
        const selectedRole = role || "patient";

        if (selectedRole === "admin") {
            return res.status(403).send({
                status: 403,
                message: "Self-registration as admin is not allowed"
            });
        }

        if (!allowedRoles.includes(selectedRole)) {
            return res.status(400).send({
                status: 400,
                message: "Invalid role selected. Allowed roles are patient, doctor, and lab"
            });
        }

        if (selectedRole === "doctor" && !specialization) {
            return res.status(400).send({
                status: 400,
                message: "Specialization is required for doctor registration"
            });
        }

        if (selectedRole === "doctor" && !licenseNumber) {
            return res.status(400).send({
                status: 400,
                message: "License number is required for doctor registration"
            });
        }

        if (selectedRole === "lab" && !labName) {
            return res.status(400).send({
                status: 400,
                message: "Lab name is required for lab registration"
            });
        }

        if (selectedRole === "lab" && !labLicenseNumber) {
            return res.status(400).send({
                status: 400,
                message: "Lab license number is required for lab registration"
            });
        }

        const avatarBuffer = req.file?.buffer;

        const user = await User.findOne({
            $or: [{ email }, { userName }]
        });

        if (user) {
            const field = user.email === email ? "Email" : "User name";
            return res.status(409).send({
                status: 409,
                message: `${field} already exists`
            });
        }

        let avatarUrl = "";
        if (avatarBuffer) {
            try {
                const uploadResult = await uploadFileToCloudinary(avatarBuffer);
                avatarUrl = uploadResult.secure_url || "";
            } catch (uploadError) {
                console.warn("Avatar upload failed (continuing):", uploadError.message);
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashOtp = await bcrypt.hash(otp, 10);
        const otpExpiry = generateExpiryTime("5m");

        try {
            await sendVerificationToEmail(otp, email, userName, req.headers.origin);
        } catch (emailError) {
            console.warn("Failed to send verification email:", emailError.message);
        }

        const userPayload = {
            userName,
            email,
            password,
            otp: hashOtp,
            otpExpiry,
            avatar: avatarUrl,
            role: selectedRole,
            verified: selectedRole === "doctor" || selectedRole === "lab" ? false : true,
        };

        if (selectedRole === "doctor") {
            userPayload.specialization = specialization;
            userPayload.licenseNumber = licenseNumber;
        }

        if (selectedRole === "lab") {
            userPayload.labName = labName;
            userPayload.labLicenseNumber = labLicenseNumber;
        }

        const newUser = await User.create(userPayload);

        const message = selectedRole === "doctor" || selectedRole === "lab"
            ? "Registration successful. Your account is pending admin verification."
            : "Registration successful. Please check your email to verify your account.";

        // Audit log: registration
        logAudit({ req, action: 'REGISTER', targetId: newUser._id, targetType: 'User', actorId: newUser._id, actorRole: newUser.role });

        res.status(201).send({
            status: 201,
            message
        });

    } catch (error) {
        console.error("❌ Registration Error:", error.message);
        console.error("Error Details:", error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).send({
                status: 409,
                message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
            });
        }

        res.status(500).send({
            status: 500,
            message: "Registration failed: " + error.message
        });
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return sendResponse(res, 400, "Email is required");
        }

        const user = await User.findOne({ email });

        if (!user) {
            return sendResponse(res, 404, "No account found with this email");
        }

        if (user.isVerified) {
            return sendResponse(res, 400, "This account is already verified — please sign in");
        }

        // Rate limit: if otpExpiry was set less than 60 seconds ago, block
        if (user.otpExpiry) {
            const OTP_DURATION_MS = 5 * 60 * 1000; // 5 minutes, matches generateExpiryTime("5m")
            const otpSentAt = new Date(user.otpExpiry.getTime() - OTP_DURATION_MS);
            const secondsSinceLastOtp = (Date.now() - otpSentAt.getTime()) / 1000;

            if (secondsSinceLastOtp < 60) {
                const waitSeconds = Math.ceil(60 - secondsSinceLastOtp);
                return sendResponse(res, 429, `Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''} before requesting another code`);
            }
        }

        // Generate new OTP — same pattern as registerUser
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashOtp = await bcrypt.hash(otp, 10);
        const otpExpiry = generateExpiryTime("5m");

        user.otp = hashOtp;
        user.otpExpiry = otpExpiry;
        await user.save();

        try {
            await sendVerificationToEmail(otp, email, user.userName, req.headers.origin);
        } catch (emailError) {
            console.warn("Failed to send resend OTP email:", emailError.message);
            return sendResponse(res, 500, "Failed to send email. Please try again.");
        }

        sendResponse(res, 200, "New verification code sent");
    } catch (error) {
        console.error("Resend OTP Error:", error.message);
        sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.params.email;

    if (!otp) {
      return res.status(400).send({ status: 400, success: false, message: "OTP is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ status: 404, success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(200).send({ status: 200, success: true, message: "Email already verified" });
    }

    // Verify OTP
    const isValidOtp = await user.compareOtp(otp);
    if (!isValidOtp) {
      return res.status(400).send({ status: 400, success: false, message: "Invalid OTP" });
    }

    // Check OTP expiry
    if (user.otpExpiry < new Date()) {
      return res.status(400).send({ status: 400, success: false, message: "OTP has expired" });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).send({ status: 200, success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return res.status(500).send({ status: 500, success: false, message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
    try {
        const { email, userName, password } = req.body;

        const user = await User.findOne({
            $or: [{ email }, { userName }]
        }).select("+password");

        if (!user) {
            return sendResponse(res, 404, "User not found")
        }

        const isValidPass = await user.comparePassword(password);

        if (!isValidPass) {
            return sendResponse(res, 401, "Invalid password")
        }

        const accessToken = generateAccessToken("15m", user._id);
        const refreshToken = generateRefreshToken("1h", user._id);

        user.refreshToken = refreshToken;
        await user.save();

        const userPayload = {
            _id: user._id,
            userName: user.userName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            verified: user.verified,
            avatar: user.avatar,
            phone: user.phone,
            dob: user.dob,
        };

        // Audit log: login
        logAudit({ req, action: 'LOGIN', targetId: user._id, targetType: 'User', actorId: user._id, actorRole: user.role });

        sendResponse(res, 200, "Login successful", {
            accessToken,
            refreshToken,
            user: userPayload,
        })
    } catch (error) {
        console.error("Login Error:", error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
};

const getPendingVerifications = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            role: { $in: ["doctor", "lab"] },
            verified: false,
        }).select("-password -refreshToken -otp -otpExpiry");

        return sendResponse(res, 200, "Pending verifications fetched successfully", { users: pendingUsers });
    } catch (error) {
        console.error("Get Pending Verifications Error:", error);
        return sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

const approveVerification = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return sendResponse(res, 400, "User ID is required");
        }

        const user = await User.findById(userId);

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        if (!['doctor', 'lab'].includes(user.role)) {
            return sendResponse(res, 400, "Only doctor and lab accounts can be approved");
        }

        user.verified = true;
        await user.save();

        return sendResponse(res, 200, "Verification approved successfully", { user });
    } catch (error) {
        console.error("Approve Verification Error:", error);
        return sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

const logoutUser = (req, res) => {
    res.status(200).send({ status: 200, message: "Logout successfully" });
}

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findOne({ _id: decoded.id });

        if (!user) {
            sendResponse(res, 404, "User not found")
            return
        }

        const newAccessToken = generateAccessToken("15m", user._id);

        sendResponse(res, 200, "Token refreshed", { accessToken: newAccessToken })
    } catch (error) {
        console.log("Token Refresh Error", error);
        if (error.message.includes("jwt expired")) {
            sendResponse(res, 401, "Sign In again")
            return
        }
        sendResponse(res, 500, "Internal server error", { error: error.message });
    }
};

const userNewPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const email = req.params.email;

        const user = await User.findOne({ email });

        if (!user) {
            sendResponse(res, 404, "User not found")
            return
        }

        if (!newPassword) {
            sendResponse(res, 401, "New password required")
            return
        }

        // IMPORTANT:
        // `userModel.js` already hashes `password` in a pre("save") hook.
        // If we hash here too, it becomes double-hashed and login will always fail.
        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        sendResponse(res, 200, "Password Updated Successfully")
    } catch (error) {
        console.log(error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendResponse(res, 401, "Email is required");
        }

        const user = await User.findOne({ email });

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        // Always generates a 6-digit number (000000 - 999999)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashOtp = await bcrypt.hash(otp, 10);

        // Set expiry time (current time + 5 minutes)
        const otpExpiry = generateExpiryTime("5m");

        await sendOtpToEmail(otp, email, user.userName);

        user.otp = hashOtp;
        user.otpExpiry = otpExpiry;

        await user.save();

        sendResponse(res, 200, "OTP Send to email");
    } catch (error) {
        console.log("Send Otp Error", error);
        sendResponse(res, 500, "Internal Server Error", { error: error.message })
    }
}

const verifyOtp = async (req, res) => {
    try {

        const { otp } = req.body;

        const email = req.params.email;

        if (!otp) {
            return sendResponse(res, 401, "OTP is required");
        }

        const user = await User.findOne({ email });

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        const isValidOtp = await user.compareOtp(otp);

        if (!isValidOtp) {
            return sendResponse(res, 401, "Invalid OTP")
        }

        if (user.otpExpiry < new Date()) {
            return sendResponse(res, 401, "OTP Expired")
        }

        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        sendResponse(res, 200, "OTP verified successfully")
    } catch (error) {
        console.log("Verify Otp Error", error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const userProfile = async (req, res) => {
    try {
        await ensureDbConnection();

        const user = await User.findOne({ _id: req.user._id })
            .select("-password")
            .lean();

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        sendResponse(res, 200, "User profile successfully", { user });
    } catch (error) {
        console.error("User Profile Error:", error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

const updateUserProfile = async (req, res) => {
    try {
        await ensureDbConnection();

        const { userName, phone, dob } = req.body;
        const userId = req.user?._id;
        const avatarData = req.file?.path || req.file?.buffer;

        if (!userId) {
            return sendResponse(res, 401, "Unauthorized - User ID not found");
        }

        const user = await User.findById(userId);

        if (!user) {
            return sendResponse(res, 404, "User not found");
        }

        const updateFields = {};

        if (userName) {
            const existingUser = await User.findOne({ userName, _id: { $ne: userId } });
            if (existingUser) {
                return sendResponse(res, 409, "Username already exists");
            }
            updateFields.userName = userName;
        }

        if (phone !== undefined) {
            updateFields.phone = phone;
        }

        if (dob !== undefined) {
            if (!dob) {
                updateFields.dob = null;
            } else {
                const parsedDob = new Date(dob);
                if (Number.isNaN(parsedDob.getTime())) {
                    return sendResponse(res, 400, "Invalid date of birth");
                }
                updateFields.dob = parsedDob;
            }
        }

        if (avatarData) {
            try {
                const publicPath = await uploadFileToCloudinary(avatarData);
                if (publicPath?.secure_url) {
                    updateFields.avatar = publicPath.secure_url;
                }
            } catch (uploadError) {
                console.error("Avatar Upload Error:", uploadError);
                return sendResponse(res, 500, "Failed to upload avatar: " + uploadError.message);
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return sendResponse(res, 400, "No profile fields provided to update");
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true, lean: true }
        ).select("-password");

        if (!updatedUser) {
            return sendResponse(res, 404, "User not found after update");
        }

        sendResponse(res, 200, "Profile updated successfully", { user: updatedUser });
    } catch (error) {
        console.error("Update Profile Error:", error);
        sendResponse(res, 500, "Internal server error", { error: error.message });
    }
}
const aiSummery = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim().length === 0) {
            return sendResponse(res, 400, "Question is required");
        }

        const answer = await AISummery(question);

        sendResponse(res, 200, "Successfully answer generated", { response: answer })
    } catch (error) {
        console.log("AI summery Error", error);
        sendResponse(res, 500, "Internal server error", { error: error.message })
    }
}

export {
    loginUser,
    registerUser,
    refreshAccessToken,
    logoutUser,
    getPendingVerifications,
    approveVerification,
    userNewPassword,
    verifyEmail,
    resendOtp,
    verifyOtp,
    forgetPassword,
    userProfile,
    updateUserProfile,
    aiSummery
}