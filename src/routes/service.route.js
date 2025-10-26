import { Router } from "express";
import { 
    createService, 
    updateService, 
    deleteService, 
    listServices,
    getServiceById,
    getServiceBySlug,
    getServicesByCategory
} from "../controllers/service.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public Routes
router.get("/", listServices);
router.get("/category/:category", getServicesByCategory);
router.get("/slug/:slug", getServiceBySlug);
router.get("/:id", getServiceById);

// Admin Routes
router.post(
    "/", 
    verifyJWT, 
    authorizeRoles("admin"), 
    upload.fields([
        { name: "heroImage", maxCount: 1 }
    ]), 
    createService
);

router.patch(
    "/:id", 
    verifyJWT, 
    authorizeRoles("admin"), 
    upload.fields([
        { name: "heroImage", maxCount: 1 }
    ]), 
    updateService
);

router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteService);

export default router;
