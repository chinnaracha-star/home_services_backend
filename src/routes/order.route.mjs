import { Router } from "express";
import { 
  checkoutController, 
  postOrderController, 
  postOrderItemController,
  getUserOrdersController,
  getOrderByIdController,
} from "../controllers/order.controller.mjs";

import { protect } from "../middlewares/protect.middleware.mjs";

const orderRouter = Router();

// GET /api/orders - get all orders for the current user
orderRouter.get("/", protect, getUserOrdersController);

// GET /api/orders/:id - get single order by ID or order code
orderRouter.get("/:id", protect, getOrderByIdController);

// POST /api/orders/checkout - create every checkout record in one transaction
orderRouter.post("/checkout", protect, checkoutController);

// POST /api/orders
orderRouter.post("/", protect, postOrderController);

// PUT /api/order-item
orderRouter.post("/order-item", protect, postOrderItemController);

export default orderRouter;

