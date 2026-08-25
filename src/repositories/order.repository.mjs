import { pool } from "../configs/db.mjs";

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