import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
    getReminderLogs,
    getReminderLogsByInvoice,
    getReminderSettings,
    updateReminderSettings,
    toggleReminders,
    triggerManualReminder,
} from "../controllers/reminder.controller.js";

const router = Router();

// ─── Admin Routes ────────────────────────────────────────────────────────────
router
    .route("/logs")
    .get(verifyJWT, authorizeRoles("admin"), getReminderLogs);

router
    .route("/logs/:invoiceId")
    .get(verifyJWT, authorizeRoles("admin"), getReminderLogsByInvoice);

router
    .route("/settings")
    .get(verifyJWT, authorizeRoles("admin"), getReminderSettings)
    .patch(verifyJWT, authorizeRoles("admin"), updateReminderSettings);

router
    .route("/toggle")
    .patch(verifyJWT, authorizeRoles("admin"), toggleReminders);

// Manually trigger a reminder for a specific invoice (useful for testing)
router
    .route("/trigger/:invoiceId")
    .post(verifyJWT, authorizeRoles("admin"), triggerManualReminder);

export default router;