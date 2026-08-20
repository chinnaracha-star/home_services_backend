import { Router } from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireTechnician } from "../middlewares/role.middleware.mjs";
import {
  getMyServiceRequests,
  getMyTechnicianJob,
  getMyTechnicianJobs,
  getMyTechnicianSettings,
  patchMyTechnicianLocation,
  patchMyTechnicianWorkspaceSettings,
  postAcceptServiceRequest,
  postDeclineServiceRequest,
  updateMyTechnicianSettings,
} from "../controllers/technician.controller.mjs";

const technicianRouter = Router();

technicianRouter.use(protect, requireTechnician);
technicianRouter.get("/me", getMyTechnicianSettings);
technicianRouter.patch("/me", updateMyTechnicianSettings);
technicianRouter.patch("/me/settings", patchMyTechnicianWorkspaceSettings);
technicianRouter.patch("/me/location", patchMyTechnicianLocation);
technicianRouter.get("/me/requests", getMyServiceRequests);
technicianRouter.post("/me/requests/:orderId/accept", postAcceptServiceRequest);
technicianRouter.post("/me/requests/:orderId/decline", postDeclineServiceRequest);
technicianRouter.get("/me/jobs", getMyTechnicianJobs);
technicianRouter.get("/me/jobs/:assignmentId", getMyTechnicianJob);

export { technicianRouter };
