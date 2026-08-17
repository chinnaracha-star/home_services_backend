import { query } from "../configs/db.mjs";

export async function findCategories() {
  const result = await query(
    `
      SELECT category_id::text AS id, name
      FROM categories
      ORDER BY name ASC, category_id ASC
    `,
  );
  return result.rows;
}
