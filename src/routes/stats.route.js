import { Router } from "express";
import { getOverallStats } from "../controllers/stats.controller.js";

const router = Router();

// Public endpoint to fetch overall stats
router.get("/", getOverallStats);

export default router;


