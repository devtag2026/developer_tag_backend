import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trime: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please provide a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
        },
        avatar: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Encrypting Password
userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    console.log("Hashed password:", this.password);
    next()
});

// checking passowrd
userSchema.methods.isPasswordCorrect = async function (password) {
    console.log("Entered password:", password);
    console.log("Stored hashed password:", this.password);
    return await bcrypt.compare(password, this.password)
}


// Tokens

// Access Token
userSchema.methods.generateAccessTokens = async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Refresh Token
userSchema.methods.generateRefreshTokens = async function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema);