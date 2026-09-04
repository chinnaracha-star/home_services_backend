import { 
    checkout, 
    postOrderRepository, 
    postOrderItemRepository,
    getUserOrdersRepository,
    getOrderByIdRepository,
} from "../repositories/order.repository.mjs";
import { toScheduledAt } from "../utils/schedule.mjs";
import { getPaymentStatusFromStripe } from "./stripe.service.mjs";

class CheckoutError extends Error {
    constructor(stage, message, { statusCode = 500, code = "CHECKOUT_FAILED" } = {}) {
        super(message);
        this.name = "CheckoutError";
        this.stage = stage;
        this.statusCode = statusCode;
        this.code = code;
    }
}

function requirePositiveInteger(value, field) {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number <= 0) {
        throw new CheckoutError("validation", `${field} must be a positive whole number`, {
            statusCode: 400,
            code: "INVALID_CHECKOUT_DATA",
        });
    }
    return number;
}

function requireText(value, field) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new CheckoutError("validation", `${field} is required`, {
            statusCode: 400,
            code: "INVALID_CHECKOUT_DATA",
        });
    }
    return value.trim();
}

function requireCoordinate(value, field, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw new CheckoutError("validation", `${field} is required and must be a valid coordinate`, {
            statusCode: 400,
            code: "INVALID_CHECKOUT_DATA",
        });
    }
    return number;
}

async function verifyCardPayment(paymentIntentId, userId, totalAmount) {
    if (typeof paymentIntentId !== "string" || paymentIntentId.trim().length === 0) {
        throw new CheckoutError("payment", "paymentIntentId is required for card payments", {
            statusCode: 400,
            code: "INVALID_PAYMENT_DATA",
        });
    }

    const paymentIntent = await getPaymentStatusFromStripe(paymentIntentId.trim());
    if (paymentIntent.metadata?.userId !== String(userId)) {
        throw new CheckoutError("payment", "Payment access is denied", {
            statusCode: 403,
            code: "FORBIDDEN",
        });
    }

    if (paymentIntent.status !== "succeeded" || paymentIntent.amount !== Math.round(totalAmount * 100)) {
        throw new CheckoutError("payment", "Card payment could not be verified", {
            statusCode: 400,
            code: "PAYMENT_NOT_VERIFIED",
        });
    }
}

/**
 * Persists a completed (or pending PromptPay) checkout atomically.  A failure
 * rolls back the order, all order items, payment record, and promotion quota.
 */
export async function checkoutService(checkoutData, authenticatedUserId) {
    const userId = requirePositiveInteger(authenticatedUserId, "authenticated user ID");
    const serviceId = requirePositiveInteger(checkoutData.serviceId, "serviceId");
    const totalAmount = Number(checkoutData.totalAmount);
    const discount = Number(checkoutData.discount || 0);
    const paymentMethod = requireText(checkoutData.paymentMethod, "paymentMethod");
    const paymentStatus = requireText(checkoutData.paymentStatus, "paymentStatus");
    const serviceDate = requireText(checkoutData.serviceDate, "serviceDate");
    const serviceTime = requireText(checkoutData.serviceTime, "serviceTime");
    const address = requireText(checkoutData.address, "address");
    const province = requireText(checkoutData.province, "province");
    const district = requireText(checkoutData.district, "district");
    const subdistrict = requireText(checkoutData.subdistrict, "subdistrict");
    const latitude = requireCoordinate(checkoutData.latitude, "latitude", -90, 90);
    const longitude = requireCoordinate(checkoutData.longitude, "longitude", -180, 180);
    const items = checkoutData.items;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isFinite(discount) || discount < 0) {
        throw new CheckoutError("validation", "totalAmount must be a positive finite number and discount must be a non-negative finite number", {
            statusCode: 400,
            code: "INVALID_CHECKOUT_DATA",
        });
    }

    if (paymentMethod === "card") {
        if (paymentStatus !== "succeeded") {
            throw new CheckoutError("payment", "Card payments must be completed before checkout", {
                statusCode: 400,
                code: "PAYMENT_NOT_VERIFIED",
            });
        }
        await verifyCardPayment(checkoutData.paymentIntentId, userId, totalAmount);
    } else if (paymentMethod === "promptpay" && paymentStatus !== "pending") {
        throw new CheckoutError("payment", "PromptPay checkout must start as pending", {
            statusCode: 400,
            code: "INVALID_PAYMENT_DATA",
        });
    } else if (paymentMethod !== "card" && paymentMethod !== "promptpay") {
        throw new CheckoutError("payment", "paymentMethod is invalid", {
            statusCode: 400,
            code: "INVALID_PAYMENT_DATA",
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new CheckoutError("order_items", "At least one order item is required", {
            statusCode: 400,
            code: "INVALID_ORDER_ITEMS",
        });
    }

    const normalizedItems = items.map((item) => ({
        optionId: requirePositiveInteger(item.optionId, "items.optionId"),
        quantity: requirePositiveInteger(item.quantity, "items.quantity"),
        unitPrice: Number(item.unitPrice),
    }));

    if (normalizedItems.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
        throw new CheckoutError("order_items", "Each item must have a valid unitPrice", {
            statusCode: 400,
            code: "INVALID_ORDER_ITEMS",
        });
    }

    return checkout({
        userId,
        serviceId,
        totalAmount,
        discount,
        paymentMethod,
        paymentStatus,
        serviceDate,
        serviceTime,
        address,
        province,
        district,
        subdistrict,
        latitude,
        longitude,
        scheduledAt: toScheduledAt(serviceDate, serviceTime),
        information: typeof checkoutData.information === "string" ? checkoutData.information.trim() || null : null,
        promotionCode: typeof checkoutData.promotionCode === "string" ? checkoutData.promotionCode.trim() || null : null,
        items: normalizedItems,
    });
}


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

export async function getUserOrdersService(userId) {
    return getUserOrdersRepository(userId);
}

export async function getOrderByIdService(orderIdOrCode, userId) {
    return getOrderByIdRepository(orderIdOrCode, userId);
}
