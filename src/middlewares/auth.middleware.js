import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";



export const verifyJWT = asyncHandler(async (req, _, next) => {
    console.log("🔐 [AUTH] JWT verification started");
    try {
        const authHeader = req.header("Authorization");
        const cookieToken = req.cookies?.accessToken;
        
        console.log("🔐 [AUTH] Token sources:", {
            hasCookie: !!cookieToken,
            hasAuthHeader: !!authHeader,
            authHeaderValue: authHeader ? authHeader.substring(0, 20) + "..." : "none"
        });

        const token = cookieToken || (authHeader ? authHeader.replace("Bearer ", "") : null);

        if (!token) {
            console.error("❌ [AUTH] No token found");
            throw new ApiError(401, "Unauthorized Request")
        }

        console.log("🔐 [AUTH] Token found, verifying...");
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("🔐 [AUTH] Token decoded, user ID:", decodedToken?._id);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )

        if (!user) {
            console.error("❌ [AUTH] User not found for token");
            throw new ApiError(401, "Invalid Access Token")
        }

        console.log("✅ [AUTH] User authenticated:", {
            id: user._id,
            email: user.email,
            role: user.role
        });

        req.user = user
        next()

    } catch (error) {
        console.error("❌ [AUTH] JWT verification failed:", {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw new ApiError(401, "Invalid Access Token")
    }
})

// Role-based authorization middleware
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log("🔐 [AUTH] Role authorization check:", {
            hasUser: !!req.user,
            userRole: req.user?.role,
            allowedRoles: allowedRoles
        });
        
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            console.error("❌ [AUTH] Insufficient permissions:", {
                hasUser: !!req.user,
                userRole: req.user?.role,
                requiredRoles: allowedRoles
            });
            return next(new ApiError(403, "Forbidden: insufficient permissions"));
        }
        
        console.log("✅ [AUTH] Role authorization passed");
        next();
    }
}