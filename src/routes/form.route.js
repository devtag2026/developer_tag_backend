import { Router } from "express";
import { submitServiceRequest, submitQuestion, getAllFormSubmissions, getFormStatistics } from "../controllers/form.controller.js";
import { validateServiceRequest, validateQuestion } from "../middlewares/form.middleware.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public endpoints
router.post("/service-request", validateServiceRequest, submitServiceRequest);
router.post("/question", validateQuestion, submitQuestion);

// Admin endpoints
router.get("/", verifyJWT, authorizeRoles("admin"), getAllFormSubmissions);
router.get("/stats", verifyJWT, authorizeRoles("admin"), getFormStatistics);

export default router;


