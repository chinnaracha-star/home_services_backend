import { pool } from "../configs/db.mjs";

const promotionRepository = {
  findAll: async ({ search = "" } = {}) => {
    let queryText = `
      SELECT * FROM promotions 
      WHERE status = 'active'
    `;
    const params = [];

    if (search && search.trim() !== "") {
      params.push(`%${search.trim()}%`);
      queryText += ` AND promotion_code ILIKE $${params.length}`;
    }

    queryText += ` ORDER BY create_at DESC`;

    const result = await pool.query(queryText, params);
    return result.rows;
  },

  findById: async (id) => {
    const queryText = `
      SELECT * FROM promotions 
      WHERE promotion_id = $1
    `;
    const result = await pool.query(queryText, [id]);
    return result.rows[0];
  },

  findByCode: async (code) => {
    const queryText = `
      SELECT * FROM promotions 
      WHERE UPPER(promotion_code) = UPPER($1) AND status = 'active' 
      LIMIT 1
    `;
    const result = await pool.query(queryText, [code]);
    return result.rows[0];
  },

  create: async ({ promotion_code, type, discount, quota, expire }) => {
    const queryText = `
      INSERT INTO promotions (
        promotion_code,
        type,
        discount,
        quota,
        quota_used,
        status,
        expire,
        create_at,
        update_at
      ) 
      VALUES ($1, $2, $3, $4, 0, 'active', $5, NOW(), NOW())
      RETURNING *
    `;
    const result = await pool.query(queryText, [
      promotion_code.toUpperCase().trim(),
      type,
      discount,
      quota,
      expire,
    ]);
    return result.rows[0];
  },

  update: async (id, { promotion_code, type, discount, quota, expire, status } = {}) => {
    const queryText = `
      UPDATE promotions
      SET 
        promotion_code = COALESCE($1, promotion_code),
        type = COALESCE($2, type),
        discount = COALESCE($3, discount),
        quota = COALESCE($4, quota),
        expire = COALESCE($5, expire),
        status = COALESCE($6, status),
        update_at = NOW()
      WHERE promotion_id = $7
      RETURNING *
    `;
    const result = await pool.query(queryText, [
      promotion_code ? promotion_code.toUpperCase().trim() : null,
      type ?? null,
      discount ?? null,
      quota ?? null,
      expire ?? null,
      status ?? null,
      id,
    ]);
    return result.rows[0];
  },

  delete: async (id) => {
    const queryText = `
      UPDATE promotions
      SET status = 'inactive', update_at = NOW()
      WHERE promotion_id = $1 AND status = 'active'
      RETURNING *
    `;
    const result = await pool.query(queryText, [id]);
    return result.rows[0];
  },
};

export default promotionRepository;
