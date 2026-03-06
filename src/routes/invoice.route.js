// import { Router } from "express";
// import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

// // Controllers will be implemented on Day 4
// import {
//     getAllInvoices,
//     getInvoiceById,
//     createInvoice,
//     updateInvoiceStatus,
//     getUnpaidInvoices,
//     deleteInvoice,
// } from "../controllers/invoice.controller.js";

// const router = Router();

// // ─── Admin Routes ────────────────────────────────────────────────────────────
// router
//     .route("/")
//     .get(verifyJWT, authorizeRoles("admin"), getAllInvoices)
//     .post(verifyJWT, authorizeRoles("admin"), createInvoice);

// router
//     .route("/unpaid")
//     .get(verifyJWT, authorizeRoles("admin"), getUnpaidInvoices);

// router
//     .route("/:id")
//     .get(verifyJWT, authorizeRoles("admin"), getInvoiceById)
//     .delete(verifyJWT, authorizeRoles("admin"), deleteInvoice);

// router
//     .route("/:id/status")
//     .patch(verifyJWT, authorizeRoles("admin"), updateInvoiceStatus);

// export default router;