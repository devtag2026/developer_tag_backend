import { Router } from "express";
import { getPortfolios, addPortfolio, updatePortfolio, deletePortfolio, getTotalPortfolios, getLatestPortfolio } from "../controllers/portfolio.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/").get(verifyJWT, authorizeRoles("admin"), getPortfolios);
router.route("/all-portfolio").get(getPortfolios);
router.route("/total-portfolio").get(verifyJWT, authorizeRoles("admin"), getTotalPortfolios);
router.route("/latest-portfolio").get(verifyJWT, authorizeRoles("admin"), getLatestPortfolio);


router.route("/")
    .post(
        verifyJWT,
        authorizeRoles("admin"),
        upload.fields([
            { name: "previewImage", maxCount: 1 },
            { name: "websiteDemo", maxCount: 1 },
            { name: "mobileDemo", maxCount: 1 },
            { name: "adminPanelImage", maxCount: 1 },
        ]),
        addPortfolio
    );

router.route("/:id").patch(
    verifyJWT,
    authorizeRoles("admin"),
    upload.fields([
        { name: "previewImage", maxCount: 1 },
        { name: "websiteDemo", maxCount: 1 },
        { name: "mobileDemo", maxCount: 1 },
        { name: "adminPanelImage", maxCount: 1 },
    ]),
    updatePortfolio
);


router.route("/:id").delete(verifyJWT, authorizeRoles("admin"), deletePortfolio);

export default router;
