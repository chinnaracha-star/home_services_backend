import { Router } from "express";
import { getPromotionController, updatePromotionQuotaController } from "../controllers/promotion.controller.mjs";
import { validateIdParam } from "../validators/promotion.validator.mjs";
import { protect } from "../middlewares/protect.middleware.mjs";

const promotionRouter = Router();

// GET /api/promotions - Get all active promotions (public)
promotionRouter.get("/", getPromotionController);

// PUT /api/promotions/:id/quota - Update promotion quota (protected - user must be authenticated)
promotionRouter.put("/:id/quota", updatePromotionQuotaController);

export default promotionRouter;
