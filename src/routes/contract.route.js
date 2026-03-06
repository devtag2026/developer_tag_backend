import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

import {
    createContract,
    getAllContracts,
    getContractById,
    updateContractStatus,
    sendContract,
    downloadContract,
    duplicateContract,
    deleteContract,
} from "../controllers/contract.controller.js";

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
// Client-facing contract view (accessed via emailed link — token-based, no JWT)
router.get("/view/:id", getContractById);

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

export default router;