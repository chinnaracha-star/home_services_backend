import { pool, query } from "../configs/db.mjs";

const ADMIN_SERVICE_SELECT = `
  s.service_id::text AS id,
  s.service_id::text AS service_id,
  s.service_name AS name,
  s.service_name AS service_name,
  s.category_id::text AS "categoryId",
  s.category_id::text AS category_id,
  c.name AS category,
  c.name AS category_name,
  s.image_url AS "imageUrl",
  s.image_url AS image_url,
  s.is_featured AS "isFeatured",
  s.is_featured AS is_featured,
  s.display_order AS "displayOrder",
  s.display_order AS display_order,
  s.popularity_score AS "popularityScore",
  s.popularity_score AS popularity_score,
  s.is_active AS "isActive",
  s.is_active AS is_active,
  s.created_at AS "createdAt",
  s.created_at AS created_at,
  s.updated_at AS "updatedAt",
  s.updated_at AS updated_at,
  COALESCE(MIN(opt.price), 0)::float8 AS "minPrice",
  COALESCE(MAX(opt.price), 0)::float8 AS "maxPrice"
`;

const ADMIN_SERVICE_GROUP = `
  s.service_id,
  s.service_name,
  s.category_id,
  c.name,
  s.image_url,
  s.is_featured,
  s.display_order,
  s.popularity_score,
  s.is_active,
  s.created_at,
  s.updated_at
`;

