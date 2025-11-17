import Portfolio from "../models/portfolio.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ----------- Add Portfolio Project --------------
export const addPortfolio = asyncHandler(async (req, res) => {
    const { name, description, cost, url, category, featured, displayOrder } = req.body;

    // Validate required fields
    if (!name || !description || !cost || !url || !category) {
        throw new ApiError(400, "Missing required fields: name, description, cost, url, category");
    }

    // Process image upload - only file uploads are accepted
    let imageUrl = null;
    
    if (req.files?.image?.[0]) {
        const imageFile = req.files.image[0];
        const imageUpload = await uploadOnCloudinary(imageFile.path);
        
        if (!imageUpload || !imageUpload.url) {
            throw new ApiError(500, "Failed to upload image to Cloudinary. Please check your Cloudinary configuration and server logs.");
        }
        
        imageUrl = imageUpload.url;
    }

    if (!imageUrl || imageUrl === '') {
        throw new ApiError(400, "Image is required. Please provide an image file.");
    }

    // Create new portfolio project
    const newPortfolio = new Portfolio({
        name,
        description,
        cost,
        image: imageUrl,
        url,
        category,
        featured: featured || false,
        displayOrder: displayOrder || 0,
    });

    const savedPortfolio = await newPortfolio.save();
    return res
        .status(201)
        .json(new ApiResponse(201, savedPortfolio, "Portfolio project added successfully"));
});

// ----------- Update Portfolio Project --------------
export const updatePortfolio = asyncHandler(async (req, res) => {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    // Update text fields from req.body
    const { name, description, cost, url, category, featured, displayOrder } = req.body;
    if (name) portfolio.name = name;
    if (description) portfolio.description = description;
    if (cost) portfolio.cost = cost;
    if (url) portfolio.url = url;
    if (category) portfolio.category = category;
    if (featured !== undefined) portfolio.featured = featured;
    if (displayOrder !== undefined) portfolio.displayOrder = displayOrder;

    // Process image upload if a new file is provided
    // If no file is provided, keep the existing image
    const imageFile = req.files?.image?.[0];
    if (imageFile) {
        const imageUpload = await uploadOnCloudinary(imageFile.path);
        if (imageUpload?.url) {
            portfolio.image = imageUpload.url;
        }
    }

    const updatedPortfolio = await portfolio.save();
    return res
        .status(200)
        .json(new ApiResponse(200, updatedPortfolio, "Portfolio project updated successfully"));
});

// ----------- Get All Portfolios --------------
export const getPortfolios = asyncHandler(async (req, res) => {
    const rawPage = Number(req.query.page) || 1;
    const rawLimit = Number(req.query.limit) || 10;
    const page = rawPage < 1 ? 1 : rawPage;
    const limit = rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const search = (req.query.search || "").trim();
    const category = req.query.category?.trim();
    const featured = req.query.featured;

    // Build filter
    const filter = {};
    if (search) {
        const regex = new RegExp(search, "i");
        filter.$or = [
            { name: { $regex: regex } },
            { description: { $regex: regex } },
            { cost: { $regex: regex } },
        ];
    }
    if (category) {
        filter.category = category;
    }
    if (featured !== undefined) {
        filter.featured = featured === 'true';
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Portfolio.find(filter)
            .sort({ category: 1, displayOrder: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Portfolio.countDocuments(filter),
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
    }, "Portfolios fetched successfully"));
});

// ----------- Get Portfolios by Category --------------
export const getPortfoliosByCategory = asyncHandler(async (req, res) => {
    const category = req.params.category;

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    const portfolios = await Portfolio.find({ category })
        .sort({ displayOrder: 1, createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, {
        category,
        items: portfolios
    }, `Portfolios for category '${category}' fetched successfully`));
});

// ----------- Get Portfolios Grouped by Category --------------
export const getPortfoliosGroupedByCategory = asyncHandler(async (req, res) => {
    console.log("🔍 Fetching portfolios from database...");
    
    const portfolios = await Portfolio.find()
        .sort({ category: 1, displayOrder: 1, createdAt: -1 });

    console.log(`📊 Found ${portfolios.length} portfolios in database`);
    
    if (portfolios.length === 0) {
        console.log("⚠️  No portfolios found in database. Checking collection name...");
        const collection = Portfolio.collection.name;
        console.log(`📁 Collection name: ${collection}`);
        
        const count = await Portfolio.countDocuments();
        console.log(`📊 Total documents in collection: ${count}`);
    }

    // Category to display name mapping
    const categoryMap = {
        'custom-software-solutions': 'Custom Software Solutions',
        'web-development': 'Web Development',
        'e-commerce': 'E-commerce',
        'app-development': 'App Development',
        'content-management-system': 'Content Management System',
        'desktop-applications': 'Desktop Applications',
        'software-as-a-service': 'Software as a Service (SaaS)'
    };

    // Group by category
    const grouped = {};
    portfolios.forEach(portfolio => {
        if (!grouped[portfolio.category]) {
            grouped[portfolio.category] = [];
        }
        grouped[portfolio.category].push(portfolio);
    });

    // Format response
    const categories = Object.keys(grouped).map(category => ({
        title: categoryMap[category] || category,
        slug: category,
        projects: grouped[category]
    }));

    console.log(`✅ Returning ${categories.length} categories with ${portfolios.length} total projects`);

    return res.status(200).json(new ApiResponse(200, {
        categories,
        total: portfolios.length
    }, "Portfolios grouped by category fetched successfully"));
});

// ----------- Get Single Portfolio --------------
export const getPortfolioById = asyncHandler(async (req, res) => {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    return res.status(200).json(new ApiResponse(200, portfolio, "Portfolio fetched successfully"));
});

// ----------- Delete Portfolio --------------
export const deletePortfolio = asyncHandler(async (req, res) => {
    const deletedPortfolio = await Portfolio.findByIdAndDelete(req.params.id);

    if (!deletedPortfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Portfolio deleted successfully"));
});

// ----------- Get Featured Portfolios --------------
export const getFeaturedPortfolios = asyncHandler(async (req, res) => {
    const portfolios = await Portfolio.find({ featured: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(10);

    return res.status(200).json(new ApiResponse(200, portfolios, "Featured portfolios fetched successfully"));
});

// ----------- Get Total Portfolios --------------
export const getTotalPortfolios = asyncHandler(async (req, res) => {
    const total = await Portfolio.countDocuments();
    return res.status(200).json(new ApiResponse(200, { total }, "Total portfolios fetched successfully"));
});
