import { pool } from "../configs/db.mjs";

const applyChanges = process.argv.includes("--apply");

const candidatesSql = `
  WITH facts AS (
    SELECT
      o.*,
      (SELECT COUNT(*)::int FROM reviews r WHERE r.order_id = o.order_id OR r.order_code = o.order_code) AS review_count,
      (SELECT COUNT(*)::int FROM order_assignment oa WHERE oa.order_id = o.order_id) AS assignment_count,
      (SELECT COUNT(*)::int FROM order_assignment oa WHERE oa.order_id = o.order_id AND oa.status = 'COMPLETED') AS completed_assignment_count,
      (SELECT COUNT(*)::int FROM payment p WHERE p.order_id = o.order_id AND p.payment_status = 'succeeded') AS succeeded_payment_count,
      md5(ROW(
        o.user_id, o.service_id, o.total_price, o.scheduled_date, o.scheduled_time,
        o.address, o.province, o.district, o.subdistrict
      )::text) AS duplicate_group
    FROM orders o
    WHERE LOWER(o.status) <> 'cancelled'
  ), ranked AS (
    SELECT
      facts.*,
      COUNT(*) OVER (PARTITION BY duplicate_group) AS copies,
      ROW_NUMBER() OVER (
        PARTITION BY duplicate_group
        ORDER BY
          (review_count > 0) DESC,
          (completed_assignment_count > 0) DESC,
          (assignment_count > 0) DESC,
          (succeeded_payment_count > 0) DESC,
          created_at ASC,
          order_id ASC
      ) AS duplicate_rank
    FROM facts
  )
  SELECT
    duplicate_group AS "group",
    order_id::text AS "orderId",
    status,
    copies::int,
    duplicate_rank::int AS "rank",
    review_count AS "reviewCount",
    assignment_count AS "assignmentCount",
    succeeded_payment_count AS "succeededPaymentCount",
    (
      duplicate_rank > 1
      AND LOWER(status) = 'pending'
      AND review_count = 0
      AND assignment_count = 0
      AND succeeded_payment_count = 0
    ) AS "safeToCancel"
  FROM ranked
  WHERE copies > 1
  ORDER BY duplicate_group, duplicate_rank
`;

const client = await pool.connect();

try {
  await client.query("BEGIN");
  const result = await client.query(candidatesSql);
  const safeIds = result.rows.filter((row) => row.safeToCancel).map((row) => row.orderId);
  const report = {
    mode: applyChanges ? "apply" : "dry-run",
    duplicateGroups: new Set(result.rows.map((row) => row.group)).size,
    safeToCancel: safeIds,
    protected: result.rows
      .filter((row) => row.rank > 1 && !row.safeToCancel)
      .map(({ group, orderId, status, reviewCount, assignmentCount, succeededPaymentCount }) => ({
        group,
        orderId,
        status,
        reviewCount,
        assignmentCount,
        succeededPaymentCount,
      })),
  };

  if (applyChanges && safeIds.length > 0) {
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = ANY($1::bigint[])`,
      [safeIds],
    );
  }

  if (applyChanges) {
    await client.query("COMMIT");
  } else {
    await client.query("ROLLBACK");
  }

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
