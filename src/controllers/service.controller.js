import { Service } from "../models/service.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const createService = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Missing required fields");
    }

    let imageUrl = req.body.imageUrl || "";
    const imageFile = req.files?.image?.[0];
    if (imageFile) {
        const upload = await uploadOnCloudinary(imageFile.path);
        if (!upload) {
            throw new ApiError(500, "Error uploading image");
        }
        imageUrl = upload.url;
    }

    const service = await Service.create({
        title,
        description,
        imageUrl,
    });

    return res.status(201).json(new ApiResponse(201, service, "Service created successfully"));
});

export const updateService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    const { title, description } = req.body;
    if (title) service.title = title;
    if (description) service.description = description;

    const imageFile = req.files?.image?.[0];
    if (imageFile) {
        const upload = await uploadOnCloudinary(imageFile.path);
        if (!upload) {
            throw new ApiError(500, "Error uploading image");
        }
        service.imageUrl = upload.url;
    }

    const updated = await service.save();
    return res.status(200).json(new ApiResponse(200, updated, "Service updated successfully"));
});

export const deleteService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    await Service.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, "Service deleted successfully"));
});

export const listServices = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { title: { $regex: regex } },
            { description: { $regex: regex } },
        ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Service.countDocuments(filter),
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
    }, "Services fetched successfully"));
});


