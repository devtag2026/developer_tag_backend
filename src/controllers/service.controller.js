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

    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User information not found");
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
        user: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, service, "Service created successfully"));
});

export const updateService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    if (String(service.user) !== String(req.user._id)) {
        throw new ApiError(403, "Forbidden: You do not have permission to update this service");
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

    if (String(service.user) !== String(req.user._id)) {
        throw new ApiError(403, "Forbidden: You do not have permission to delete this service");
    }

    await Service.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, "Service deleted successfully"));
});

export const listServices = asyncHandler(async (req, res) => {
    const services = await Service.find().sort({ createdAt: -1 }).populate("user", "fullName email");
    return res.status(200).json(new ApiResponse(200, services, "Services fetched successfully"));
});


