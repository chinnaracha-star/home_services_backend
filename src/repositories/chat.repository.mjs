import { query } from "../configs/db.mjs";

const PARTICIPATING_ASSIGNMENT_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"];

export async function syncChatRooms(user) {
  const role = String(user.role).toUpperCase();

  if (role === "USER") {
    await query(
      `
        INSERT INTO chat_rooms (room_type, customer_id)
        VALUES ('SUPPORT', $1)
        ON CONFLICT (customer_id) WHERE room_type = 'SUPPORT' DO NOTHING
      `,
      [user.id],
    );
  }

  if (role === "USER" || role === "TECHNICIAN") {
    await query(
      `
        INSERT INTO chat_rooms (room_type, customer_id, order_id)
        SELECT DISTINCT 'ORDER', orders.user_id, orders.order_id
        FROM orders
        JOIN order_assignment assignment ON assignment.order_id = orders.order_id
        JOIN technicians ON technicians.technician_id = assignment.technician_id
        WHERE UPPER(assignment.status) = ANY($2::text[])
          AND (
            ($3 = 'USER' AND orders.user_id = $1)
            OR ($3 = 'TECHNICIAN' AND technicians.user_id = $1)
          )
        ON CONFLICT (order_id) WHERE room_type = 'ORDER' DO NOTHING
      `,
      [user.id, PARTICIPATING_ASSIGNMENT_STATUSES, role],
    );
  }
}

export async function findChatRooms(user) {
  const role = String(user.role).toUpperCase();
  const params = [user.id, role, PARTICIPATING_ASSIGNMENT_STATUSES];
  const result = await query(
    `
      SELECT
        room.room_id::text AS "roomId",
        room.room_type AS "roomType",
        room.customer_id::text AS "customerId",
        room.order_id::text AS "orderId",
        CASE
          WHEN room.room_type = 'SUPPORT' AND $2 = 'ADMIN'
            THEN COALESCE(customer.full_name, customer.email, 'ลูกค้า')
          WHEN room.room_type = 'SUPPORT' THEN 'ศูนย์ช่วยเหลือ'
          WHEN $2 = 'TECHNICIAN'
            THEN COALESCE(customer.full_name, customer.email, 'ลูกค้า')
          ELSE COALESCE(technician_user.full_name, technician_user.email, 'ช่างผู้ให้บริการ')
        END AS title,
        COALESCE(orders.order_code, 'HS-' || room.order_id::text) AS "orderCode",
        CASE
          WHEN room.room_type = 'SUPPORT' THEN true
          ELSE UPPER(COALESCE(orders.status, '')) NOT IN ('COMPLETED', 'CANCELLED', 'CANCELED')
            AND UPPER(COALESCE(assignment.status, '')) IN ('ACCEPTED', 'IN_PROGRESS')
        END AS "canSend",
        latest.content AS "lastMessage",
        latest.created_at AS "lastMessageAt"
      FROM chat_rooms room
      JOIN users customer ON customer.user_id = room.customer_id
      LEFT JOIN orders ON orders.order_id = room.order_id
      LEFT JOIN LATERAL (
        SELECT selected_assignment.*
        FROM order_assignment selected_assignment
        JOIN technicians selected_technician
          ON selected_technician.technician_id = selected_assignment.technician_id
        WHERE selected_assignment.order_id = room.order_id
          AND UPPER(selected_assignment.status) = ANY($3::text[])
          AND ($2 <> 'TECHNICIAN' OR selected_technician.user_id = $1)
        ORDER BY selected_assignment.assigned_at DESC NULLS LAST
        LIMIT 1
      ) assignment ON true
      LEFT JOIN technicians ON technicians.technician_id = assignment.technician_id
      LEFT JOIN users technician_user ON technician_user.user_id = technicians.user_id
      LEFT JOIN LATERAL (
        SELECT message.content, message.created_at
        FROM chat_messages message
        WHERE message.room_id = room.room_id
        ORDER BY message.created_at DESC, message.message_id DESC
        LIMIT 1
      ) latest ON true
      WHERE
        ($2 = 'ADMIN' AND room.room_type = 'SUPPORT')
        OR ($2 = 'USER' AND room.customer_id = $1)
        OR (
          $2 = 'TECHNICIAN'
          AND room.room_type = 'ORDER'
          AND assignment.assignment_id IS NOT NULL
        )
      ORDER BY latest.created_at DESC NULLS LAST, room.created_at DESC
    `,
    params,
  );

  return result.rows;
}

