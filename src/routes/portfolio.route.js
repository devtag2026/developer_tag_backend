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
import { upload, logMulterResult } from "../middlewares/multer.middleware.js";

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
        (req, res, next) => {
            console.log("🔵 [ROUTE] POST /portfolio route hit");
            console.log("🔵 [ROUTE] Request headers:", {
                'content-type': req.headers['content-type'],
                'content-length': req.headers['content-length'],
                'authorization': req.headers['authorization'] ? 'present' : 'missing'
            });
            next();
        },
        verifyJWT,
        (req, res, next) => {
            console.log("🔵 [ROUTE] JWT verification passed");
            next();
        },
        authorizeRoles("admin"),
        (req, res, next) => {
            console.log("🔵 [ROUTE] Admin authorization passed");
            next();
        },
        upload.fields([
            { name: "image", maxCount: 1 },
        ]),
        logMulterResult,
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
