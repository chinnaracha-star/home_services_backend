import { query, runTransaction } from "../configs/db.mjs";

export const MAX_JOB_RADIUS_KM = 4;

const JOB_COLUMNS = `
  assignment.assignment_id::text AS "assignmentId",
  assignment.status AS "assignmentStatus",
  assignment.assigned_at AS "assignedAt",
  assignment.completed_at AS "completedAt",
  orders.order_id::text AS "orderId",
  COALESCE(orders.order_code, 'HS-' || orders.order_id::text) AS "orderCode",
  orders.status AS "orderStatus",
  orders.scheduled_at AS "scheduledAt",
  orders.address,
  orders.service_latitude::float8 AS "serviceLatitude",
  orders.service_longitude::float8 AS "serviceLongitude",
  orders.subtotal::float8 AS subtotal,
  COALESCE(orders.discount, 0)::float8 AS discount,
  orders.total_price::float8 AS "totalPrice",
  orders.service_id::text AS "serviceId",
  services.service_name AS "serviceName",
  categories.name AS "categoryName",
  COALESCE(users.full_name, CONCAT_WS(' ', users.first_name, users.last_name), users.email) AS "customerName",
  users.phone AS "customerPhone"
`;

function distanceKmSql(latParam, lngParam) {
  return `
    (
      6371 * 2 * ASIN(
        SQRT(
          POWER(SIN(RADIANS((${latParam}::float8 - orders.service_latitude::float8) / 2)), 2) +
          COS(RADIANS(${latParam}::float8)) * COS(RADIANS(orders.service_latitude::float8)) *
          POWER(SIN(RADIANS((${lngParam}::float8 - orders.service_longitude::float8) / 2)), 2)
        )
      )
    )
  `;
}

function toJob(row, items = []) {
  if (!row) return null;
  return {
    assignmentId: row.assignmentId ?? undefined,
    assignmentStatus: row.assignmentStatus ?? undefined,
    assignedAt: row.assignedAt ?? undefined,
    completedAt: row.completedAt ?? null,
    orderId: String(row.orderId),
    orderCode: row.orderCode,
    orderStatus: row.orderStatus,
    scheduledAt: row.scheduledAt,
    address: row.address ?? null,
    serviceLatitude: row.serviceLatitude ?? null,
    serviceLongitude: row.serviceLongitude ?? null,
    subtotal: row.subtotal ?? null,
    discount: row.discount ?? 0,
    totalPrice: Number(row.totalPrice ?? 0),
    serviceId: String(row.serviceId),
    serviceName: row.serviceName,
    categoryName: row.categoryName ?? "",
    customerName: row.customerName ?? null,
    customerPhone: row.customerPhone ?? null,
    items,
  };
}

async function loadItemsByOrderIds(orderIds) {
  if (orderIds.length === 0) return new Map();

  const result = await query(
    `
      SELECT
        order_item.order_id::text AS "orderId",
        order_item.item_id::text AS "itemId",
        COALESCE(order_item.option_id, 0)::text AS "optionId",
        COALESCE(service_options.option_name, 'รายการบริการ') AS "optionName",
        order_item.quantity::int AS quantity,
        order_item.unit_price::float8 AS "unitPrice",
        COALESCE(service_options.unit, 'ครั้ง') AS unit
      FROM order_item
      LEFT JOIN service_options ON service_options.option_id = order_item.option_id
      WHERE order_item.order_id = ANY($1::bigint[])
      ORDER BY order_item.item_id ASC
    `,
    [orderIds],
  );

  const itemsByOrderId = new Map();
  for (const row of result.rows) {
    const list = itemsByOrderId.get(row.orderId) ?? [];
    list.push({
      itemId: row.itemId,
      optionId: row.optionId,
      optionName: row.optionName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      unit: row.unit,
    });
    itemsByOrderId.set(row.orderId, list);
  }
  return itemsByOrderId;
}

async function withItems(rows) {
  const itemsByOrderId = await loadItemsByOrderIds(rows.map((row) => row.orderId));
  return rows.map((row) => toJob(row, itemsByOrderId.get(String(row.orderId)) ?? []));
}

