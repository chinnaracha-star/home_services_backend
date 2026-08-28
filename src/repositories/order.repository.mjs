import { pool, runTransaction } from "../configs/db.mjs";

function checkoutError(stage, message, { statusCode = 500, code = "CHECKOUT_FAILED" } = {}) {
    const error = new Error(message);
    error.stage = stage;
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

export async function checkout(checkoutData) {
    return runTransaction(async (client) => {
        let promotion = null;

        if (checkoutData.promotionCode) {
            const promotionResult = await client.query(
                `SELECT promotion_id, quota, quota_used
                 FROM promotions
                 WHERE UPPER(promotion_code) = UPPER($1) AND status = 'active'
                 FOR UPDATE`,
                [checkoutData.promotionCode],
            );
            promotion = promotionResult.rows[0];

            if (!promotion) {
                throw checkoutError("promotion", "Promotion code was not found or is inactive", {
                    statusCode: 400,
                    code: "INVALID_PROMOTION",
                });
            }

            if (Number(promotion.quota_used) >= Number(promotion.quota)) {
                throw checkoutError("promotion", "Promotion code quota has been reached", {
                    statusCode: 409,
                    code: "PROMOTION_QUOTA_EXCEEDED",
                });
            }
        }

        let order;
        try {
            const result = await client.query(
                `INSERT INTO orders
                    (user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount)
                 VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [checkoutData.userId, checkoutData.serviceId, checkoutData.totalAmount, checkoutData.serviceDate,
                    checkoutData.serviceTime, checkoutData.address, checkoutData.province, checkoutData.district,
                    checkoutData.subdistrict, checkoutData.information, promotion?.promotion_id || null, checkoutData.discount],
            );
            order = result.rows[0];
        } catch (error) {
            error.stage = error.stage || "order";
            throw error;
        }

        try {
            for (const item of checkoutData.items) {
                await client.query(
                    `INSERT INTO order_item (option_id, order_id, quantity, unit_price)
                     VALUES ($1, $2, $3, $4)`,
                    [item.optionId, order.order_id, item.quantity, item.unitPrice],
                );
            }
        } catch (error) {
            error.stage = error.stage || "order_items";
            throw error;
        }

        let payment;
        try {
            const result = await client.query(
                `INSERT INTO payment (order_id, payment_method, payment_status, amount)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [order.order_id, checkoutData.paymentMethod, checkoutData.paymentStatus, checkoutData.totalAmount],
            );
            payment = result.rows[0];
        } catch (error) {
            error.stage = error.stage || "payment";
            throw error;
        }

        if (promotion) {
            try {
                await client.query(
                    `UPDATE promotions SET quota_used = quota_used + 1, update_at = NOW()
                     WHERE promotion_id = $1`,
                    [promotion.promotion_id],
                );
            } catch (error) {
                error.stage = error.stage || "promotion";
                throw error;
            }
        }

        return { order, payment };
    });
}

export async function postOrderRepository(orderData) {
    const {user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount} = orderData;
    
    // If promotion_id is a code string, look up the actual promotion_id
    let actualPromotionId = null;
    if (promotion_id) {
        const promotionResult = await pool.query(
            `SELECT promotion_id FROM promotions WHERE promotion_code = $1 AND status = 'active'`,
            [promotion_id]
        );
        if (promotionResult.rows.length > 0) {
            actualPromotionId = promotionResult.rows[0].promotion_id;
        }
    }
    
    const queryText = `
      INSERT INTO orders (user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, promotion_id, discount)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    
    const assignData = [user_id, service_id, status, total_price, scheduled_date, scheduled_time, address, province, district, subdistrict, additional_info, actualPromotionId, discount];

    const result = await pool.query(queryText, assignData);
    
    return result.rows[0];
    
}



export async function postOrderItemRepository(orderItemData) {
    const {option_id, order_id, quantity, unit_price} = orderItemData;
    
    const queryText = `
      INSERT INTO order_item (option_id, order_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const assignData = [option_id, order_id, quantity, unit_price];

    const result = await pool.query(queryText, assignData);
    
    return result.rows[0];
}

export async function getUserOrdersRepository(userId) {
    if (!userId) return [];

    let resolvedUserId = userId;
    if (isNaN(Number(userId))) {
      const userRes = await pool.query(`SELECT user_id FROM users WHERE user_id::text = $1 OR email = $1 LIMIT 1`, [String(userId)]);
      if (userRes.rows.length > 0) {
        resolvedUserId = userRes.rows[0].user_id;
      } else {
        return [];
      }
    }

    const queryText = `
      SELECT 
        orders.order_id::text AS "id",
        COALESCE(orders.order_code, 'AD' || LPAD(orders.order_id::text, 8, '0')) AS "orderCode",
        LOWER(orders.status) AS "status",
        orders.scheduled_date AS "scheduledDateRaw",
        orders.scheduled_time AS "scheduledTimeRaw",
        orders.scheduled_at AS "scheduledAt",
        orders.total_price::float8 AS "totalPrice",
        COALESCE(orders.discount, 0)::float8 AS "discount",
        orders.address,
        orders.province,
        orders.district,
        orders.subdistrict,
        orders.additional_info AS "notes",
        orders.service_id::text AS "serviceId",
        services.service_name AS "serviceName",
        payment.payment_method AS "paymentMethod",
        COALESCE(NULLIF(TRIM(tu.full_name), ''), NULLIF(TRIM(CONCAT_WS(' ', tu.first_name, tu.last_name)), ''), NULL) AS "technicianName",
        tu.phone AS "technicianPhone",
        reviews.review_id::text AS "reviewId",
        reviews.rating AS "reviewRating",
        reviews.comment AS "reviewComment",
        orders.created_at AS "createdAt"
      FROM orders
      JOIN services ON services.service_id = orders.service_id
      LEFT JOIN payment ON payment.order_id = orders.order_id
      LEFT JOIN order_assignment oa ON oa.order_id = orders.order_id AND oa.status IN ('ACCEPTED', 'IN_PROGRESS', 'COMPLETED')
      LEFT JOIN technicians t ON t.technician_id = oa.technician_id
      LEFT JOIN users tu ON tu.user_id = t.user_id
      LEFT JOIN reviews ON (reviews.order_id = orders.order_id OR reviews.order_code = orders.order_code)
      WHERE orders.user_id = $1
      ORDER BY orders.created_at DESC, orders.order_id DESC
    `;

    const result = await pool.query(queryText, [resolvedUserId]);
    if (result.rows.length === 0) return [];

    const orderIds = result.rows.map((r) => r.id);
    const itemsResult = await pool.query(
      `
        SELECT
          order_item.order_id::text AS "orderId",
          order_item.item_id::text AS "id",
          COALESCE(service_options.option_name, services.service_name, 'รายการบริการ') AS "name",
          order_item.quantity::int AS quantity,
          order_item.unit_price::float8 AS price,
          COALESCE(service_options.unit, 'เครื่อง') AS unit
        FROM order_item
        LEFT JOIN service_options ON service_options.option_id = order_item.option_id
        LEFT JOIN orders ON orders.order_id = order_item.order_id
        LEFT JOIN services ON services.service_id = orders.service_id
        WHERE order_item.order_id = ANY($1::bigint[])
        ORDER BY order_item.item_id ASC
      `,
      [orderIds]
    );

    const itemsByOrder = new Map();
    for (const item of itemsResult.rows) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
      });
      itemsByOrder.set(item.orderId, list);
    }

    const statusTextMap = {
      pending: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      completed: "ดำเนินการสำเร็จ",
      cancelled: "ยกเลิกแล้ว",
    };

    return result.rows.map((row) => {
      const items = itemsByOrder.get(row.id) || [];
      const status = row.status === "in_progress" ? "in_progress" : row.status === "completed" ? "completed" : row.status === "cancelled" ? "cancelled" : "pending";

      let scheduledDate = "";
      if (row.scheduledDateRaw) {
        const d = new Date(row.scheduledDateRaw);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear() + 543;
          scheduledDate = `${day}/${month}/${year}`;
        }
      }
      if (!scheduledDate && row.scheduledAt) {
        const d = new Date(row.scheduledAt);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear() + 543;
          scheduledDate = `${day}/${month}/${year}`;
        }
      }

      let scheduledTime = "";
      if (row.scheduledTimeRaw) {
        scheduledTime = String(row.scheduledTimeRaw).slice(0, 5) + " น.";
      } else if (row.scheduledAt) {
        const d = new Date(row.scheduledAt);
        if (!isNaN(d.getTime())) {
          scheduledTime = `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")} น.`;
        }
      }

      const addressParts = [row.address, row.district, row.subdistrict, row.province].filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(" ") : (row.address || "");

      return {
        id: row.id,
        orderCode: row.orderCode,
        status,
        statusText: statusTextMap[status] || "รอดำเนินการ",
        scheduledDate: scheduledDate || "25/04/2567",
        scheduledTime: scheduledTime || "13.00 น.",
        technicianName: row.technicianName,
        technicianPhone: row.technicianPhone,
        totalPrice: Number(row.totalPrice),
        discount: Number(row.discount || 0),
        subtotal: Number(row.totalPrice) + Number(row.discount || 0),
        address: fullAddress,
        notes: row.notes || "",
        paymentMethod: row.paymentMethod || "PromptPay",
        serviceId: row.serviceId,
        serviceName: row.serviceName,
        technicianId: row.technicianId,
        items: items.length > 0 ? items : [
          {
            id: `item-${row.id}`,
            name: row.serviceName || "บริการซ่อมบำรุง",
            quantity: 1,
            unit: "รายการ",
            price: Number(row.totalPrice),
          }
        ],
        isReviewed: Boolean(row.reviewId),
        reviewRating: row.reviewRating ? Number(row.reviewRating) : undefined,
        reviewComment: row.reviewComment || undefined,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      };
    });
}

