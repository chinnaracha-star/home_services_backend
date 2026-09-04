
import { createToStripe, getPaymentStatusFromStripe } from "../services/stripe.service.mjs";
import { postPaymentService } from "../services/payment.service.mjs";
import { getOrderByIdService } from "../services/order.service.mjs";

function getAuthenticatedUserId(req) {
  const userId = Number(req.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }
  return userId;
}



export async function createPaymentIntent(req,res) {
  try {
    const { amount } = req.body;
    const userId = getAuthenticatedUserId(req);

    // NEVER trust the amount coming from the frontend
    // in a real application.
    //
    // Here we're accepting it only to keep this example simple.
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Send a positive whole number in satang."
      });
    }

    const paymentIntent = await createToStripe(amount, userId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error(error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { paymentIntentId } = req.params;
    const userId = getAuthenticatedUserId(req);

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "Invalid paymentIntentId"
      });
    }

    const paymentIntent = await getPaymentStatusFromStripe(paymentIntentId);
    if (paymentIntent.metadata?.userId !== String(userId)) {
      return res.status(403).json({
        error: "Payment access is denied",
        code: "FORBIDDEN",
      });
    }

    res.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error(error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    }

    // Stripe throws this when the id doesn't correspond to an existing PaymentIntent
    if (error.code === "resource_missing") {
      return res.status(404).json({
        error: "Payment not found"
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
}





export async function postPaymentController(req, res) {
    try {
        const { order_id, paymentMethod, paymentStatus, amount } = req.body;
      const userId = getAuthenticatedUserId(req);

        const requiredFields = ['order_id', 'paymentMethod', 'paymentStatus', 'amount'];
        const missingFields = requiredFields.filter(field =>
            req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
        );
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Missing required fields",
                code: "MISSING_FIELDS",
                errors: missingFields.map(field => ({
                    field,
                    message: `${field} is required`
                }))
            });
        }

        if (!Number.isSafeInteger(order_id) || order_id <= 0) {
            return res.status(400).json({
                message: "order_id must be a positive whole number",
                code: "INVALID_ORDER_ID"
            });
        }

          const order = await getOrderByIdService(order_id, userId);
          if (!order) {
            return res.status(403).json({
              message: "Order not found or access is denied",
              code: "FORBIDDEN",
            });
          }

        if (typeof paymentMethod !== 'string' || typeof paymentStatus !== 'string') {
            return res.status(400).json({
                message: "paymentMethod and paymentStatus must be strings",
                code: "INVALID_PAYMENT_DATA"
            });
        }

        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "amount must be a positive number",
                code: "INVALID_AMOUNT"
            });
        }

        const paymentData = {
            order_id,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            amount
        };

        const result = await postPaymentService(paymentData);
        
        return res.status(201).json({
            message: "Payment recorded successfully",
            data: result
        });

    } catch (error) {
        console.error("Error recording payment:", error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code,
        });
      }
        return res.status(500).json({
            message: "Server could not record payment",
            code: "PAYMENT_RECORD_FAILED",
            error: error.message
        });
    }
}
