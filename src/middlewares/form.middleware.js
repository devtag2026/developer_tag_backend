import { ApiError } from "../utils/apiError.js";

const validateRequiredFields = (fields, payload) => {
    const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "");
    if (missing.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
    }
};

const validateEmail = (email) => {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    return regex.test(String(email).toLowerCase());
};

export const validateServiceRequest = (req, res, next) => {
    const { name, email, serviceType, description } = req.body;

    validateRequiredFields(["name", "email", "serviceType", "description"], req.body);

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    next();
};

export const validateQuestion = (req, res, next) => {
    const { name, email, description } = req.body;

    validateRequiredFields(["name", "email", "description"], req.body);

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    next();
};


