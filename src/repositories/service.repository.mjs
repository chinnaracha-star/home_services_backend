import { query } from "../configs/db.mjs";

const SUMMARY_COLUMNS = `
  service.service_id::text AS id,
  COALESCE(service_translation.name, service.service_name) AS name,
  category.category_id::text AS "categoryId",
  COALESCE(category_translation.name, category.name) AS category,
  service.image_url AS "imageUrl",
  COALESCE(MIN(option.price), 0)::float8 AS "minPrice",
  COALESCE(MAX(option.price), 0)::float8 AS "maxPrice",
  service.is_featured AS "isFeatured",
  service.display_order AS "displayOrder",
  service.popularity_score AS "popularityScore",
  COALESCE(r.avg_rating, 0)::float8 AS "averageRating",
  COALESCE(r.count_reviews, 0)::int AS "reviewCount"
`;

const SUMMARY_GROUP = `
  service.service_id,
  service.service_name,
  service_translation.name,
  category.category_id,
  category.name,
  category_translation.name,
  service.image_url,
  service.is_featured,
  service.display_order,
  service.popularity_score,
  r.avg_rating,
  r.count_reviews
`;

export async function findServices({ featured, limit, locale = "th" }) {
  const result = await query(
    `
      SELECT ${SUMMARY_COLUMNS}
      FROM services service
      JOIN categories category ON category.category_id = service.category_id
      LEFT JOIN service_translations service_translation
        ON service_translation.service_id = service.service_id
       AND service_translation.locale = $3
      LEFT JOIN category_translations category_translation
        ON category_translation.category_id = category.category_id
       AND category_translation.locale = $3
      LEFT JOIN service_options option ON option.service_id = service.service_id
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(ROUND(AVG(rating)::numeric, 1)::float8, 0) AS avg_rating,
          COUNT(*)::int AS count_reviews
        FROM reviews
        WHERE reviews.service_id = service.service_id
      ) r ON true
      WHERE service.is_active = true
        AND category.is_active = true
        AND ($1::boolean = false OR service.is_featured = true)
      GROUP BY ${SUMMARY_GROUP}
      ORDER BY service.display_order ASC, service.service_id ASC
      LIMIT $2
    `,
    [featured, limit, locale],
  );
  return result.rows;
}

export async function findServiceById(serviceId, locale = "th") {
  const result = await query(
    `
      SELECT ${SUMMARY_COLUMNS}
      FROM services service
      JOIN categories category ON category.category_id = service.category_id
      LEFT JOIN service_translations service_translation
        ON service_translation.service_id = service.service_id
       AND service_translation.locale = $2
      LEFT JOIN category_translations category_translation
        ON category_translation.category_id = category.category_id
       AND category_translation.locale = $2
      LEFT JOIN service_options option ON option.service_id = service.service_id
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(ROUND(AVG(rating)::numeric, 1)::float8, 0) AS avg_rating,
          COUNT(*)::int AS count_reviews
        FROM reviews
        WHERE reviews.service_id = service.service_id
      ) r ON true
      WHERE service.service_id = $1 AND service.is_active = true AND category.is_active = true
      GROUP BY ${SUMMARY_GROUP}
      LIMIT 1
    `,
    [serviceId, locale],
  );
  return result.rows[0] ?? null;
}

export async function findServiceOptions(serviceId, locale = "th") {
  const result = await query(
    `
      SELECT
        option.option_id::text AS id,
        COALESCE(option_translation.name, option.option_name) AS name,
        option.price::float8 AS price,
        COALESCE(option_translation.unit, option.unit) AS unit
      FROM service_options option
      LEFT JOIN service_option_translations option_translation
        ON option_translation.option_id = option.option_id
       AND option_translation.locale = $2
      WHERE option.service_id = $1
      ORDER BY option.option_id ASC
    `,
    [serviceId, locale],
  );
  return result.rows;
}


// for service option

export async function getServiceOptionRepository(serviceId, locale = "th") {
  const result = await query(
    `
    SELECT
      s.service_id,
      COALESCE(st.name, s.service_name) AS service_name,
      so.option_id,
      COALESCE(sot.name, so.option_name) AS option_name,
      so.price,
      COALESCE(sot.unit, so.unit) AS unit
    FROM services AS s
    INNER JOIN service_options AS so
    ON s.service_id = so.service_id
    LEFT JOIN service_translations AS st
      ON st.service_id = s.service_id
     AND st.locale = $2
    LEFT JOIN service_option_translations AS sot
      ON sot.option_id = so.option_id
     AND sot.locale = $2
    WHERE s.service_id=$1
    ;
    `,
    [serviceId, locale],
  );
  return result.rows ?? null;
}