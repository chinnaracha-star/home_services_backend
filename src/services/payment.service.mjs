import { postPaymentRepository } from "../repositories/payment.repository.mjs";


export async function postPaymentService(paymentData) {
    
    const result = await postPaymentRepository(paymentData);
    
    if(!result) {
        throw new Error("Payment was not recorded");   
    }

    return result;
}