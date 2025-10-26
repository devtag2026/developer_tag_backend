import { Service } from "../models/service.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create Service
export const createService = asyncHandler(async (req, res) => {
    const {
        title,
        slug,
        description,
        category,
        heroSection,
        serviceItems,
        whyChooseSection
    } = req.body;

    // Validate required fields
    if (!title || !slug || !description || !category) {
        throw new ApiError(400, "Missing required fields: title, slug, description, category");
    }

    // Check if slug already exists
    const existingService = await Service.findOne({ slug });
    if (existingService) {
        throw new ApiError(409, "Service with this slug already exists");
    }

    // Handle image upload
    let heroImageUrl = req.body.heroImage || "";
    const heroImageFile = req.files?.heroImage?.[0];

    if (heroImageFile) {
        const upload = await uploadOnCloudinary(heroImageFile.path);
        if (!upload) {
            throw new ApiError(500, "Error uploading hero image");
        }
        heroImageUrl = upload.url;
    }

    // Create service
    const service = await Service.create({
        title,
        slug: slug.toLowerCase().trim(),
        description,
        category,
        heroImage: heroImageUrl,
        heroSection,
        serviceItems: serviceItems || [],
        whyChooseSection: whyChooseSection || { items: [] }
    });

    return res.status(201).json(new ApiResponse(201, service, "Service created successfully"));
});

// Update Service
export const updateService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    // Handle image upload if provided
    const heroImageFile = req.files?.heroImage?.[0];

    if (heroImageFile) {
        const upload = await uploadOnCloudinary(heroImageFile.path);
        if (upload) {
            service.heroImage = upload.url;
        }
    }

    // Update other fields
    const {
        title,
        slug,
        description,
        category,
        heroSection,
        serviceItems,
        whyChooseSection
    } = req.body;

    if (title) service.title = title;
    if (slug) service.slug = slug.toLowerCase().trim();
    if (description) service.description = description;
    if (category) service.category = category;
    if (heroSection) service.heroSection = heroSection;
    if (serviceItems !== undefined) service.serviceItems = serviceItems;
    if (whyChooseSection) service.whyChooseSection = whyChooseSection;

    const updated = await service.save();
    return res.status(200).json(new ApiResponse(200, updated, "Service updated successfully"));
});

// Delete Service
export const deleteService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    await Service.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, null, "Service deleted successfully"));
});

// List Services (with filtering)
export const listServices = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();
    const category = req.query.category;

    const filter = {};
    
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { title: { $regex: regex } },
            { description: { $regex: regex } }
        ];
    }

    if (category) {
        filter.category = category;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Service.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
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

// Get Single Service by ID
export const getServiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    return res.status(200).json(new ApiResponse(200, service, "Service fetched successfully"));
});

// Get Service by Slug
export const getServiceBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const service = await Service.findOne({ slug });

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    return res.status(200).json(new ApiResponse(200, service, "Service fetched successfully"));
});

// Get Services by Category
export const getServicesByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const limit = Number(req.query.limit) || 10;

    const services = await Service.find({ category })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return res.status(200).json(new ApiResponse(200, services, `Services in category '${category}' fetched successfully`));
});


