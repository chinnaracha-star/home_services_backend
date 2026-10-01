
import Stripe from "stripe";

export async function createToStripe(amount, userId, idempotencyKey) {
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const response = await stripe.paymentIntents.create(
        {
            amount,
            currency: "thb",
            payment_method_types: ["card"],
            metadata: { userId: String(userId) },
        },
        { idempotencyKey: `checkout:${userId}:${idempotencyKey}` },
    );

    return response
}

export async function getPaymentStatusFromStripe(paymentIntentId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const response = await stripe.paymentIntents.retrieve(paymentIntentId);

    return response
}
