import { Router } from "express";

import { createPaymentIntent, getPaymentStatus, postPaymentController } from "../controllers/payment.controller.mjs";
import { protect } from "../middlewares/protect.middleware.mjs";

const paymentRouter = Router();

// Note: Router is mounted at /api/payments in app.mjs.
paymentRouter.post("/intent", protect, createPaymentIntent);

paymentRouter.get("/status/:paymentIntentId", protect, getPaymentStatus);

// POST /api/payments/post - Record created payment to DB
paymentRouter.post("/post", protect, postPaymentController);

export default paymentRouter;
