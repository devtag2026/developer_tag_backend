import { Router } from "express";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from "../controllers/testimonial.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/").get(verifyJWT, getTestimonials);

router.route("/")
    .post(verifyJWT, upload.fields([{ name: "testimonialImg", maxCount: 1 }]), addTestimonial);

router.route("/:id")
    .patch(verifyJWT, upload.fields([{ name: "testimonialImg", maxCount: 1 }]), updateTestimonial);



router.route("/:id").delete(verifyJWT, deleteTestimonial);

export default router;
