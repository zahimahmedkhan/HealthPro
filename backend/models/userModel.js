import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        type: String,
    },
    phone: {
        type: String,
        default: "",
    },
    dob: {
        type: Date,
        default: null,
    },
    refreshToken: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["patient", "doctor", "lab", "admin"],
        default: "patient"
    },
    // Migration note: any legacy records with role "user" should be mapped to "patient"
    // during a one-time data migration. The app treats old "user" accounts as patient accounts.
    specialization: {
        type: String,
        default: null,
    },
    licenseNumber: {
        type: String,
        default: null,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    labName: {
        type: String,
        default: null,
    },
    labLicenseNumber: {
        type: String,
        default: null,
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        console.error("User Model Pre Error", error);
        next(error);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.compareOtp = async function (otp) {
    if (!this.otp) {
        return false;
    }
    return await bcrypt.compare(otp, this.otp)
}

const User = mongoose.model("User", userSchema);

export default User