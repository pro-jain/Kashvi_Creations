import validator from "validator";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

// ─── Email transporter (reuse existing setup) ───────────────────────────────
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendOtpEmail = async (email, otp) => {
    await transporter.sendMail({
        from: `"Kashvi Creations" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP for Kashvi Creations Signup",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#333">
                <div style="background:#1a1a1a;padding:24px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">KASHVI CREATIONS</h1>
                </div>
                <div style="padding:32px 24px">
                    <h2 style="margin:0 0 8px">Verify your email</h2>
                    <p style="color:#666">Use the OTP below to complete your signup. It expires in 10 minutes.</p>
                    <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
                        <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a">${otp}</p>
                    </div>
                    <p style="color:#999;font-size:13px">If you didn't request this, ignore this email.</p>
                </div>
                <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#999">
                    © 2026 Kashvi Creations. All rights reserved.
                </div>
            </div>
        `,
    });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Admin login ─────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Step 1: Send OTP (called when user submits signup form) ─────────────────
const sendOtp = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password || !phone) {
            return res.json({ success: false, message: "All fields are required" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters" });
        }

        const exists = await userModel.findOne({ email });
        if (exists && exists.isVerified) {
            return res.json({ success: false, message: "User already exists" });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upsert unverified user (so OTP can be stored before they verify)
        await userModel.findOneAndUpdate(
            { email },
            { name, email, password: hashedPassword, phone, otp, otpExpiry, isVerified: false },
            { upsert: true, new: true }
        );

        await sendOtpEmail(email, otp);
        res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Step 2: Verify OTP and complete registration ────────────────────────────
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.json({ success: false, message: "User not found" });
        if (user.isVerified) return res.json({ success: false, message: "Already verified" });
        if (user.otp !== otp) return res.json({ success: false, message: "Incorrect OTP" });
        if (new Date() > user.otpExpiry) return res.json({ success: false, message: "OTP expired. Please signup again." });

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) return res.json({ success: false, message: "User doesn't exist" });
        if (!user.isVerified) return res.json({ success: false, message: "Please verify your email first" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ─── Get saved addresses ──────────────────────────────────────────────────────
const getAddresses = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ─── Save address ─────────────────────────────────────────────────────────────
const saveAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        if (address.isDefault) user.addresses.forEach(a => a.isDefault = false);
        if (user.addresses.length === 0) address.isDefault = true;

        user.addresses.push(address);
        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ─── Delete address ───────────────────────────────────────────────────────────
const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        await userModel.findByIdAndUpdate(req.userId, {
            $pull: { addresses: { _id: addressId } }
        });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ─── Keep old registerUser export so nothing else breaks ─────────────────────
// (now just an alias for sendOtp — old route still works)
const registerUser = sendOtp;

export { registerUser, adminLogin, loginUser, sendOtp, verifyOtp, getAddresses, saveAddress, deleteAddress };