import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

import {
    createContract,
    getAllContracts,
    getContractById,
    getContractByToken,
    respondToContract,
    updateContractStatus,
    sendContract,
    downloadContract,
    duplicateContract,
    deleteContract,
    acceptContract,
    rejectContract,
    getContractStatus,
    createMilestoneCheckout,
    redirectToMilestoneCheckout,
    verifyContractPayment,
    completeMilestone,
} from "../controllers/contract.controller.js";

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
// Client-facing contract view (accessed via emailed link — token-based, no JWT)
router.get("/view/:id", getContractById);
router.get("/token/:accessToken", getContractByToken);
router.post("/token/:accessToken/respond", respondToContract);
router.post("/token/:accessToken/milestones/:milestoneId/checkout", createMilestoneCheckout);
router.get("/token/:accessToken/milestones/:milestoneId/checkout-redirect", redirectToMilestoneCheckout);
router.post("/token/:accessToken/verify-payment", verifyContractPayment);

// ─── Admin Routes ────────────────────────────────────────────────────────────
router
    .route("/")
    .get(verifyJWT, authorizeRoles("admin"), getAllContracts)
    .post(verifyJWT, authorizeRoles("admin"), createContract);

router
    .route("/:id")
    .get(verifyJWT, authorizeRoles("admin"), getContractById)
    .delete(verifyJWT, authorizeRoles("admin"), deleteContract);

router
    .route("/:id/status")
    .patch(verifyJWT, authorizeRoles("admin"), updateContractStatus);

router
    .route("/:id/send")
    .post(verifyJWT, authorizeRoles("admin"), sendContract);

router
    .route("/:id/download")
    .get(verifyJWT, authorizeRoles("admin"), downloadContract);

router
    .route("/:id/duplicate")
    .post(verifyJWT, authorizeRoles("admin"), duplicateContract);

router
    .route("/:id/milestones/:milestoneId/complete")
    .patch(verifyJWT, authorizeRoles("admin"), completeMilestone);

router
    .route("/:id/accept")
    .post(verifyJWT, authorizeRoles("admin"), acceptContract);

router
    .route("/:id/reject")
    .post(verifyJWT, authorizeRoles("admin"), rejectContract);

router
    .route("/:id/status")
    .get(verifyJWT, authorizeRoles("admin"), getContractStatus);

export default router;
