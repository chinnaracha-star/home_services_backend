import express from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireAdmin } from "../middlewares/role.middleware.mjs";
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../controllers/admin-promotion.controller.mjs";
import {
  validateCreatePromotion,
  validateUpdatePromotion,
  validateIdParam,
} from "../validators/promotion.validator.mjs";

export const adminPromotionRouter = express.Router();

// ป้องกันทุก route ในโปรโมชั่นด้วย protect และ requireAdmin
adminPromotionRouter.use(protect, requireAdmin);

adminPromotionRouter.get("/", getPromotions);
adminPromotionRouter.get("/:id", validateIdParam, getPromotionById);
adminPromotionRouter.post("/", validateCreatePromotion, createPromotion);
adminPromotionRouter.patch("/:id", validateUpdatePromotion, updatePromotion);
adminPromotionRouter.delete("/:id", validateIdParam, deletePromotion);

export default adminPromotionRouter;
