import Portfolio from "../models/portfolio.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



// ----------- Adding Portfolio --------------
export const addPortfolio = asyncHandler(async (req, res) => {
    const { slug, title, tagLine, projectScopeDescription, techStack } = req.body;
    console.log(req.body);

    // Ensure required fields are present.
    if (!slug || !title || !tagLine || !projectScopeDescription || !techStack) {
        throw new ApiError(400, "Missing required fields");
    }

    // Ensure the authenticated user exists.
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User information not found");
    }

    // Process techStack to ensure it's an array of objects { tech: "..." }.
    let techStackArray = techStack;
    if (typeof techStack === "string") {
        try {
            techStackArray = JSON.parse(techStack);
            if (!Array.isArray(techStackArray)) {
                techStackArray = techStack.split(",").filter(Boolean);
            }
        } catch (err) {
            techStackArray = techStack.split(",").filter(Boolean);
        }
    }
    // Map each element: if already an object with a tech property, use it; otherwise, wrap it.
    techStackArray = techStackArray.map((tech) => {
        if (typeof tech === "object" && tech !== null && tech.tech) {
            return { tech: String(tech.tech).trim() };
        } else {
            return { tech: String(tech).trim() };
        }
    });

    // Process file upload for previewImage.
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

    // Create the new portfolio entry with the authenticated user's _id.
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
        user: req.user._id, // Attach user reference.
    });

    const savedPortfolio = await newPortfolio.save();
    return res
        .status(201)
        .json(new ApiError(201, savedPortfolio, "Portfolio added successfully"));
});



// ----------- Updating Portfolio --------------
export const updatePortfolio = asyncHandler(async (req, res) => {
    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    // Ensure that the authenticated user is the owner.
    if (String(portfolio.user) !== String(req.user._id)) {
        throw new ApiError(403, "Forbidden: You do not have permission to update this portfolio");
    }

    // Update text fields from req.body.
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
                    techStackArray = techStack.split(",").filter(Boolean);
                }
            } catch (err) {
                techStackArray = techStack.split(",").filter(Boolean);
            }
        }
        // For each element, if it is already an object with a `tech` property, simply trim it;
        // otherwise, wrap it into an object.
        techStackArray = techStackArray.map((tech) => {
            if (typeof tech === "object" && tech !== null && tech.tech) {
                return { tech: String(tech.tech).trim() };
            } else {
                return { tech: String(tech).trim() };
            }
        });
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
    return res
        .status(200)
        .json(new ApiError(200, updatedPortfolio, "Portfolio updated successfully"));
});




// ----------- Get Portfolio --------------
export const getPortfolios = asyncHandler(async (req, res) => {
    const portfolios = await Portfolio.find().populate("user", "fullName email");
    return res.status(200).json(new ApiResponse(200, portfolios, "Portfolios fetched successfully"));
});

// ----------- Delete Portfolio --------------
export const deletePortfolio = asyncHandler(async (req, res) => {
    // Use the static method on the Portfolio model
    const deletedPortfolio = await Portfolio.findByIdAndDelete(req.params.id);

    if (!deletedPortfolio) {
        throw new ApiError(404, "Portfolio not found");
    }

    return res.status(200).json({
        status: 200,
        data: {},
        message: "Portfolio deleted successfully"
    });
});

export const getLatestPortfolio = asyncHandler(async (req, res) => {
    const latestPortfolio = await Portfolio.findOne().sort({ createdAt: -1 }).populate("user", "fullName email");

    if (!latestPortfolio) {
        throw new ApiError(404, "No portfolio found");
    }

    return res.status(200).json(new ApiResponse(200, latestPortfolio, "Latest portfolio fetched successfully"));
});


export const getTotalPortfolios = asyncHandler(async (req, res) => {
    const totalPortfolios = await Portfolio.countDocuments();

    return res.status(200).json(new ApiResponse(200, { total: totalPortfolios }, "Total number of portfolios fetched successfully"));
});
