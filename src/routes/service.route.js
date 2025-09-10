import { Router } from "express";
import { createService, updateService, deleteService, listServices } from "../controllers/service.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public
router.get("/", listServices);

// Admin
router.post("/", verifyJWT, upload.fields([{ name: "image", maxCount: 1 }]), createService);
router.patch("/:id", verifyJWT, upload.fields([{ name: "image", maxCount: 1 }]), updateService);
router.delete("/:id", verifyJWT, deleteService);

export default router;


