
import { createToStripe, getPaymentStatusFromStripe } from "../services/stripe.service.mjs";

export async function createPaymentIntent(req,res) {
  try {
    const { amount } = req.body;

    // NEVER trust the amount coming from the frontend
    // in a real application.
    //
    // Here we're accepting it only to keep this example simple.
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    const paymentIntent = await createToStripe(amount);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "Invalid paymentIntentId"
      });
    }

    const paymentIntent = await getPaymentStatusFromStripe(paymentIntentId);

    res.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error(error);

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
