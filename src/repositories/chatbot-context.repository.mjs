import { query } from "../configs/db.mjs";

export async function searchChatbotServices(searchTerms, locale = "th") {
  const terms = searchTerms
    .map((term) => String(term).trim())
    .filter(Boolean)
    .slice(0, 5);
  const result = await query(
    `SELECT
       service.service_id::text AS id,
       COALESCE(service_translation.name, service.service_name) AS name,
       COALESCE(category_translation.name, category.name) AS category,
       COALESCE(options.items, '[]'::json) AS options
     FROM services service
     JOIN categories category ON category.category_id = service.category_id
     LEFT JOIN service_translations service_translation
       ON service_translation.service_id = service.service_id
      AND service_translation.locale = $2
     LEFT JOIN category_translations category_translation
       ON category_translation.category_id = category.category_id
      AND category_translation.locale = $2
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'name', COALESCE(option_translation.name, option.option_name),
           'price', option.price::float8,
           'unit', COALESCE(option_translation.unit, option.unit)
         ) ORDER BY option.option_id
       ) AS items
       FROM service_options option
       LEFT JOIN service_option_translations option_translation
         ON option_translation.option_id = option.option_id
        AND option_translation.locale = $2
       WHERE option.service_id = service.service_id
     ) options ON true
     WHERE service.is_active = true
       AND category.is_active = true
       AND (
         cardinality($1::text[]) = 0
         OR EXISTS (
           SELECT 1 FROM unnest($1::text[]) term
           WHERE service.service_name ILIKE '%' || term || '%'
              OR service_translation.name ILIKE '%' || term || '%'
              OR category.name ILIKE '%' || term || '%'
              OR category_translation.name ILIKE '%' || term || '%'
              OR EXISTS (
                SELECT 1
                FROM service_options matching_option
                LEFT JOIN service_option_translations matching_translation
                  ON matching_translation.option_id = matching_option.option_id
                 AND matching_translation.locale = $2
                WHERE matching_option.service_id = service.service_id
                  AND (
                    matching_option.option_name ILIKE '%' || term || '%'
                    OR matching_translation.name ILIKE '%' || term || '%'
                  )
              )
         )
       )
     ORDER BY service.is_featured DESC, service.display_order ASC, service.service_id ASC
     LIMIT 8`,
    [terms, locale],
  );
  return result.rows;
}
