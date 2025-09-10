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

    if (process.env.NODE_ENV !== "production") {
        console.error("[ERROR]", err);
    }

    const payload = new ApiResponse(statusCode, { errors }, message);
    return res.status(statusCode).json(payload);
};


