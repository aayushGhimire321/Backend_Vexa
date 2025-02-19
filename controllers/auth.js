import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createError } from "../error.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import otpGenerator from 'otp-generator';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    },
    port: 465,
    host: 'smtp.gmail.com'
});

// Helper function to send OTP emails
const sendOtpEmail = (email, name, otp, subject) => {
    const emailOptions = {
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHQMmI5x5qWbOrEuJuFWkSIBQoT_fFyoKOKYqOSoIvQ&s" alt="VEXA Logo" style="display: block; margin: 0 auto; max-width: 200px; margin-bottom: 20px;">
            <h1 style="font-size: 22px; font-weight: 500; color: #854CE6; text-align: center; margin-bottom: 30px;">${subject}</h1>
            <div style="background-color: #FFF; border: 1px solid #e5e5e5; border-radius: 5px; box-shadow: 0px 3px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #854CE6; border-top-left-radius: 5px; border-top-right-radius: 5px; padding: 20px 0;">
            <h2 style="font-size: 28px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 10px;">Verification Code</h2>
            <h1 style="font-size: 32px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 20px;">${otp}</h1>
            </div>
            <div style="padding: 30px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Dear ${name},</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">To ${subject === 'Account Verification OTP' ? 'activate your account' : 'reset your password'}, please enter the following verification code:</p>
            <p style="font-size: 20px; font-weight: 500; color: #666; text-align: center; margin-bottom: 30px; color: #854CE6;">${otp}</p>
            <p style="font-size: 12px; color: #666; margin-bottom: 20px;">If you did not request this action, please disregard this email.</p>
            </div>
            </div>
            <br>
            <p style="font-size: 16px; color: #666; margin-bottom: 20px; text-align: center;">Best regards,<br>The VEXA Team</p>
            </div>
        `
    };

    transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.error('Error sending OTP email:', error);
            return { success: false, error };
        }
        console.log('OTP email sent:', info.response);
        return { success: true, info };
    });
};

export const signup = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(422).send({ message: "Missing email." });
    }

    try {
        const existingUser = await User.findOne({ email }).exec();
        if (existingUser) {
            return res.status(409).send({ message: "Email is already in use." });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const newUser = new User({ ...req.body, password: hashedPassword });

        await newUser.save()
            .then((user) => {
                const token = jwt.sign({ id: user._id }, process.env.JWT, { expiresIn: "9999 years" });
                res.status(200).json({ token, user });
            })
            .catch((err) => next(err));
    } catch (err) {
        next(err);
    }
};

export const signin = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(createError(201, "User not found"));
        }
        if (user.googleSignIn) {
            return next(createError(201, "Please sign in with Google."));
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return next(createError(201, "Wrong password"));
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT, { expiresIn: "9999 years" });
        res.status(200).json({ token, user });
    } catch (err) {
        next(err);
    }
};

export const googleAuthSignIn = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            const newUser = new User({ ...req.body, googleSignIn: true });
            await newUser.save();
            const token = jwt.sign({ id: newUser._id }, process.env.JWT, { expiresIn: "9999 years" });
            return res.status(200).json({ token, newUser });
        }

        if (user.googleSignIn === false) {
            return next(createError(201, "User already exists with this email can't do Google auth"));
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT, { expiresIn: "9999 years" });
        res.status(200).json({ token, user });
    } catch (err) {
        next(err);
    }
};

export const logout = (req, res) => {
    res.clearCookie("access_token").json({ message: "Logged out" });
};

export const generateOTP = async (req, res) => {
    req.app.locals.OTP = await otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true });
    const { email, name, reason } = req.query;

    const subject = reason === 'reset' ? 'VEXA Reset Password Verification' : 'Account Verification OTP';

    const otpResult = sendOtpEmail(email, name, req.app.locals.OTP, subject);
    if (otpResult.success) {
        res.status(200).json({ message: "OTP sent successfully" });
    } else {
        res.status(500).json({ message: "Error sending OTP" });
    }
};
