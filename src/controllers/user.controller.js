import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import cloudinary from "cloudinary"


// function for generating axxess and refresh token
const generateRefreshandAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        console.log(user)
        const accessToken = await user?.generateAccessTokens()
        const refreshToken = await user?.generateRefreshTokens()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        console.log("The error is ", error.message)
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

// ------RegisterUser---------
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if ([email, fullName, password].some((field) => {
        field?.trim() === ""
    })) {
        throw new ApiError(400, "All fields required")
    }

    const existedUser = await User.findOne({
        email
    })

    if (existedUser) {
        throw new ApiError(409, "User with this email and password already exists");
    }

    let avatarLocalPath = req.files?.avatar?.[0]?.path

    let avatarUrl = undefined
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (avatar && avatar.url) {
            avatarUrl = avatar.url
        }
    }

    const user = await User.create({
        email,
        fullName,
        password,
        avatar: avatarUrl
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error while creating user")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, createdUser, "User created successfully")
        )
})


// ------LoginUser---------
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        throw new ApiError(400, "Email or Username Required")
    }

    const user = await User.findOne({
        email
    })

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Credentials")
    }

    const { refreshToken, accessToken } = await generateRefreshandAccessTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, refreshToken, accessToken
                },
                "User LoggedIn Successfully!"
            )
        )


})


// -------Logout User-------
const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged out succesfully")
        )
})


// -------Refreshing Access Tokens-------
const refreshAccessToken = asyncHandler(async (req, res) => {
    const userRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!userRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {

        const decodedToken = jwt.verify(
            userRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (userRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token Expired")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateRefreshandAccessTokens(user?._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token Refreshed!"
                )
            )

    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Refresh Token")
    }
})


// ---------Password Change--------
const passwordChange = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New and Old Password Should be same")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Credentials")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Updated Successfully!!")
        )

})


// ----Getting Current User------
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "User fetched")
        )
})


// ----Updating Account Details------
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            },
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User updated Successfully")
        )

})

// ----Updating User Avatar------
const updateUserAvatar = asyncHandler(async (req, res) => {
    console.log("Debug - req.headers['content-type']:", req.headers['content-type'])
    console.log("Debug - req.files:", req.files)
    console.log("Debug - req.file:", req.file)
    console.log("Debug - req.body:", req.body)

    const avatarLocalPath = req.file?.path
    console.log("Debug - avatarLocalPath:", avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "File not found. Please ensure you're sending the file as multipart/form-data with field name 'avatar'")
    }

    // to delete previous image
    const user = await User.findById(req.user?._id).select("avatar")

    if (user && user.avatar) {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error in uploading on cloudinary")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Avatar image updated successfully")
        )
})


export { registerUser, loginUser, logoutUser, refreshAccessToken, passwordChange, getCurrentUser, updateAccountDetails, updateUserAvatar }