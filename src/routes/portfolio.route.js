import { Router } from "express";
import { getPortfolios, addPortfolio, updatePortfolio, deletePortfolio } from "../controllers/portfolio.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/").get(verifyJWT, getPortfolios);


router.route("/")
    .post(
        verifyJWT,  // Require authentication
        upload.fields([
            { name: "previewImage", maxCount: 1 },
            { name: "websiteDemo", maxCount: 1 },
            { name: "mobileDemo", maxCount: 1 },
            { name: "adminPanelImage", maxCount: 1 },
        ]),
        addPortfolio
    );

router.route("/:id").patch(
    verifyJWT, // Require authentication
    upload.fields([
        { name: "previewImage", maxCount: 1 },
        { name: "websiteDemo", maxCount: 1 },
        { name: "mobileDemo", maxCount: 1 },
        { name: "adminPanelImage", maxCount: 1 },
    ]),
    updatePortfolio
);


router.route("/:id").delete(verifyJWT, deletePortfolio);

export default router;
