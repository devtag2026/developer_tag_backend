import express from "express";
import { generateProposal } from "../controllers/proposal.controller.js";

const router = express.Router();

router.post("/generate-proposal", generateProposal);

export default router;