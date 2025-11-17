import { Router } from "express";
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, getLatestTestimonial, getTotalTestimonials, getTestimonialById } from "../controllers/testimonial.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/all-testimonial").get(getTestimonials);
router.route("/latest-testimonial").get(verifyJWT, authorizeRoles("admin"), getLatestTestimonial);
router.route("/total-testimonial").get(verifyJWT, authorizeRoles("admin"), getTotalTestimonials);

router
  .route("/")
  .post(
    verifyJWT,
    authorizeRoles("admin"),
    addTestimonial 
  );

router
  .route("/:id")
  .get(verifyJWT, authorizeRoles("admin"), getTestimonialById)
  .patch(
    verifyJWT,
    authorizeRoles("admin"),
    updateTestimonial 
  )
  .delete(verifyJWT, authorizeRoles("admin"), deleteTestimonial);

export default router;
