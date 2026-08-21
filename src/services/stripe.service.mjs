
import Stripe from "stripe";

export async function createToStripe(amount) {
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const response = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",

        automatic_payment_methods: {
            enabled: true
        }
        });

    return response
}