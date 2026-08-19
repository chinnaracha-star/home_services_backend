import { Router } from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireTechnician } from "../middlewares/role.middleware.mjs";
import {
  getMyTechnicianSettings,
  updateMyTechnicianSettings,
} from "../controllers/technician.controller.mjs";

const technicianRouter = Router();

technicianRouter.use(protect, requireTechnician);
technicianRouter.get("/me", getMyTechnicianSettings);
technicianRouter.patch("/me", updateMyTechnicianSettings);

export { technicianRouter };