export async function findAllAdminServices({ search = "", categoryId = null, includeInactive = false } = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push("s.is_active = true");
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(s.service_name ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }

  if (categoryId) {
    params.push(categoryId);
    conditions.push(`s.category_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT ${ADMIN_SERVICE_SELECT}
    FROM services s
    JOIN categories c ON c.category_id = s.category_id
    LEFT JOIN service_options opt ON opt.service_id = s.service_id
    ${whereClause}
    GROUP BY ${ADMIN_SERVICE_GROUP}
    ORDER BY s.display_order ASC, s.service_id DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function findAdminServiceById(id) {
  const serviceSql = `
    SELECT ${ADMIN_SERVICE_SELECT}
    FROM services s
    JOIN categories c ON c.category_id = s.category_id
    LEFT JOIN service_options opt ON opt.service_id = s.service_id
    WHERE s.service_id = $1 AND s.is_active = true
    GROUP BY ${ADMIN_SERVICE_GROUP}
    LIMIT 1
  `;
  const serviceResult = await query(serviceSql, [id]);
  const service = serviceResult.rows[0];

  if (!service) return null;

  const optionsSql = `
    SELECT 
      option_id::text AS id,
      option_id::text AS option_id,
      service_id::text AS service_id,
      option_name AS name,
      option_name,
      price::float8 AS price,
      unit
    FROM service_options
    WHERE service_id = $1
    ORDER BY option_id ASC
  `;
  const optionsResult = await query(optionsSql, [id]);

  return {
    ...service,
    serviceOptions: optionsResult.rows,
    service_options: optionsResult.rows,
  };
}

export async function createAdminService({
  name,
  categoryId,
  categoryName,
  imageUrl = null,
  serviceOptions = [],
  isFeatured = false,
  displayOrder = 0,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let finalCategoryId = categoryId;
    if (!finalCategoryId && categoryName) {
      const catCheck = await client.query("SELECT category_id FROM categories WHERE name = $1 LIMIT 1", [
        categoryName,
      ]);
      if (catCheck.rows.length > 0) {
        finalCategoryId = catCheck.rows[0].category_id;
      } else {
        const catInsert = await client.query(
          "INSERT INTO categories (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING category_id",
          [categoryName]
        );
        finalCategoryId = catInsert.rows[0].category_id;
      }
    }

    if (!finalCategoryId) {
      throw new Error("Category ID could not be resolved");
    }

    // Auto calculate display_order if 0
    if (!displayOrder) {
      const maxOrderRes = await client.query("SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM services");
      displayOrder = maxOrderRes.rows[0]?.next_order || 1;
    }

    const insertServiceSql = `
      INSERT INTO services (
        service_name, category_id, image_url, is_featured, display_order, popularity_score, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 0, true, NOW(), NOW())
      RETURNING service_id
    `;
    const serviceRes = await client.query(insertServiceSql, [
      name,
      finalCategoryId,
      imageUrl,
      isFeatured,
      displayOrder,
    ]);
    const serviceId = serviceRes.rows[0].service_id;

    // Insert service options
    const insertedOptions = [];
    for (const opt of serviceOptions) {
      const optName = opt.name || opt.option_name;
      const optPrice = Number(opt.price) || 0;
      const optUnit = opt.unit;

      const insertOptSql = `
        INSERT INTO service_options (service_id, option_name, price, unit)
        VALUES ($1, $2, $3, $4)
        RETURNING option_id::text AS id, option_id::text AS option_id, service_id::text AS service_id, option_name AS name, option_name, price::float8 AS price, unit
      `;
      const optRes = await client.query(insertOptSql, [serviceId, optName, optPrice, optUnit]);
      insertedOptions.push(optRes.rows[0]);
    }

    await client.query("COMMIT");

    return await findAdminServiceById(serviceId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAdminService(id, {
  name,
  categoryId,
  categoryName,
  imageUrl,
  serviceOptions,
  isFeatured,
  displayOrder,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check service exists
    const existing = await client.query("SELECT * FROM services WHERE service_id = $1 AND is_active = true", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    let finalCategoryId = categoryId;
    if (!finalCategoryId && categoryName) {
      const catCheck = await client.query("SELECT category_id FROM categories WHERE name = $1 LIMIT 1", [
        categoryName,
      ]);
      if (catCheck.rows.length > 0) {
        finalCategoryId = catCheck.rows[0].category_id;
      }
    }

    const updates = [];
    const params = [id];

    if (name !== undefined) {
      params.push(name);
      updates.push(`service_name = $${params.length}`);
    }
    if (finalCategoryId !== undefined) {
      params.push(finalCategoryId);
      updates.push(`category_id = $${params.length}`);
    }
    if (imageUrl !== undefined) {
      params.push(imageUrl);
      updates.push(`image_url = $${params.length}`);
    }
    if (isFeatured !== undefined) {
      params.push(isFeatured);
      updates.push(`is_featured = $${params.length}`);
    }
    if (displayOrder !== undefined) {
      params.push(displayOrder);
      updates.push(`display_order = $${params.length}`);
    }

    updates.push("updated_at = NOW()");

    const updateServiceSql = `
      UPDATE services
      SET ${updates.join(", ")}
      WHERE service_id = $1
    `;
    await client.query(updateServiceSql, params);

    // Update options if provided
    if (Array.isArray(serviceOptions)) {
      // Clear existing options and recreate to maintain sequence & purity
      await client.query("DELETE FROM service_options WHERE service_id = $1", [id]);
      for (const opt of serviceOptions) {
        const optName = opt.name || opt.option_name;
        const optPrice = Number(opt.price) || 0;
        const optUnit = opt.unit;

        await client.query(
          `INSERT INTO service_options (service_id, option_name, price, unit)
           VALUES ($1, $2, $3, $4)`,
          [id, optName, optPrice, optUnit]
        );
      }
    }

    await client.query("COMMIT");

    return await findAdminServiceById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteAdminService(id) {
  const result = await query(
    `UPDATE services SET is_active = false, updated_at = NOW() WHERE service_id = $1 AND is_active = true RETURNING service_id`,
    [id]
  );
  return result.rowCount > 0;
}

export async function reorderAdminServices(items) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const serviceId = item.id || item.service_id;
      const order = item.displayOrder !== undefined ? item.displayOrder : item.display_order !== undefined ? item.display_order : index + 1;
      await client.query("UPDATE services SET display_order = $1, updated_at = NOW() WHERE service_id = $2", [
        order,
        serviceId,
      ]);
    }
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
