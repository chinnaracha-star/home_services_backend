
import { createToStripe } from "../services/stripe.service.mjs";

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
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
}
