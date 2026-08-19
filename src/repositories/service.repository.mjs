import { query } from "../configs/db.mjs";

const SUMMARY_COLUMNS = `
  service.service_id::text AS id,
  service.service_name AS name,
  category.category_id::text AS "categoryId",
  category.name AS category,
  service.image_url AS "imageUrl",
  COALESCE(MIN(option.price), 0)::float8 AS "minPrice",
  COALESCE(MAX(option.price), 0)::float8 AS "maxPrice",
  service.is_featured AS "isFeatured",
  service.display_order AS "displayOrder",
  service.popularity_score AS "popularityScore"
`;

const SUMMARY_GROUP = `
  service.service_id,
  service.service_name,
  category.category_id,
  category.name,
  service.image_url,
  service.is_featured,
  service.display_order,
  service.popularity_score
`;

export async function findServices({ featured, limit }) {
  const result = await query(
    `
      SELECT ${SUMMARY_COLUMNS}
      FROM services service
      JOIN categories category ON category.category_id = service.category_id
      LEFT JOIN service_options option ON option.service_id = service.service_id
      WHERE service.is_active = true
        AND category.is_active = true
        AND ($1::boolean = false OR service.is_featured = true)
      GROUP BY ${SUMMARY_GROUP}
      ORDER BY service.display_order ASC, service.service_id ASC
      LIMIT $2
    `,
    [featured, limit],
  );
  return result.rows;
}

export async function findServiceById(serviceId) {
  const result = await query(
    `
      SELECT ${SUMMARY_COLUMNS}
      FROM services service
      JOIN categories category ON category.category_id = service.category_id
      LEFT JOIN service_options option ON option.service_id = service.service_id
      WHERE service.service_id = $1 AND service.is_active = true AND category.is_active = true
      GROUP BY ${SUMMARY_GROUP}
      LIMIT 1
    `,
    [serviceId],
  );
  return result.rows[0] ?? null;
}

export async function findServiceOptions(serviceId) {
  const result = await query(
    `
      SELECT option_id::text AS id, option_name AS name,
             price::float8 AS price, unit
      FROM service_options
      WHERE service_id = $1
      ORDER BY option_id ASC
    `,
    [serviceId],
  );
  return result.rows;
}
