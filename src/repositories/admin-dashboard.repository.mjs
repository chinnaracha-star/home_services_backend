import { query } from "../configs/db.mjs";

export async function getTotalSales({ startDate, endDate }) {
  const result = await query(
    `
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float8 AS "totalSales"
    FROM services AS s
    INNER JOIN service_options AS so ON s.service_id = so.service_id
    INNER JOIN order_item AS oi ON so.option_id = oi.option_id
    INNER JOIN orders AS o ON o.order_id = oi.order_id
    WHERE o.create_at >= $1::date
      AND o.create_at < ($2::date + INTERVAL '1 day')
    `,
    [startDate, endDate],
  );

  return result.rows[0]?.totalSales ?? 0;
}

export async function getTotalOrders({ startDate, endDate }) {
  const result = await query(
    `
    SELECT COALESCE(SUM(oi.quantity), 0)::float8 AS "totalOrders"
    FROM services AS s
    INNER JOIN service_options AS so ON s.service_id = so.service_id
    INNER JOIN order_item AS oi ON so.option_id = oi.option_id
    INNER JOIN orders AS o ON o.order_id = oi.order_id
    WHERE o.create_at >= $1::date
      AND o.create_at < ($2::date + INTERVAL '1 day')
    `,
    [startDate, endDate],
  );

  return result.rows[0]?.totalOrders ?? 0;
}

export async function getTopSalesByService({ startDate, endDate }) {
  const result = await query(
    `
    SELECT s.service_name AS "serviceName",
           COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float8 AS "totalSales"
    FROM services AS s
    INNER JOIN service_options AS so ON s.service_id = so.service_id
    INNER JOIN order_item AS oi ON so.option_id = oi.option_id
    INNER JOIN orders AS o ON o.order_id = oi.order_id
    WHERE o.create_at >= $1::date
      AND o.create_at < ($2::date + INTERVAL '1 day')
    GROUP BY s.service_name
    ORDER BY SUM(oi.quantity * oi.unit_price) DESC
    LIMIT 5
    `,
    [startDate, endDate],
  );

  return result.rows;
}

export async function getTotalSalesByDay({ startDate, endDate }) {
  const result = await query(
    `
    SELECT to_char(o.create_at::date, 'YYYY-MM-DD') AS date,
           COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float8 AS "totalSales"
    FROM services AS s
    INNER JOIN service_options AS so ON s.service_id = so.service_id
    INNER JOIN order_item AS oi ON so.option_id = oi.option_id
    INNER JOIN orders AS o ON o.order_id = oi.order_id
    WHERE o.create_at >= $1::date
      AND o.create_at < ($2::date + INTERVAL '1 day')
    GROUP BY o.create_at::date
    ORDER BY o.create_at::date ASC
    `,
    [startDate, endDate],
  );

  return result.rows;
}

export async function getSalesByServiceSubcategory({ startDate, endDate }) {
  const result = await query(
    `
    SELECT s.service_name AS "serviceName",
           so.option_name AS "optionName",
           COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float8 AS "totalSales",
           COALESCE(SUM(oi.quantity), 0)::float8 AS "totalOrders"
    FROM services AS s
    INNER JOIN service_options AS so ON s.service_id = so.service_id
    INNER JOIN order_item AS oi ON so.option_id = oi.option_id
    INNER JOIN orders AS o ON o.order_id = oi.order_id
    WHERE o.create_at >= $1::date
      AND o.create_at < ($2::date + INTERVAL '1 day')
    GROUP BY s.service_name, so.option_name
    ORDER BY SUM(oi.quantity * oi.unit_price) DESC
    `,
    [startDate, endDate],
  );

  return result.rows;
}

export async function getServicesDateRange() {
  // Format directly to YYYY-MM-DD in SQL to avoid timezone-related off-by-one
  // conversion issues when the timestamptz value later crosses the client's JS Date parsing.
  const [minResult, maxResult] = await Promise.all([
    query(`SELECT to_char(MIN(create_at), 'YYYY-MM-DD') AS "minDate" FROM orders`),
    query(`SELECT to_char(MAX(create_at), 'YYYY-MM-DD') AS "maxDate" FROM orders`),
  ]);

  return {
    minDate: minResult.rows[0]?.minDate ?? null,
    maxDate: maxResult.rows[0]?.maxDate ?? null,
  };
}

