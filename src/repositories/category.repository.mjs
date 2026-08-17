import { pool } from "../configs/db.mjs";
import { query } from "../configs/db.mjs";

export async function findCategories() {
  const result = await query(
    `
      SELECT category_id::text AS id, name
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC, category_id ASC
    `,
  );
  return result.rows;
}

const categoryRepository = {
  findAll: async () => {
    const query = "SELECT * FROM categories ORDER BY created_at DESC";
    const result = await pool.query(query);
    return result.rows;
  },

  findById: async (id) => {
    const query = "SELECT * FROM categories WHERE category_id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  findByName: async (name) => {
    const result = await pool.query(
      "SELECT * FROM categories WHERE name = $1 LIMIT 1",
      [name],
    );
    return result.rows[0];
  },

  create: async (name) => {
    const query = "INSERT INTO categories (name) VALUES ($1) RETURNING *";
    const result = await pool.query(query, [name]);
    return result.rows[0];
  },

  update: async (id, { name, is_active } = {}) => {
    const query = `
      UPDATE categories 
      SET name = COALESCE($1, name),
          is_active = COALESCE($2, is_active),
          updated_at = NOW() 
      WHERE category_id = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [name ?? null, is_active ?? null, id]);
    return result.rows[0];
  },

  delete: async (id) => {
    const query = `
      UPDATE categories
      SET is_active = false, updated_at = NOW()
      WHERE category_id = $1 AND is_active = true
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};

export default categoryRepository;
