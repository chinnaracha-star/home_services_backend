import { Router } from "express";
import { getPromotionController, updatePromotionQuotaController } from "../controllers/promotion.controller.mjs";
import { validateIdParam } from "../validators/promotion.validator.mjs";

const promotionRouter = Router();

promotionRouter.get("/promotion", getPromotionController);
promotionRouter.put("/updatepromotion/:id", updatePromotionQuotaController);


export default promotionRouter;
