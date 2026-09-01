import { 
    checkoutService, 
    postOrderService, 
    postOrderItemService,
    getUserOrdersService,
    getOrderByIdService,
} from "../services/order.service.mjs";

function hasValue(value) {
    return value !== undefined && value !== null && value !== "";
}

// ใช้อันนี้อันเดียว
export async function checkoutController(req, res) {
    try {
        const result = await checkoutService(req.body);

        return res.status(201).json({
            message: "Checkout recorded successfully",
            data: result,
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const stage = error.stage || "checkout";

        console.error(`Checkout failed during ${stage}:`, error);
        return res.status(status).json({
            message: error.message || "Server could not record checkout",
            code: error.code || "CHECKOUT_FAILED",
            stage,
        });
    }
}

// ไม่ได้ใช้
export async function postOrderController(req, res) {
    try {
        // Validate required fields
        const requiredFields = ['userId', 'serviceId', 'status', 'totAmount', 'serviceDate', 'serviceTime', 'adress', 'province', 'district', 'subdistrict'];
        const missingFields = requiredFields.filter(field => !hasValue(req.body[field]));
        
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

        const orderData = {
            user_id: req.body.userId,
            service_id: req.body.serviceId,
            status: req.body.status,
            total_price: req.body.totAmount,
            scheduled_date: req.body.serviceDate,
            scheduled_time: req.body.serviceTime,
            address: req.body.adress,
            province: req.body.province,
            district: req.body.district,
            subdistrict: req.body.subdistrict,
            additional_info: req.body.information || null,
            promotion_id: req.body.promotionCode || null,
            discount: req.body.discount || 0
        };

        const result = await postOrderService(orderData);
        
        return res.status(201).json({
            message: "Order created successfully",
            data: result
        });

    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({
            message: "Server could not create order",
            code: "ORDER_CREATION_FAILED",
            error: error.message
        });
    }
}


// ไม่ได้ใช้
export async function postOrderItemController(req, res) {
    try {
        // Validate required fields
        const requiredFields = ['option_id', 'order_id', 'quantity', 'price'];
        const missingFields = requiredFields.filter(field => !hasValue(req.body[field]));
        
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

        const orderItemData = {
            option_id: req.body.option_id,
            order_id: req.body.order_id,
            quantity: req.body.quantity,
            unit_price: req.body.price
        };

        const result = await postOrderItemService(orderItemData);
        
        return res.status(201).json({
            message: "Order item created successfully",
            data: result
        });

    } catch (error) {
        console.error("Error creating order item:", error);
        return res.status(500).json({
            message: "Server could not create order item",
            code: "ORDER_ITEM_CREATION_FAILED",
            error: error.message
        });
    }
}

export async function getUserOrdersController(req, res) {
    try {
        const userId = req.user?.id || req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized",
                code: "UNAUTHORIZED",
            });
        }

        const orders = await getUserOrdersService(userId);
        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(500).json({
            message: "Server could not fetch user orders",
            code: "ORDER_FETCH_FAILED",
            error: error.message,
        });
    }
}

export async function getOrderByIdController(req, res) {
    try {
        const userId = req.user?.id || req.headers["x-user-id"];
        const orderIdOrCode = req.params.id;

        const order = await getOrderByIdService(orderIdOrCode, userId);
        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                code: "NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        return res.status(500).json({
            message: "Server could not fetch order",
            code: "ORDER_FETCH_FAILED",
            error: error.message,
        });
    }
}
