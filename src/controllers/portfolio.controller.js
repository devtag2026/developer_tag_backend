import Portfolio from "../models/portfolio.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ----------- Adding Portfolio--------------

export const addPortfolio = asyncHandler(async (req, res) => {
    const { slug, title, tagLine, projectScopeDescription, techStack } = req.body;
    console.log(req.body)

    if (
        !slug ||
        !title ||
        !tagLine ||
        !projectScopeDescription ||
        !techStack
    ) {
        throw new ApiError(400, "Missing required fields");
    }

    // Process techStack to ensure it's an array.
    let techStackArray = techStack;
    if (typeof techStack === "string") {
        try {
            techStackArray = JSON.parse(techStack);
            if (!Array.isArray(techStackArray)) {
                techStackArray = [techStackArray];
            }
        } catch (err) {
            techStackArray = [techStack];
        }
    }

    // Process file upload for previewImage.
    // If a file is provided, use it; otherwise, use the value from req.body.
    let previewImageUrl = req.body.previewImage;
    if (req.files?.previewImage?.[0]) {
        const previewUpload = await uploadOnCloudinary(req.files.previewImage[0].path);
        previewImageUrl = previewUpload?.url || previewImageUrl;
    }

    // Process optional image fields: websiteDemo, mobileDemo, adminPanelImage.
    let websiteDemoUrl = req.body.websiteDemo || "";
    if (req.files?.websiteDemo?.[0]) {
        const websiteUpload = await uploadOnCloudinary(req.files.websiteDemo[0].path);
        websiteDemoUrl = websiteUpload?.url || websiteDemoUrl;
    }

    let mobileDemoUrl = req.body.mobileDemo || "";
    if (req.files?.mobileDemo?.[0]) {
        const mobileUpload = await uploadOnCloudinary(req.files.mobileDemo[0].path);
        mobileDemoUrl = mobileUpload?.url || mobileDemoUrl;
    }

    let adminPanelImageUrl = req.body.adminPanelImage || "";
    if (req.files?.adminPanelImage?.[0]) {
        const adminUpload = await uploadOnCloudinary(req.files.adminPanelImage[0].path);
        adminPanelImageUrl = adminUpload?.url || adminPanelImageUrl;
    }

    // Create the new portfolio entry; model validations will further enforce schema constraints.
    const newPortfolio = new Portfolio({
        slug,
        title,
        tagLine,
        projectScopeDescription,
        techStack: techStackArray,
        previewImage: previewImageUrl,
        websiteDemo: websiteDemoUrl,
        mobileDemo: mobileDemoUrl,
        adminPanelImage: adminPanelImageUrl,
    });

    const savedPortfolio = await newPortfolio.save();
    return res
        .status(201)
        .json(new ApiResponse(201, savedPortfolio, "Portfolio added successfully"));
});


// ----------- Updating Portfolio--------------

export const updatePortfolio = asyncHandler(async (req, res) => {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    // Update text fields from req.body
    const { slug, title, tagLine, projectScopeDescription, techStack } = req.body;
    if (slug) portfolio.slug = slug;
    if (title) portfolio.title = title;
    if (tagLine) portfolio.tagLine = tagLine;
    if (projectScopeDescription) portfolio.projectScopeDescription = projectScopeDescription;

    if (techStack) {
        let techStackArray = techStack;
        if (typeof techStack === "string") {
            try {
                techStackArray = JSON.parse(techStack);
                if (!Array.isArray(techStackArray)) {
                    techStackArray = [techStackArray];
                }
            } catch (err) {
                techStackArray = [techStack];
            }
        }
        portfolio.techStack = techStackArray;
    }

    // Process file uploads; if a file is provided, upload and update the corresponding field.
    if (req.files?.previewImage?.[0]) {
        const previewUpload = await uploadOnCloudinary(req.files.previewImage[0].path);
        if (previewUpload?.url) portfolio.previewImage = previewUpload.url;
    }
    if (req.files?.websiteDemo?.[0]) {
        const websiteUpload = await uploadOnCloudinary(req.files.websiteDemo[0].path);
        if (websiteUpload?.url) portfolio.websiteDemo = websiteUpload.url;
    }
    if (req.files?.mobileDemo?.[0]) {
        const mobileUpload = await uploadOnCloudinary(req.files.mobileDemo[0].path);
        if (mobileUpload?.url) portfolio.mobileDemo = mobileUpload.url;
    }
    if (req.files?.adminPanelImage?.[0]) {
        const adminUpload = await uploadOnCloudinary(req.files.adminPanelImage[0].path);
        if (adminUpload?.url) portfolio.adminPanelImage = adminUpload.url;
    }

    const updatedPortfolio = await portfolio.save();
    return res.status(200).json(new ApiResponse(200, updatedPortfolio, "Portfolio updated successfully"));
});

// ----------- Get Portfolio--------------
export const getPortfolios = asyncHandler(async (req, res) => {
    const portfolios = await Portfolio.find();
    return res.status(200).json(new ApiResponse(200, portfolios, "Portfolios fetched successfully"));
});

// ----------- Delete Portfolio--------------

export const deletePortfolio = asyncHandler(async (req, res) => {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }
    await portfolio.remove();
    return res.status(200).json(new ApiResponse(200, null, "Portfolio deleted successfully"));
});
