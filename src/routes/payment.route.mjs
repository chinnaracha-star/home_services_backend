import { Router } from "express";

import { createPaymentIntent, getPaymentStatus, postPaymentController } from "../controllers/payment.controller.mjs";

const paymentRouter = Router();

// Note: Router is mounted at /api/payments in app.mjs

// Public Stripe endpoints. The checkout flow does not require a signed-in user.
paymentRouter.post("/intent", createPaymentIntent);

paymentRouter.get("/status/:paymentIntentId", getPaymentStatus);


// POST /api/payment/post - Record created payment to DB
paymentRouter.post("/post", postPaymentController);

export default paymentRouter;
