import FormSubmission, { SERVICE_TYPES } from '../models/form.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendFormSubmissionEmail, sendUserConfirmationEmail } from '../utils/resend.js';

const submitServiceRequest = asyncHandler(async (req, res) => {
    const { name, email, serviceType, description } = req.body;

    if (!SERVICE_TYPES.includes(serviceType)) {
        throw new ApiError(400, `Invalid service type. Must be one of: ${SERVICE_TYPES.join(', ')}`);
    }

    const formSubmission = await FormSubmission.create({
        name,
        email,
        serviceType,
        description,
        formType: "Request a Service"
    });

    // Send email notifications (non-blocking)
    Promise.all([
        sendFormSubmissionEmail({
            name,
            email,
            formType: "Request a Service",
            serviceType,
            description
        }),
        sendUserConfirmationEmail(email, "Request a Service", name)
    ]).catch(error => {
        console.error('Error sending emails:', error);
    });

    return res.status(201).json(
        new ApiResponse(201, formSubmission, "Service request submitted successfully")
    );
});

const submitQuestion = asyncHandler(async (req, res) => {
    const { name, email, description } = req.body;

    const formSubmission = await FormSubmission.create({
        name,
        email,
        description,
        formType: "Ask a Question"
    });

    // Send email notifications (non-blocking)
    Promise.all([
        sendFormSubmissionEmail({
            name,
            email,
            formType: "Ask a Question",
            description
        }),
        sendUserConfirmationEmail(email, "Ask a Question", name)
    ]).catch(error => {
        console.error('Error sending emails:', error);
    });

    return res.status(201).json(
        new ApiResponse(201, formSubmission, "Question submitted successfully")
    );
});


//Admin only
const getAllFormSubmissions = asyncHandler(async (req, res) => {
    const formSubmissions = await FormSubmission.find({})
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, formSubmissions, "Form submissions retrieved successfully")
    );
});

//Admin only
const getFormStatistics = asyncHandler(async (req, res) => {
    const totalSubmissions = await FormSubmission.countDocuments();
    const serviceRequests = await FormSubmission.countDocuments({ formType: "Request a Service" });
    const questions = await FormSubmission.countDocuments({ formType: "Ask a Question" });

    const statistics = {
        totalSubmissions,
        serviceRequests,
        questions,
    };

    return res.status(200).json(
        new ApiResponse(200, statistics, "Form statistics retrieved successfully")
    );
});

export {
    submitServiceRequest,
    submitQuestion,
    getAllFormSubmissions,
    getFormStatistics,
};