export async function getOrderByIdRepository(orderIdOrCode, userId) {
    const isCode = isNaN(Number(orderIdOrCode));
    const whereClause = isCode 
      ? `(orders.order_code = $1 OR 'AD' || LPAD(orders.order_id::text, 8, '0') = $1)` 
      : `orders.order_id = $1`;

    const params = [orderIdOrCode];
    let userFilter = "";
    if (userId) {
      params.push(userId);
      userFilter = ` AND orders.user_id = $${params.length}`;
    }

    const queryText = `
      SELECT 
        orders.order_id::text AS "id",
        COALESCE(orders.order_code, 'AD' || LPAD(orders.order_id::text, 8, '0')) AS "orderCode",
        LOWER(orders.status) AS "status",
        orders.scheduled_date AS "scheduledDateRaw",
        orders.scheduled_time AS "scheduledTimeRaw",
        orders.scheduled_at AS "scheduledAt",
        orders.total_price::float8 AS "totalPrice",
        COALESCE(orders.discount, 0)::float8 AS "discount",
        orders.address,
        orders.province,
        orders.district,
        orders.subdistrict,
        orders.additional_info AS "notes",
        orders.service_id::text AS "serviceId",
        services.service_name AS "serviceName",
        payment.payment_method AS "paymentMethod",
        COALESCE(NULLIF(TRIM(tu.full_name), ''), NULLIF(TRIM(CONCAT_WS(' ', tu.first_name, tu.last_name)), ''), NULL) AS "technicianName",
        tu.phone AS "technicianPhone",
        reviews.review_id::text AS "reviewId",
        reviews.rating AS "reviewRating",
        reviews.comment AS "reviewComment",
        orders.created_at AS "createdAt"
      FROM orders
      JOIN services ON services.service_id = orders.service_id
      LEFT JOIN payment ON payment.order_id = orders.order_id
      LEFT JOIN order_assignment oa ON oa.order_id = orders.order_id AND oa.status IN ('ACCEPTED', 'IN_PROGRESS', 'COMPLETED')
      LEFT JOIN technicians t ON t.technician_id = oa.technician_id
      LEFT JOIN users tu ON tu.user_id = t.user_id
      LEFT JOIN reviews ON (reviews.order_id = orders.order_id OR reviews.order_code = orders.order_code)
      WHERE ${whereClause}${userFilter}
      LIMIT 1
    `;

    const result = await pool.query(queryText, params);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const itemsResult = await pool.query(
      `
        SELECT
          order_item.item_id::text AS "id",
          COALESCE(service_options.option_name, services.service_name, 'รายการบริการ') AS "name",
          order_item.quantity::int AS quantity,
          order_item.unit_price::float8 AS price,
          COALESCE(service_options.unit, 'เครื่อง') AS unit
        FROM order_item
        LEFT JOIN service_options ON service_options.option_id = order_item.option_id
        LEFT JOIN orders ON orders.order_id = order_item.order_id
        LEFT JOIN services ON services.service_id = orders.service_id
        WHERE order_item.order_id = $1
        ORDER BY order_item.item_id ASC
      `,
      [row.id]
    );

    const status = row.status === "in_progress" ? "in_progress" : row.status === "completed" ? "completed" : row.status === "cancelled" ? "cancelled" : "pending";
    const statusTextMap = {
      pending: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      completed: "ดำเนินการสำเร็จ",
      cancelled: "ยกเลิกแล้ว",
    };

    let scheduledDate = "";
    if (row.scheduledDateRaw) {
      const d = new Date(row.scheduledDateRaw);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear() + 543;
        scheduledDate = `${day}/${month}/${year}`;
      }
    }

    let scheduledTime = "";
    if (row.scheduledTimeRaw) {
      scheduledTime = String(row.scheduledTimeRaw).slice(0, 5) + " น.";
    }

    const addressParts = [row.address, row.district, row.subdistrict, row.province].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(" ") : (row.address || "");

    return {
      id: row.id,
      orderCode: row.orderCode,
      status,
      statusText: statusTextMap[status] || "รอดำเนินการ",
      scheduledDate: scheduledDate || "25/04/2567",
      scheduledTime: scheduledTime || "13.00 น.",
      technicianName: row.technicianName,
      technicianPhone: row.technicianPhone,
      totalPrice: Number(row.totalPrice),
      discount: Number(row.discount || 0),
      subtotal: Number(row.totalPrice) + Number(row.discount || 0),
      address: fullAddress,
      notes: row.notes || "",
      paymentMethod: row.paymentMethod || "PromptPay",
      items: itemsResult.rows.length > 0 ? itemsResult.rows : [
        {
          id: `item-${row.id}`,
          name: row.serviceName || "บริการซ่อมบำรุง",
          quantity: 1,
          unit: "รายการ",
          price: Number(row.totalPrice),
        }
      ],
      isReviewed: Boolean(row.reviewId),
      reviewRating: row.reviewRating ? Number(row.reviewRating) : undefined,
      reviewComment: row.reviewComment || undefined,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    };
}
