import { Router } from "express";
import { checkoutController, postOrderController, postOrderItemController } from "../controllers/order.controller.mjs";

import { protect } from "../middlewares/protect.middleware.mjs";

const orderRouter = Router();

// POST /api/orders/checkout - create every checkout record in one transaction
orderRouter.post("/checkout", checkoutController);

// POST /api/orders
orderRouter.post("/", postOrderController);

// PUT /api/order-item
orderRouter.post("/order-item", postOrderItemController);

export default orderRouter;
