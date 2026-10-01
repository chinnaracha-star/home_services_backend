import { pool } from "../configs/db.mjs";

export async function postPaymentRepository(paymentData) {
    const {order_id, payment_method, payment_status, amount} = paymentData;
    
    const queryText = `
      INSERT INTO payment (order_id, payment_method, payment_status, amount)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const assignData = [order_id, payment_method, payment_status, amount];

    const result = await pool.query(queryText, assignData);
    
    return result.rows[0];
    
}