export async function findChatRoomAccess(user, roomId) {
  const role = String(user.role).toUpperCase();
  const result = await query(
    `
      SELECT
        room.room_id::text AS "roomId",
        room.room_type AS "roomType",
        room.customer_id::text AS "customerId",
        CASE
          WHEN room.room_type = 'SUPPORT' THEN true
          ELSE UPPER(COALESCE(orders.status, '')) NOT IN ('COMPLETED', 'CANCELLED', 'CANCELED')
            AND UPPER(COALESCE(assignment.status, '')) IN ('ACCEPTED', 'IN_PROGRESS')
        END AS "canSend"
      FROM chat_rooms room
      LEFT JOIN orders ON orders.order_id = room.order_id
      LEFT JOIN LATERAL (
        SELECT selected_assignment.*
        FROM order_assignment selected_assignment
        JOIN technicians selected_technician
          ON selected_technician.technician_id = selected_assignment.technician_id
        WHERE selected_assignment.order_id = room.order_id
          AND UPPER(selected_assignment.status) = ANY($4::text[])
          AND ($3 <> 'TECHNICIAN' OR selected_technician.user_id = $2)
        ORDER BY
          CASE UPPER(selected_assignment.status)
            WHEN 'IN_PROGRESS' THEN 1
            WHEN 'ACCEPTED' THEN 2
            ELSE 3
          END,
          selected_assignment.assigned_at DESC NULLS LAST
        LIMIT 1
      ) assignment ON true
      LEFT JOIN technicians ON technicians.technician_id = assignment.technician_id
      WHERE room.room_id = $1
        AND (
          ($3 = 'ADMIN' AND room.room_type = 'SUPPORT')
          OR ($3 = 'USER' AND room.customer_id = $2)
          OR (
            $3 = 'TECHNICIAN'
            AND room.room_type = 'ORDER'
            AND assignment.assignment_id IS NOT NULL
          )
        )
      LIMIT 1
    `,
    [roomId, user.id, role, PARTICIPATING_ASSIGNMENT_STATUSES],
  );

  return result.rows[0] ?? null;
}

export async function findChatMessages(roomId, limit = 100) {
  const result = await query(
    `
      SELECT * FROM (
        SELECT
          message.message_id::text AS "messageId",
          message.room_id::text AS "roomId",
          message.sender_id::text AS "senderId",
          COALESCE(sender.full_name, sender.email, 'ผู้ใช้') AS "senderName",
          UPPER(sender.role) AS "senderRole",
          message.content,
          message.created_at AS "createdAt"
        FROM chat_messages message
        JOIN users sender ON sender.user_id = message.sender_id
        WHERE message.room_id = $1
        ORDER BY message.created_at DESC, message.message_id DESC
        LIMIT $2
      ) recent
      ORDER BY recent."createdAt", recent."messageId"::bigint
    `,
    [roomId, limit],
  );

  return result.rows;
}

export async function createChatMessage({ roomId, senderId, content }) {
  const result = await query(
    `
      WITH inserted AS (
        INSERT INTO chat_messages (room_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      )
      SELECT
        inserted.message_id::text AS "messageId",
        inserted.room_id::text AS "roomId",
        inserted.sender_id::text AS "senderId",
        COALESCE(sender.full_name, sender.email, 'ผู้ใช้') AS "senderName",
        UPPER(sender.role) AS "senderRole",
        inserted.content,
        inserted.created_at AS "createdAt"
      FROM inserted
      JOIN users sender ON sender.user_id = inserted.sender_id
    `,
    [roomId, senderId, content],
  );

  await query("UPDATE chat_rooms SET updated_at = now() WHERE room_id = $1", [roomId]);
  return result.rows[0];
}
