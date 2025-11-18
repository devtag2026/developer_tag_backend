import Portfolio from "../models/portfolio.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ----------- Add Portfolio Project --------------
export const addPortfolio = asyncHandler(async (req, res) => {
    console.log("=".repeat(80));
    console.log("📝 [PORTFOLIO CREATE] Request received");
    console.log("=".repeat(80));
    
    const { name, description, cost, url, category, featured, displayOrder } = req.body;
    
    console.log("📋 [PORTFOLIO CREATE] Request body:", {
        name: name?.substring(0, 50) || "missing",
        description: description?.substring(0, 50) || "missing",
        cost: cost || "missing",
        url: url || "missing",
        category: category || "missing",
        featured: featured,
        displayOrder: displayOrder
    });

    // Validate required fields
    if (!name || !description || !cost || !url || !category) {
        console.error("❌ [PORTFOLIO CREATE] Validation failed - Missing required fields");
        throw new ApiError(400, "Missing required fields: name, description, cost, url, category");
    }
    console.log("✅ [PORTFOLIO CREATE] Field validation passed");

    // Process image upload - only file uploads are accepted
    let imageUrl = null;
    
    console.log("📸 [PORTFOLIO CREATE] Checking for image file...");
    console.log("📸 [PORTFOLIO CREATE] req.files:", req.files ? Object.keys(req.files) : "undefined");
    console.log("📸 [PORTFOLIO CREATE] req.files?.image:", req.files?.image ? "exists" : "undefined");
    console.log("📸 [PORTFOLIO CREATE] req.files?.image?.[0]:", req.files?.image?.[0] ? "exists" : "undefined");
    
    if (req.files?.image?.[0]) {
        const imageFile = req.files.image[0];
        console.log("📸 [PORTFOLIO CREATE] Image file found:", {
            fieldname: imageFile.fieldname,
            originalname: imageFile.originalname,
            encoding: imageFile.encoding,
            mimetype: imageFile.mimetype,
            size: imageFile.size,
            path: imageFile.path,
            destination: imageFile.destination
        });
        
        console.log("☁️  [PORTFOLIO CREATE] Starting Cloudinary upload...");
        console.log("☁️  [PORTFOLIO CREATE] File path:", imageFile.path);
        
        try {
            const imageUpload = await uploadOnCloudinary(imageFile.path);
            
            console.log("☁️  [PORTFOLIO CREATE] Cloudinary upload response:", {
                success: !!imageUpload,
                hasUrl: !!imageUpload?.url,
                url: imageUpload?.url ? imageUpload.url.substring(0, 100) + "..." : "none",
                publicId: imageUpload?.public_id || "none",
                format: imageUpload?.format || "none",
                width: imageUpload?.width || "none",
                height: imageUpload?.height || "none",
                bytes: imageUpload?.bytes || "none"
            });
            
            if (!imageUpload || !imageUpload.url) {
                console.error("❌ [PORTFOLIO CREATE] Cloudinary upload failed - No URL returned");
                console.error("❌ [PORTFOLIO CREATE] Upload response:", imageUpload);
                throw new ApiError(500, "Failed to upload image to Cloudinary. Please check your Cloudinary configuration and server logs.");
            }
            
            imageUrl = imageUpload.url;
            console.log("✅ [PORTFOLIO CREATE] Image uploaded successfully to Cloudinary");
            console.log("✅ [PORTFOLIO CREATE] Image URL:", imageUrl);
        } catch (uploadError) {
            console.error("❌ [PORTFOLIO CREATE] Cloudinary upload error:", {
                message: uploadError.message,
                stack: uploadError.stack,
                name: uploadError.name
            });
            throw new ApiError(500, `Failed to upload image to Cloudinary: ${uploadError.message}`);
        }
    } else {
        console.warn("⚠️  [PORTFOLIO CREATE] No image file found in request");
        console.warn("⚠️  [PORTFOLIO CREATE] req.files structure:", JSON.stringify(req.files, null, 2));
    }

    if (!imageUrl || imageUrl === '') {
        console.error("❌ [PORTFOLIO CREATE] Image URL is missing or empty");
        throw new ApiError(400, "Image is required. Please provide an image file.");
    }

    // Create new portfolio project
    console.log("💾 [PORTFOLIO CREATE] Creating portfolio document in database...");
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
    
    console.log("💾 [PORTFOLIO CREATE] Portfolio document created:", {
        name: newPortfolio.name,
        category: newPortfolio.category,
        image: newPortfolio.image?.substring(0, 50) + "...",
        featured: newPortfolio.featured,
        displayOrder: newPortfolio.displayOrder
    });

    try {
        const savedPortfolio = await newPortfolio.save();
        console.log("✅ [PORTFOLIO CREATE] Portfolio saved successfully");
        console.log("✅ [PORTFOLIO CREATE] Saved portfolio ID:", savedPortfolio._id);
        console.log("=".repeat(80));
        console.log("✅ [PORTFOLIO CREATE] Request completed successfully");
        console.log("=".repeat(80));
        
        return res
            .status(201)
            .json(new ApiResponse(201, savedPortfolio, "Portfolio project added successfully"));
    } catch (saveError) {
        console.error("❌ [PORTFOLIO CREATE] Database save error:", {
            message: saveError.message,
            stack: saveError.stack,
            name: saveError.name,
            code: saveError.code,
            keyPattern: saveError.keyPattern,
            keyValue: saveError.keyValue
        });
        throw saveError;
    }
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
