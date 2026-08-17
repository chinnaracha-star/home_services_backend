import express from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireAdmin } from "../middlewares/role.middleware.mjs";
import {
  getAdminServices,
  getAdminServiceById,
  handleCreateAdminService,
  handleUpdateAdminService,
  handleDeleteAdminService,
  handleReorderAdminServices,
} from "../controllers/admin-service.controller.mjs";
import {
  validateIdParam,
  validateCreateService,
  validateUpdateService,
  validateReorderServices,
} from "../validators/admin-service.validator.mjs";

export const adminServiceRouter = express.Router();

// ป้องกันทุก route ในหมวดหมู่นี้ด้วย protect และ requireAdmin
adminServiceRouter.use(protect, requireAdmin);

adminServiceRouter.get("/", getAdminServices);
adminServiceRouter.patch("/reorder", validateReorderServices, handleReorderAdminServices);
adminServiceRouter.get("/:id", validateIdParam, getAdminServiceById);
adminServiceRouter.post("/", validateCreateService, handleCreateAdminService);
adminServiceRouter.put("/:id", validateUpdateService, handleUpdateAdminService);
adminServiceRouter.patch("/:id", validateUpdateService, handleUpdateAdminService);
adminServiceRouter.delete("/:id", validateIdParam, handleDeleteAdminService);

export default adminServiceRouter;
