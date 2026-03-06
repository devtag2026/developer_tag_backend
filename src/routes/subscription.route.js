import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

import {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    cancelSubscription,
    pauseSubscription,
    sendSubscriptionInvitation,
    getSubscriptionStats,
    stripeWebhook,
} from "../controllers/subscription.controller.js";

const router = Router();

// ─── Stripe Webhook (raw body — must be before express.json middleware) ───────
// Mount this in app.js BEFORE body parsers using express.raw()
router.post(
    "/webhook",
    stripeWebhook
);


router
    .route("/")
    .get(verifyJWT, authorizeRoles("admin"), getAllSubscriptions)
    .post(verifyJWT, authorizeRoles("admin"), createSubscription);

router
    .route("/stats")
    .get(verifyJWT, authorizeRoles("admin"), getSubscriptionStats);

router
    .route("/:id")
    .get(verifyJWT, authorizeRoles("admin"), getSubscriptionById);

router
    .route("/:id/cancel")
    .patch(verifyJWT, authorizeRoles("admin"), cancelSubscription);

router
    .route("/:id/pause")
    .patch(verifyJWT, authorizeRoles("admin"), pauseSubscription);

router
    .route("/:id/invite")
    .post(verifyJWT, authorizeRoles("admin"), sendSubscriptionInvitation);

export default router;