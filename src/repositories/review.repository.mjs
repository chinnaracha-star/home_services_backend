import { query } from "../configs/db.mjs";

const REVIEW_COLUMNS = `
  review_id::text AS "id",
  review_id::text AS "reviewId",
  order_code AS "orderCode",
  order_id AS "orderId",
  user_id::text AS "userId",
  user_email AS "userEmail",
  user_name AS "userName",
  service_id::text AS "serviceId",
  service_name AS "serviceName",
  technician_id::text AS "technicianId",
  technician_name AS "technicianName",
  rating,
  comment,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function insertReview({
  orderCode,
  orderId = null,
  userId = null,
  userEmail = null,
  userName = null,
  serviceId = null,
  serviceName = null,
  technicianId = null,
  technicianName = null,
  rating,
  comment = "",
}) {
  const result = await query(
    `
      INSERT INTO reviews (
        order_code,
        order_id,
        user_id,
        user_email,
        user_name,
        service_id,
        service_name,
        technician_id,
        technician_name,
        rating,
        comment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING ${REVIEW_COLUMNS}
    `,
    [
      orderCode,
      orderId && !isNaN(Number(orderId)) ? Number(orderId) : null,
      userId && !isNaN(Number(userId)) ? Number(userId) : null,
      userEmail,
      userName,
      serviceId && !isNaN(Number(serviceId)) ? Number(serviceId) : null,
      serviceName,
      technicianId && !isNaN(Number(technicianId)) ? Number(technicianId) : null,
      technicianName,
      rating,
      comment || "",
    ],

  );

  return result.rows[0];
}

export async function findReviewByOrderCode(orderCode) {
  if (!orderCode) return null;

  const result = await query(
    `
      SELECT ${REVIEW_COLUMNS}
      FROM reviews
      WHERE order_code = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [orderCode],
  );

  return result.rows[0] ?? null;
}

export async function findReviewByOrderId(orderId) {
  if (!orderId) return null;

  const result = await query(
    `
      SELECT ${REVIEW_COLUMNS}
      FROM reviews
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [orderId],
  );

  return result.rows[0] ?? null;
}

export async function findReviews({
  serviceId = null,
  technicianId = null,
  userId = null,
  limit = 50,
  offset = 0,
} = {}) {
  const conditions = [];
  const params = [];

  if (serviceId && !isNaN(Number(serviceId))) {
    params.push(Number(serviceId));
    conditions.push(`service_id = $${params.length}`);
  }

  if (technicianId && !isNaN(Number(technicianId))) {
    params.push(Number(technicianId));
    conditions.push(`technician_id = $${params.length}`);
  }

  if (userId && !isNaN(Number(userId))) {
    params.push(Number(userId));
    conditions.push(`user_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit);
  const limitParam = `$${params.length}`;
  params.push(offset);
  const offsetParam = `$${params.length}`;

  const sql = `
    SELECT ${REVIEW_COLUMNS}
    FROM reviews
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function deleteReviewByOrderCode(orderCode) {
  if (!orderCode) return null;

  const result = await query(
    `
      DELETE FROM reviews
      WHERE order_code = $1
      RETURNING ${REVIEW_COLUMNS}
    `,
    [orderCode],
  );

  return result.rows[0] ?? null;
}

export async function updateReviewByOrderCode(orderCode, { rating, comment }) {
  if (!orderCode) return null;

  const result = await query(
    `
      UPDATE reviews
      SET 
        rating = COALESCE($2, rating),
        comment = COALESCE($3, comment),
        updated_at = now()
      WHERE order_code = $1
      RETURNING ${REVIEW_COLUMNS}
    `,
    [orderCode, rating, typeof comment === "string" ? comment.trim() : null],
  );

  return result.rows[0] ?? null;
}

export async function getReviewStatsByServiceId(serviceId) {
  if (!serviceId || isNaN(Number(serviceId))) return null;

  const result = await query(
    `
      SELECT 
        COUNT(*)::int AS "reviewCount",
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float8 AS "averageRating"
      FROM reviews
      WHERE service_id = $1
    `,
    [Number(serviceId)],
  );

  return result.rows[0] ?? { reviewCount: 0, averageRating: 0 };
}

