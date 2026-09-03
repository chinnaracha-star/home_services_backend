import { query, runTransaction } from "../configs/db.mjs";
import {
  CHAT_HISTORY_DISPLAY_LIMIT,
  CHAT_HISTORY_LIMIT,
  CHAT_RETENTION_DAYS,
} from "../constants/chatbot.constants.mjs";
import { HttpError } from "../utils/http-error.mjs";

async function deleteExpiredMessages(conversationId, queryFn = query) {
  await queryFn(
    `DELETE FROM ai_chat_messages
     WHERE conversation_id = $1
       AND created_at < now() - ($2 * interval '1 day')`,
    [conversationId, CHAT_RETENTION_DAYS],
  );
}

export async function deleteAllExpiredChatMessages() {
  await query(
    `DELETE FROM ai_chat_messages
     WHERE created_at < now() - ($1 * interval '1 day')`,
    [CHAT_RETENTION_DAYS],
  );
}

export async function getOrCreateConversation(userId, requestedConversationId = null) {
  if (requestedConversationId) {
    const owned = await query(
      `SELECT conversation_id::text AS "conversationId"
       FROM ai_conversations
       WHERE conversation_id = $1 AND user_id = $2`,
      [requestedConversationId, userId],
    );
    if (!owned.rows[0]) {
      throw new HttpError(404, "CHAT_CONVERSATION_NOT_FOUND", "Conversation was not found");
    }
    return owned.rows[0];
  }

  const result = await query(
    `INSERT INTO ai_conversations (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = ai_conversations.updated_at
     RETURNING conversation_id::text AS "conversationId"`,
    [userId],
  );
  return result.rows[0];
}

export async function findConversationMessages(
  conversationId,
  limit = CHAT_HISTORY_LIMIT,
) {
  await deleteExpiredMessages(conversationId);
  const result = await query(
    `SELECT message_id::text AS id, role, content, created_at AS "createdAt"
     FROM (
       SELECT message_id, role, content, created_at
       FROM ai_chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC, message_id DESC
       LIMIT $2
     ) recent
     ORDER BY created_at ASC, message_id ASC`,
    [conversationId, limit],
  );
  return result.rows;
}

export async function findDisplayHistory(conversationId) {
  return findConversationMessages(conversationId, CHAT_HISTORY_DISPLAY_LIMIT);
}

export async function saveConversationExchange(
  conversationId,
  requestId,
  userMessage,
  assistantMessage,
) {
  return runTransaction(async (client) => {
    await deleteExpiredMessages(conversationId, client.query.bind(client));
    const userResult = await client.query(
      `INSERT INTO ai_chat_messages (conversation_id, role, request_id, content)
       VALUES ($1, 'user', $2, $3)
       ON CONFLICT (conversation_id, request_id)
         WHERE role = 'user' AND request_id IS NOT NULL
       DO NOTHING
       RETURNING message_id::text AS id, role, content, created_at AS "createdAt"`,
      [conversationId, requestId, userMessage],
    );
    if (userResult.rows.length === 0) {
      const existing = await client.query(
        `SELECT message_id::text AS id, role, content, created_at AS "createdAt"
         FROM ai_chat_messages
         WHERE conversation_id = $1 AND request_id = $2
         ORDER BY message_id ASC`,
        [conversationId, requestId],
      );
      return existing.rows;
    }
    const assistantResult = await client.query(
      `INSERT INTO ai_chat_messages (conversation_id, role, request_id, content)
       VALUES ($1, 'assistant', $2, $3)
       RETURNING message_id::text AS id, role, content, created_at AS "createdAt"`,
      [conversationId, requestId, assistantMessage],
    );
    await client.query(
      `UPDATE ai_conversations SET updated_at = now() WHERE conversation_id = $1`,
      [conversationId],
    );
    return [...userResult.rows, ...assistantResult.rows];
  });
}

export async function clearConversationMessages(conversationId) {
  await query(`DELETE FROM ai_chat_messages WHERE conversation_id = $1`, [conversationId]);
  await query(
    `UPDATE ai_conversations SET updated_at = now() WHERE conversation_id = $1`,
    [conversationId],
  );
}
