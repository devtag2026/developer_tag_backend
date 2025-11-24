import FormSubmission, { SERVICE_TYPES } from '../models/form.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendFormSubmissionEmail, sendUserConfirmationEmail } from '../utils/resend.js';

const submitServiceRequest = asyncHandler(async (req, res) => {
    const { name, email, serviceType, description, engagementType } = req.body;

    if (!SERVICE_TYPES.includes(serviceType)) {
        throw new ApiError(400, `Invalid service type. Must be one of: ${SERVICE_TYPES.join(', ')}`);
    }

    const formSubmission = await FormSubmission.create({
        name,
        email,
        serviceType,
        description,
        engagementType: engagementType || undefined,
        formType: "Request a Service"
    });

    // Send email notifications (non-blocking)
    Promise.all([
        sendFormSubmissionEmail({
            name,
            email,
            formType: "Request a Service",
            serviceType,
            description,
            engagementType: engagementType || undefined
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

const submitContact = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, message } = req.body;

    // Combine first and last name
    const name = `${firstName} ${lastName}`.trim();

    const formSubmission = await FormSubmission.create({
        name,
        email,
        description: message,
        phoneNumber: phoneNumber || undefined,
        formType: "Contact Us"
    });

    // Send email notifications (non-blocking)
    Promise.all([
        sendFormSubmissionEmail({
            name,
            email,
            formType: "Contact Us",
            description: message,
            phoneNumber: phoneNumber || undefined
        }),
        sendUserConfirmationEmail(email, "Contact Us", name)
    ]).catch(error => {
        console.error('Error sending emails:', error);
    });

    return res.status(201).json(
        new ApiResponse(201, formSubmission, "Contact form submitted successfully")
    );
});


//Admin only
const getAllFormSubmissions = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();
    const type = (req.query.type || "").trim(); // optional filter by formType

    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { name: { $regex: regex } },
            { email: { $regex: regex } },
            { description: { $regex: regex } },
        ];
    }
    if (type) {
        filter.formType = type;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        FormSubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        FormSubmission.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        }, "Form submissions retrieved successfully")
    );
});

//Admin only
const getFormStatistics = asyncHandler(async (req, res) => {
    const totalSubmissions = await FormSubmission.countDocuments();
    const serviceRequests = await FormSubmission.countDocuments({ formType: "Request a Service" });
    const questions = await FormSubmission.countDocuments({ formType: "Ask a Question" });
    const contactSubmissions = await FormSubmission.countDocuments({ formType: "Contact Us" });

    const statistics = {
        totalSubmissions,
        serviceRequests,
        questions,
        contactSubmissions,
    };

    return res.status(200).json(
        new ApiResponse(200, statistics, "Form statistics retrieved successfully")
    );
});

export {
    submitServiceRequest,
    submitQuestion,
    submitContact,
    getAllFormSubmissions,
    getFormStatistics,
};
