import test from "node:test";
import assert from "node:assert/strict";
import { validateChatRequest } from "../src/validators/chatbot.validator.mjs";
import {
  detectChatLanguage,
  isClearlyOutOfScope,
} from "../src/utils/chatbot-scope.mjs";
import { BOOKING_ACTION_MESSAGES } from "../src/constants/chatbot.constants.mjs";

test("chatbot request trims valid input and limits client history", () => {
  const result = validateChatRequest({
    message: "  ล้างแอร์ราคาเท่าไหร่  ",
    requestId: "request_12345678",
    conversationId: "12",
    history: Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: `message ${index}`,
    })),
  });

  assert.equal(result.message, "ล้างแอร์ราคาเท่าไหร่");
  assert.equal(result.requestId, "request_12345678");
  assert.equal(result.conversationId, "12");
  assert.equal(result.history.length, 10);
  assert.equal(result.history[0].content, "message 2");
});

test("chatbot request rejects empty, oversized, and invalid conversation inputs", () => {
  assert.throws(() => validateChatRequest({ message: " " }), { code: "VALIDATION_ERROR" });
  assert.throws(() => validateChatRequest({ message: "a".repeat(1001) }), {
    code: "VALIDATION_ERROR",
  });
  assert.throws(() => validateChatRequest({ message: "hello", conversationId: "other" }), {
    code: "VALIDATION_ERROR",
  });
  assert.throws(() => validateChatRequest({ message: "hello", requestId: "short" }), {
    code: "VALIDATION_ERROR",
  });
});

test("scope guard rejects only clearly unrelated messages", () => {
  assert.equal(isClearlyOutOfScope("ช่วยเขียนโปรแกรมให้หน่อย"), true);
  assert.equal(isClearlyOutOfScope("ล้างแอร์ราคาเท่าไหร่"), false);
  assert.equal(isClearlyOutOfScope("สวัสดีครับ"), false);
  assert.equal(detectChatLanguage("มีบริการอะไรบ้าง"), "th");
  assert.equal(detectChatLanguage("What services do you have?"), "en");
});

test("booking action fallback states that the assistant cannot create orders", () => {
  assert.match(BOOKING_ACTION_MESSAGES.th, /ไม่สามารถจองบริการหรือสร้างคำสั่งซื้อ/);
  assert.match(BOOKING_ACTION_MESSAGES.en, /cannot book a service or create an order/);
});
