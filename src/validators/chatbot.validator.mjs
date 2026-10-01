import { CHAT_MAX_MESSAGE_LENGTH } from "../constants/chatbot.constants.mjs";
import { HttpError } from "../utils/http-error.mjs";
import { randomUUID } from "node:crypto";

export function validateChatRequest(body) {
  const rawMessage = body?.message;
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!message || message.length > CHAT_MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid chat message", [
      {
        field: "message",
        message: `Message must contain 1-${CHAT_MAX_MESSAGE_LENGTH} characters`,
      },
    ]);
  }

  const conversationId = body?.conversationId;
  if (
    conversationId !== undefined &&
    conversationId !== null &&
    (!/^\d+$/.test(String(conversationId)) || Number(conversationId) <= 0)
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid conversation", [
      { field: "conversationId", message: "Conversation ID must be a positive integer" },
    ]);
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .slice(-10)
        .filter(
          (item) =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim() &&
            item.content.length <= (item.role === "user" ? CHAT_MAX_MESSAGE_LENGTH : 5000),
        )
        .map((item) => ({ role: item.role, content: item.content.trim() }))
    : [];

  const rawRequestId = body?.requestId;
  if (
    rawRequestId !== undefined &&
    (typeof rawRequestId !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(rawRequestId))
  ) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request ID", [
      { field: "requestId", message: "Request ID is invalid" },
    ]);
  }

  return {
    message,
    requestId: rawRequestId || randomUUID(),
    conversationId: conversationId == null ? null : String(conversationId),
    history,
  };
}
