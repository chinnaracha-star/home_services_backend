import { pool, runTransaction } from "../configs/db.mjs";

function checkoutError(stage, message, { statusCode = 500, code = "CHECKOUT_FAILED" } = {}) {
    const error = new Error(message);
    error.stage = stage;
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

export async function checkout(checkoutData) {
    return runTransaction(async (client) => {
        let promotion = null;

        if (checkoutData.promotionCode) {
            const promotionResult = await client.query(
                `SELECT promotion_id, quota, quota_used
                 FROM promotions
                 WHERE UPPER(promotion_code) = UPPER($1) AND status = 'active'
                 FOR UPDATE`,
                [checkoutData.promotionCode],
            );
            promotion = promotionResult.rows[0];

            if (!promotion) {
                throw checkoutError("promotion", "Promotion code was not found or is inactive", {
                    statusCode: 400,
                    code: "INVALID_PROMOTION",
                });
            }

            if (Number(promotion.quota_used) >= Number(promotion.quota)) {
                throw checkoutError("promotion", "Promotion code quota has been reached", {
                    statusCode: 409,
                    code: "PROMOTION_QUOTA_EXCEEDED",
                });
            }
        }

        let order;
        try {
            const result = await client.query(
                `INSERT INTO orders
                    (user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount)
                 VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [checkoutData.userId, checkoutData.serviceId, checkoutData.totalAmount, checkoutData.serviceDate,
                    checkoutData.serviceTime, checkoutData.address, checkoutData.province, checkoutData.district,
                    checkoutData.subdistrict, checkoutData.information, promotion?.promotion_id || null, checkoutData.discount],
            );
            order = result.rows[0];
        } catch (error) {
            error.stage = error.stage || "order";
            throw error;
        }

        try {
            for (const item of checkoutData.items) {
                await client.query(
                    `INSERT INTO order_item (option_id, order_id, quantity, unit_price)
                     VALUES ($1, $2, $3, $4)`,
                    [item.optionId, order.order_id, item.quantity, item.unitPrice],
                );
            }
        } catch (error) {
            error.stage = error.stage || "order_items";
            throw error;
        }

        let payment;
        try {
            const result = await client.query(
                `INSERT INTO payment (order_id, payment_method, payment_status, amount)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [order.order_id, checkoutData.paymentMethod, checkoutData.paymentStatus, checkoutData.totalAmount],
            );
            payment = result.rows[0];
        } catch (error) {
            error.stage = error.stage || "payment";
            throw error;
        }

        if (promotion) {
            try {
                await client.query(
                    `UPDATE promotions SET quota_used = quota_used + 1, update_at = NOW()
                     WHERE promotion_id = $1`,
                    [promotion.promotion_id],
                );
            } catch (error) {
                error.stage = error.stage || "promotion";
                throw error;
            }
        }

        return { order, payment };
    });
}

export async function postOrderRepository(orderData) {
    const {user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount} = orderData;
    
    // If promotion_id is a code string, look up the actual promotion_id
    let actualPromotionId = null;
    if (promotion_id) {
        const promotionResult = await pool.query(
            `SELECT promotion_id FROM promotions WHERE promotion_code = $1 AND status = 'active'`,
            [promotion_id]
        );
        if (promotionResult.rows.length > 0) {
            actualPromotionId = promotionResult.rows[0].promotion_id;
        }
    }
    
    const queryText = `
      INSERT INTO orders (user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    
    const assignData = [user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, actualPromotionId, discount];

    const result = await pool.query(queryText, assignData);
    
    return result.rows[0];
    
}



export async function postOrderItemRepository(orderItemData) {
    const {option_id, order_id, quantity, unit_price} = orderItemData;
    
    const queryText = `
      INSERT INTO order_item (option_id, order_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const assignData = [option_id, order_id, quantity, unit_price];

    const result = await pool.query(queryText, assignData);
    
    return result.rows[0];
    
}
