import { Router } from "express";

import { createPaymentIntent, getPaymentStatus } from "../controllers/payment.controller.mjs";
import { protect } from "../middlewares/protect.middleware.mjs";

const paymentRouter = Router();

// Note: Router is mounted at /api/payments in app.mjs

// POST /api/payments/intent - Create payment intent (protected - user must be authenticated)
paymentRouter.post("/intent", protect, createPaymentIntent);

// GET /api/payments/status/:paymentIntentId - Get payment status (protected - user must be authenticated)
paymentRouter.get("/status/:paymentIntentId", protect, getPaymentStatus);


// POST /api/payment/post - Record created payment to DB
paymentRouter.post("/post", postPayment);

export default paymentRouter;