import { Router } from "express";
import { 
    getCareers, 
    getCareerById,
    getActiveCareers,
    addCareer, 
    updateCareer, 
    deleteCareer, 
    getTotalCareers 
} from "../controllers/career.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/public").get(getActiveCareers); // Get active careers (public)
router.route("/public/:id").get(getCareerById); // Get single career by ID (public)

// Admin routes
router.route("/")
    .get(verifyJWT, authorizeRoles("admin"), getCareers)
    .post(verifyJWT, authorizeRoles("admin"), addCareer);

router.route("/total").get(verifyJWT, authorizeRoles("admin"), getTotalCareers);

router.route("/:id")
    .get(verifyJWT, authorizeRoles("admin"), getCareerById)
    .patch(verifyJWT, authorizeRoles("admin"), updateCareer)
    .delete(verifyJWT, authorizeRoles("admin"), deleteCareer);

export default router;

