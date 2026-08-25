import { postOrderRepository, postOrderItemRepository } from "../repositories/order.repository.mjs";


export async function postOrderService(orderData) {
    
    const result = await postOrderRepository(orderData);
    
    if(!result) {
        throw new Error("Order was not created");   
    }

    return result;
}


export async function postOrderItemService(orderItemData) {
    
    const result = await postOrderItemRepository(orderItemData);
    
    if(!result) {
        throw new Error("Order item was not created");   
    }

    return result;
}