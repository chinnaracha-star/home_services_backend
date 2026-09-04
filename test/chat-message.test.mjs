import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChatMessage } from "../src/utils/chat-message.mjs";

test("normalizes valid chat messages", () => {
  assert.equal(normalizeChatMessage("  สวัสดีครับ  "), "สวัสดีครับ");
});

test("rejects empty, non-string, and oversized chat messages", () => {
  assert.equal(normalizeChatMessage("   "), null);
  assert.equal(normalizeChatMessage(null), null);
  assert.equal(normalizeChatMessage("a".repeat(2001)), null);
});
