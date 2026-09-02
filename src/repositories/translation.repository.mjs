import { query } from "../configs/db.mjs";

export async function serviceExists(serviceId) {
  const result = await query(
    "SELECT 1 FROM services WHERE service_id = $1 LIMIT 1",
    [serviceId],
  );
  return result.rowCount > 0;
}

export async function categoryExists(categoryId) {
  const result = await query(
    "SELECT 1 FROM categories WHERE category_id = $1 LIMIT 1",
    [categoryId],
  );
  return result.rowCount > 0;
}

export async function serviceOptionExists(optionId) {
  const result = await query(
    "SELECT 1 FROM service_options WHERE option_id = $1 LIMIT 1",
    [optionId],
  );
  return result.rowCount > 0;
}

export async function findServiceTranslations(serviceId) {
  const result = await query(
    `
      SELECT
        service_id::text AS "serviceId",
        locale,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM service_translations
      WHERE service_id = $1
      ORDER BY locale ASC
    `,
    [serviceId],
  );
  return result.rows;
}

export async function findCategoryTranslations(categoryId) {
  const result = await query(
    `
      SELECT
        category_id::text AS "categoryId",
        locale,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM category_translations
      WHERE category_id = $1
      ORDER BY locale ASC
    `,
    [categoryId],
  );
  return result.rows;
}

export async function findServiceOptionTranslations(optionId) {
  const result = await query(
    `
      SELECT
        option_id::text AS "optionId",
        locale,
        name,
        unit,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM service_option_translations
      WHERE option_id = $1
      ORDER BY locale ASC
    `,
    [optionId],
  );
  return result.rows;
}

export async function upsertServiceTranslation(serviceId, locale, { name }) {
  const result = await query(
    `
      INSERT INTO service_translations (service_id, locale, name)
      SELECT service_id, $2, $3
      FROM services
      WHERE service_id = $1
      ON CONFLICT (service_id, locale)
      DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING
        service_id::text AS "serviceId",
        locale,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [serviceId, locale, name],
  );
  return result.rows[0] ?? null;
}

export async function upsertCategoryTranslation(categoryId, locale, { name }) {
  const result = await query(
    `
      INSERT INTO category_translations (category_id, locale, name)
      SELECT category_id, $2, $3
      FROM categories
      WHERE category_id = $1
      ON CONFLICT (category_id, locale)
      DO UPDATE SET name = EXCLUDED.name, updated_at = now()
      RETURNING
        category_id::text AS "categoryId",
        locale,
        name,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [categoryId, locale, name],
  );
  return result.rows[0] ?? null;
}

export async function upsertServiceOptionTranslation(
  optionId,
  locale,
  { name, unit },
) {
  const result = await query(
    `
      INSERT INTO service_option_translations (option_id, locale, name, unit)
      SELECT option_id, $2, $3, $4
      FROM service_options
      WHERE option_id = $1
      ON CONFLICT (option_id, locale)
      DO UPDATE SET
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        updated_at = now()
      RETURNING
        option_id::text AS "optionId",
        locale,
        name,
        unit,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [optionId, locale, name, unit],
  );
  return result.rows[0] ?? null;
}
