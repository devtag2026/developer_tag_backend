import { Router } from "express";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, getLatestTestimonial, getTotalTestimonials } from "../controllers/testimonial.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/").get(verifyJWT, authorizeRoles("admin"), getTestimonials);
router.route("/all-testimonial").get(getTestimonials);
router.route("/latest-testimonial").get(verifyJWT, authorizeRoles("admin"), getLatestTestimonial);
router.route("/total-testimonial").get(verifyJWT, authorizeRoles("admin"), getTotalTestimonials);

router.route("/")
    .post(verifyJWT, authorizeRoles("admin"), upload.fields([{ name: "testimonialImg", maxCount: 1 }]), addTestimonial);

router.route("/:id")
    .patch(verifyJWT, authorizeRoles("admin"), upload.fields([{ name: "testimonialImg", maxCount: 1 }]), updateTestimonial);



router.route("/:id").delete(verifyJWT, authorizeRoles("admin"), deleteTestimonial);

export default router;
