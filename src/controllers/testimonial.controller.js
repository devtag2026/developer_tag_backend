import { Testimonial } from "../models/testimonial.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ---Get all testimonials-----
// Optionally, you can populate the user field if needed.
export const getTestimonials = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { content: { $regex: regex } },
            { name: { $regex: regex } },
            { category: { $regex: regex } },
        ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Testimonial.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json(new ApiResponse(200, {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        }
    }, "Testimonials fetched successfully"));
});

// ---Add a new testimonial-----
export const addTestimonial = asyncHandler(async (req, res) => {
  const { content, name, category } = req.body;

  //  Validation
  if (!content || !name) {
    throw new ApiError(400, "Missing required fields: content and name are required");
  }

  //  Create new testimonial without image
  const newTestimonial = new Testimonial({
    content,
    name,
    category, //  optional category field
  });

  const savedTestimonial = await newTestimonial.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, savedTestimonial, "Testimonial added successfully")
    );
});


// ---Update a testimonial (excluding testimonialImg)-----
export const updateTestimonial = asyncHandler(async (req, res) => {
  const { content, name, category } = req.body;

  const updatedTestimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    {
      ...(content && { content }),
      ...(name && { name }),
      ...(category !== undefined && { category }),
    },
    { new: true, runValidators: true }
  );

  if (!updatedTestimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTestimonial, "Testimonial updated successfully")
    );
});


// ---Delete a testimonial-----
export const deleteTestimonial = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
        throw new ApiError(404, "Testimonial not found");
    }

    // Use findByIdAndDelete to remove the document
    await Testimonial.findByIdAndDelete(req.params.id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Testimonial deleted successfully"));
});

export const getLatestTestimonial = asyncHandler(async (req, res) => {
    const latestTestimonial = await Testimonial.findOne().sort({ createdAt: -1 });

    if (!latestTestimonial) {
        throw new ApiError(404, "No testimonials found");
    }

    return res.status(200).json(new ApiResponse(200, latestTestimonial, "Latest testimonial fetched successfully"));
});

export const getTestimonialById = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
        throw new ApiError(404, "Testimonial not found");
    }

    return res.status(200).json(new ApiResponse(200, testimonial, "Testimonial fetched successfully"));
});

export const getTotalTestimonials = asyncHandler(async (req, res) => {
    const totalTestimonials = await Testimonial.countDocuments();

    return res.status(200).json(new ApiResponse(200, { total: totalTestimonials }, "Total number of testimonials fetched successfully"));
});
