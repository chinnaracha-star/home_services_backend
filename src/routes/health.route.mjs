import { Router } from "express";
import { getHealth } from "../controllers/health.controller.mjs";

const healthRouter = Router();

healthRouter.get("/", getHealth);

export { healthRouter };
