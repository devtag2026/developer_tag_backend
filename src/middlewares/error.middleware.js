import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    const error = new ApiError(404, message);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    const isKnown = err instanceof ApiError;
    const statusCode = isKnown ? err.statusCode : 500;
    const message = isKnown ? err.message : "Internal Server Error";
    const errors = isKnown ? err.errors : [];

    console.error("=".repeat(80));
    console.error("❌ [ERROR HANDLER] Error caught");
    console.error("❌ [ERROR HANDLER] Request:", {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl
    });
    console.error("❌ [ERROR HANDLER] Error details:", {
        name: err.name,
        message: err.message,
        statusCode: statusCode,
        isKnown: isKnown,
        stack: err.stack
    });
    console.error("=".repeat(80));

    const payload = new ApiResponse(statusCode, { errors }, message);
    return res.status(statusCode).json(payload);
};


