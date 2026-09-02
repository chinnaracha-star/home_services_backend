
import Stripe from "stripe";

export async function createToStripe(amount, userId) {
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const response = await stripe.paymentIntents.create({
        amount: amount,
        currency: "thb",
        payment_method_types: ["card"],
        metadata: { userId: String(userId) },
        });

    return response
}

export async function getPaymentStatusFromStripe(paymentIntentId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const response = await stripe.paymentIntents.retrieve(paymentIntentId);

    return response
}
