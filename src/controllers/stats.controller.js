import Portfolio from "../models/portfolio.model.js";
import { Service } from "../models/service.model.js";
import { Testimonial } from "../models/testimonial.model.js";
import FormSubmission from "../models/form.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getOverallStats = asyncHandler(async (req, res) => {
    const [totalPortfolios, totalServices, totalTestimonials, totalForms] = await Promise.all([
        Portfolio.countDocuments(),
        Service.countDocuments(),
        Testimonial.countDocuments(),
        FormSubmission.countDocuments(),
    ]);

    const data = {
        totals: {
            portfolios: totalPortfolios,
            services: totalServices,
            testimonials: totalTestimonials,
            forms: totalForms,
        }
    };

    return res.status(200).json(new ApiResponse(200, data, "Overall statistics fetched successfully"));
});


