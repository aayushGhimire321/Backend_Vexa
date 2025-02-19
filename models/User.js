import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// User Schema Definition
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique at the DB level
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleSignIn; // Password required only if not using Google Auth
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },
    img: {
      type: String,
      default: "https://i.ibb.co/4pDNDk1/default-avatar.png", // Default profile image
    },
    googleSignIn: {
      type: Boolean,
      required: true,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false, // For email verification status
    },
    otp: {
      type: String,
      default: null, // Stores OTP for email verification or password reset
    },
    otpExpires: {
      type: Date,
      default: null, // Expiration time for OTP
    },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project", default: [] }],
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teams", default: [] }],
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notifications", default: [] }],
    works: [{ type: mongoose.Schema.Types.ObjectId, ref: "Works", default: [] }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tasks", default: [] }],
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash the password if it's modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Generate Access Token
UserSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// 🔐 Generate Email Verification Token
UserSchema.methods.generateVerificationToken = function () {
  return jwt.sign({ id: this._id }, process.env.USER_VERIFICATION_TOKEN_SECRET, { expiresIn: "7d" });
};

// 👨‍💻 Generate OTP for verification or password reset
UserSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp = otp;
  this.otpExpires = Date.now() + 3600000; // OTP expires in 1 hour
  return otp;
};

// 📍 Validate OTP expiration
UserSchema.methods.isOtpValid = function () {
  return this.otpExpires > Date.now(); // Check if OTP is still valid
};

// Ensure the email is unique at the DB level
UserSchema.index({ email: 1 }, { unique: true, sparse: true });

// Add unique validation for email
UserSchema.path('email').validate(async (value) => {
  const count = await mongoose.models.User.countDocuments({ email: value });
  return count === 0; // Ensures that the email is unique
}, 'Email already exists');

// Export the model
export default mongoose.model("User", UserSchema);
