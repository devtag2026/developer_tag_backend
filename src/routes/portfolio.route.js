import { Router } from "express";
import { 
    getPortfolios, 
    getPortfoliosByCategory, 
    getPortfoliosGroupedByCategory,
    getPortfolioById,
    getFeaturedPortfolios,
    addPortfolio, 
    updatePortfolio, 
    deletePortfolio, 
    getTotalPortfolios 
} from "../controllers/portfolio.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/public").get(getPortfolios); // Get all portfolios (public)
router.route("/public/grouped").get(getPortfoliosGroupedByCategory); // Get portfolios grouped by category (public)
router.route("/public/featured").get(getFeaturedPortfolios); // Get featured portfolios (public)
router.route("/public/category/:category").get(getPortfoliosByCategory); // Get portfolios by category (public)
router.route("/public/:id").get(getPortfolioById); // Get single portfolio by ID (public)

// Admin routes
router.route("/")
    .get(verifyJWT, authorizeRoles("admin"), getPortfolios)
    .post(
        verifyJWT,
        authorizeRoles("admin"),
        upload.fields([
            { name: "image", maxCount: 1 },
        ]),
        addPortfolio
    );

router.route("/total").get(verifyJWT, authorizeRoles("admin"), getTotalPortfolios);

router.route("/:id")
    .get(verifyJWT, authorizeRoles("admin"), getPortfolioById)
    .patch(
        verifyJWT,
        authorizeRoles("admin"),
        upload.fields([
            { name: "image", maxCount: 1 },
        ]),
        updatePortfolio
    )
    .delete(verifyJWT, authorizeRoles("admin"), deletePortfolio);

export default router;