export async function findAvailableRequests({
  technicianId,
  latitude,
  longitude,
  serviceId,
  search,
}) {
  const distance = distanceKmSql("$2", "$3");
  const params = [technicianId, latitude, longitude, MAX_JOB_RADIUS_KM];
  const extra = [];

  if (serviceId) {
    params.push(serviceId);
    extra.push(`AND orders.service_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    extra.push(
      `AND (
        COALESCE(orders.order_code, 'HS-' || orders.order_id::text) ILIKE $${params.length}
        OR services.service_name ILIKE $${params.length}
      )`,
    );
  }

  const result = await query(
    `
      SELECT
        NULL::text AS "assignmentId",
        NULL::text AS "assignmentStatus",
        NULL::timestamptz AS "assignedAt",
        NULL::timestamptz AS "completedAt",
        orders.order_id::text AS "orderId",
        COALESCE(orders.order_code, 'HS-' || orders.order_id::text) AS "orderCode",
        orders.status AS "orderStatus",
        orders.scheduled_at AS "scheduledAt",
        orders.address,
        orders.service_latitude::float8 AS "serviceLatitude",
        orders.service_longitude::float8 AS "serviceLongitude",
        orders.subtotal::float8 AS subtotal,
        COALESCE(orders.discount, 0)::float8 AS discount,
        orders.total_price::float8 AS "totalPrice",
        orders.service_id::text AS "serviceId",
        services.service_name AS "serviceName",
        categories.name AS "categoryName",
        COALESCE(users.full_name, CONCAT_WS(' ', users.first_name, users.last_name), users.email) AS "customerName",
        users.phone AS "customerPhone"
      FROM orders
      JOIN services ON services.service_id = orders.service_id
      LEFT JOIN categories ON categories.category_id = services.category_id
      LEFT JOIN users ON users.user_id = orders.user_id
      JOIN technician_skills
        ON technician_skills.technician_id = $1
       AND technician_skills.service_id = orders.service_id
      WHERE UPPER(orders.status) IN ('PENDING', 'PENDING_TECHNICIAN')
        AND orders.service_latitude IS NOT NULL
        AND orders.service_longitude IS NOT NULL
        AND ${distance} <= $4
        AND NOT EXISTS (
          SELECT 1
          FROM order_assignment active_job
          WHERE active_job.order_id = orders.order_id
            AND active_job.status IN ('ACCEPTED', 'IN_PROGRESS')
        )
        AND NOT EXISTS (
          SELECT 1
          FROM order_assignment declined_job
          WHERE declined_job.order_id = orders.order_id
            AND declined_job.technician_id = $1
            AND declined_job.status = 'DECLINED'
        )
        ${extra.join("\n")}
      ORDER BY orders.scheduled_at ASC NULLS LAST, orders.order_id ASC
    `,
    params,
  );

  return withItems(result.rows);
}

export async function acceptOrderForTechnician({ technicianId, orderId }) {
  return runTransaction(async (client) => {
    const orderResult = await client.query(
      `
        SELECT order_id, service_id, status
        FROM orders
        WHERE order_id = $1
        FOR UPDATE
      `,
      [orderId],
    );
    const order = orderResult.rows[0];
    if (!order) return { error: "ORDER_NOT_FOUND" };

    if (!["PENDING", "PENDING_TECHNICIAN"].includes(String(order.status).toUpperCase())) {
      return { error: "ORDER_ALREADY_ASSIGNED" };
    }

    const skill = await client.query(
      `
        SELECT 1
        FROM technician_skills
        WHERE technician_id = $1 AND service_id = $2
        LIMIT 1
      `,
      [technicianId, order.service_id],
    );
    if (skill.rowCount === 0) return { error: "ORDER_NOT_FOUND" };

    const taken = await client.query(
      `
        SELECT 1
        FROM order_assignment
        WHERE order_id = $1
          AND status IN ('ACCEPTED', 'IN_PROGRESS')
        LIMIT 1
      `,
      [orderId],
    );
    if (taken.rowCount > 0) return { error: "ORDER_ALREADY_ASSIGNED" };

    const declined = await client.query(
      `
        SELECT 1
        FROM order_assignment
        WHERE order_id = $1
          AND technician_id = $2
          AND status = 'DECLINED'
        LIMIT 1
      `,
      [orderId, technicianId],
    );
    if (declined.rowCount > 0) return { error: "ORDER_NOT_FOUND" };

    try {
      const inserted = await client.query(
        `
          INSERT INTO order_assignment (order_id, technician_id, status, assigned_at)
          VALUES ($1, $2, 'ACCEPTED', now())
          RETURNING assignment_id
        `,
        [orderId, technicianId],
      );

      await client.query(
        `
          UPDATE orders
          SET status = 'ASSIGNED'
          WHERE order_id = $1
        `,
        [orderId],
      );

      return { assignmentId: inserted.rows[0].assignment_id };
    } catch (error) {
      if (error.code === "23505") return { error: "ORDER_ALREADY_ASSIGNED" };
      throw error;
    }
  });
}

export async function declineOrderForTechnician({ technicianId, orderId }) {
  const orderResult = await query(
    `
      SELECT order_id, service_id, status
      FROM orders
      WHERE order_id = $1
      LIMIT 1
    `,
    [orderId],
  );
  const order = orderResult.rows[0];
  if (!order) return { error: "ORDER_NOT_FOUND" };

  if (!["PENDING", "PENDING_TECHNICIAN"].includes(String(order.status).toUpperCase())) {
    return { error: "ORDER_ALREADY_ASSIGNED" };
  }

  const taken = await query(
    `
      SELECT 1
      FROM order_assignment
      WHERE order_id = $1
        AND status IN ('ACCEPTED', 'IN_PROGRESS')
      LIMIT 1
    `,
    [orderId],
  );
  if (taken.rowCount > 0) return { error: "ORDER_ALREADY_ASSIGNED" };

  try {
    await query(
      `
        INSERT INTO order_assignment (order_id, technician_id, status, assigned_at)
        VALUES ($1, $2, 'DECLINED', now())
      `,
      [orderId, technicianId],
    );
  } catch (error) {
    if (error.code === "23505") return { error: null };
    throw error;
  }

  return { error: null };
}

export async function findTechnicianJobs({ technicianId, serviceId, search, sort, status }) {
  const params = [technicianId];
  const extra = [`AND assignment.status <> 'DECLINED'`];

  if (status) {
    params.push(status);
    extra.push(`AND assignment.status = $${params.length}`);
  }
  if (serviceId) {
    params.push(serviceId);
    extra.push(`AND orders.service_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    extra.push(
      `AND (
        COALESCE(orders.order_code, 'HS-' || orders.order_id::text) ILIKE $${params.length}
        OR services.service_name ILIKE $${params.length}
      )`,
    );
  }

  let orderBy = "assignment.assigned_at DESC NULLS LAST";
  if (sort === "newest") orderBy = "assignment.assigned_at DESC NULLS LAST";
  if (sort === "oldest") orderBy = "assignment.assigned_at ASC NULLS LAST";
  if (sort === "nearest") orderBy = "orders.scheduled_at ASC NULLS LAST";

  const result = await query(
    `
      SELECT ${JOB_COLUMNS}
      FROM order_assignment assignment
      JOIN orders ON orders.order_id = assignment.order_id
      JOIN services ON services.service_id = orders.service_id
      LEFT JOIN categories ON categories.category_id = services.category_id
      LEFT JOIN users ON users.user_id = orders.user_id
      WHERE assignment.technician_id = $1
        ${extra.join("\n")}
      ORDER BY ${orderBy}, assignment.assignment_id DESC
    `,
    params,
  );

  return withItems(result.rows);
}

export async function findTechnicianJob({ technicianId, assignmentId }) {
  const result = await query(
    `
      SELECT ${JOB_COLUMNS}
      FROM order_assignment assignment
      JOIN orders ON orders.order_id = assignment.order_id
      JOIN services ON services.service_id = orders.service_id
      LEFT JOIN categories ON categories.category_id = services.category_id
      LEFT JOIN users ON users.user_id = orders.user_id
      WHERE assignment.technician_id = $1
        AND assignment.assignment_id = $2
        AND assignment.status <> 'DECLINED'
      LIMIT 1
    `,
    [technicianId, assignmentId],
  );

  const rows = await withItems(result.rows);
  return rows[0] ?? null;
}
