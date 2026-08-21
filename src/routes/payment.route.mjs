import { Router } from "express";

import { createPaymentIntent } from "../controllers/payment.controller.mjs";


const paymentRouter = Router();


// POST /create-payment-intent
paymentRouter.post(
  "/create-payment-intent",
  createPaymentIntent
);


export default paymentRouter;