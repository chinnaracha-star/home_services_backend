import { Router } from "express";

import { createPaymentIntent, getPaymentStatus } from "../controllers/payment.controller.mjs";
import { protect } from "../middlewares/protect.middleware.mjs";
// apply protect middleware later

const paymentRouter = Router();


// POST /create-payment-intent
paymentRouter.post(
  "/create-payment-intent",
  createPaymentIntent
);

// GET /payment-status/:paymentIntentId
paymentRouter.get(
  "/payment-status/:paymentIntentId",
  getPaymentStatus
);


export default paymentRouter;