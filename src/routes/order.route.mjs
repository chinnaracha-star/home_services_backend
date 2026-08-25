import { Router } from "express";
import { postOrderController, postOrderItemController } from "../controllers/order.controller.mjs";

import { protect } from "../middlewares/protect.middleware.mjs";

const orderRouter = Router();

// POST /api/orders
orderRouter.post("/", postOrderController);

// PUT /api/order-item
orderRouter.post("/order-item", postOrderItemController);

export default orderRouter;