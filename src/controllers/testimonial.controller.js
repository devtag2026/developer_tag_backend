import { Testimonial } from "../models/testimonial.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// ---Get all testimonials-----
export const getTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find();
    return res
        .status(200)
        .json(new ApiResponse(200, testimonials, "Testimonials fetched successfully"));
});


// ---Add a new testimonial-----
export const addTestimonial = asyncHandler(async (req, res) => {
    const { content, name, title } = req.body;

    if (!content || !name || !title) {
        throw new ApiError(400, "Missing required fields");
    }

    // Process file upload for testimonialImg
    let testimonialImgUrl = "";
    const testimonialImgFile = req.files?.testimonialImg?.[0];
    if (testimonialImgFile) {
        const uploadResult = await uploadOnCloudinary(testimonialImgFile.path);
        if (!uploadResult) {
            throw new ApiError(500, "Error uploading testimonial image");
        }
        testimonialImgUrl = uploadResult.url;
    }

    const newTestimonial = new Testimonial({
        content,
        name,
        title,
        testimonialImg: testimonialImgUrl || req.body.testimonialImg, // Use Cloudinary URL if available
    });

    const savedTestimonial = await newTestimonial.save();

    return res
        .status(201)
        .json(new ApiResponse(201, savedTestimonial, "Testimonial added successfully"));
});


// ---Update a testimonial (excluding testimonialImg)-----
export const updateTestimonial = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
        throw new ApiError(404, "Testimonial not found");
    }

    // Update text fields
    const { content, name, title } = req.body;
    testimonial.content = content || testimonial.content;
    testimonial.name = name || testimonial.name;
    testimonial.title = title || testimonial.title;

    // Process file upload for testimonialImg if provided
    const testimonialImgFile = req.files?.testimonialImg?.[0];
    if (testimonialImgFile) {
        const uploadResult = await uploadOnCloudinary(testimonialImgFile.path);
        if (!uploadResult) {
            throw new ApiError(500, "Error uploading testimonial image");
        }
        testimonial.testimonialImg = uploadResult.url;
    }

    const updatedTestimonial = await testimonial.save();
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTestimonial, "Testimonial updated successfully"));
});

// ---Delete a testimonial-----
export const deleteTestimonial = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
        throw new ApiError(404, "Testimonial not found");
    }

    await testimonial.remove();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Testimonial deleted successfully"));
});
