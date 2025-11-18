import Career from "../models/career.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ----------- Add Career Position --------------
export const addCareer = asyncHandler(async (req, res) => {
    const { title, location, type, experience, description, requirements, responsibilities, isActive } = req.body;

    // Validate required fields
    if (!title || !location || !type || !experience || !description || !requirements || !responsibilities) {
        throw new ApiError(400, "Missing required fields: title, location, type, experience, description, requirements, responsibilities");
    }

    // Validate arrays
    if (!Array.isArray(requirements) || requirements.length === 0) {
        throw new ApiError(400, "Requirements must be a non-empty array");
    }

    if (!Array.isArray(responsibilities) || responsibilities.length === 0) {
        throw new ApiError(400, "Responsibilities must be a non-empty array");
    }

    // Create new career position
    const newCareer = new Career({
        title,
        location,
        type,
        experience,
        description,
        requirements,
        responsibilities,
        isActive: isActive !== undefined ? isActive : true,
    });

    const savedCareer = await newCareer.save();
    return res
        .status(201)
        .json(new ApiResponse(201, savedCareer, "Career position added successfully"));
});

// ----------- Update Career Position --------------
export const updateCareer = asyncHandler(async (req, res) => {
    const career = await Career.findById(req.params.id);
    if (!career) {
        throw new ApiError(404, "Career position not found");
    }

    // Update fields from req.body
    const { title, location, type, experience, description, requirements, responsibilities, isActive } = req.body;
    
    if (title) career.title = title;
    if (location) career.location = location;
    if (type) career.type = type;
    if (experience) career.experience = experience;
    if (description) career.description = description;
    if (requirements) {
        if (!Array.isArray(requirements) || requirements.length === 0) {
            throw new ApiError(400, "Requirements must be a non-empty array");
        }
        career.requirements = requirements;
    }
    if (responsibilities) {
        if (!Array.isArray(responsibilities) || responsibilities.length === 0) {
            throw new ApiError(400, "Responsibilities must be a non-empty array");
        }
        career.responsibilities = responsibilities;
    }
    if (isActive !== undefined) career.isActive = isActive;

    const updatedCareer = await career.save();
    return res
        .status(200)
        .json(new ApiResponse(200, updatedCareer, "Career position updated successfully"));
});

// ----------- Get All Careers --------------
export const getCareers = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();
    const type = req.query.type?.trim();
    const isActive = req.query.isActive;

    // Build filter
    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
            { location: { $regex: regex } },
        ];
    }
    if (type) {
        filter.type = type;
    }
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Career.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Career.countDocuments(filter),
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
    }, "Careers fetched successfully"));
});

// ----------- Get Active Careers (Public) --------------
export const getActiveCareers = asyncHandler(async (req, res) => {
    const careers = await Career.find({ isActive: true })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, careers, "Active careers fetched successfully"));
});

// ----------- Get Single Career --------------
export const getCareerById = asyncHandler(async (req, res) => {
    const career = await Career.findById(req.params.id);

    if (!career) {
        throw new ApiError(404, "Career position not found");
    }

    return res.status(200).json(new ApiResponse(200, career, "Career fetched successfully"));
});

// ----------- Delete Career --------------
export const deleteCareer = asyncHandler(async (req, res) => {
    const deletedCareer = await Career.findByIdAndDelete(req.params.id);

    if (!deletedCareer) {
        throw new ApiError(404, "Career position not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Career position deleted successfully"));
});

// ----------- Get Total Careers --------------
export const getTotalCareers = asyncHandler(async (req, res) => {
    const total = await Career.countDocuments();
    const active = await Career.countDocuments({ isActive: true });
    return res.status(200).json(new ApiResponse(200, { total, active }, "Total careers fetched successfully"));
});

