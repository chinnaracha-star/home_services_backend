import { Router } from "express";
import { loginTechnician } from "../controllers/technician-auth.controller.mjs";

const technicianAuthRouter = Router();

technicianAuthRouter.post("/login", loginTechnician);

export { technicianAuthRouter };
