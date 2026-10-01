import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toScheduledAt } from "../src/utils/schedule.mjs";

describe("toScheduledAt", () => {
    it("treats the booked time as Asia/Bangkok", () => {
        assert.equal(toScheduledAt("2026-08-28", "10:52"), "2026-08-28T03:52:00.000Z");
        assert.equal(toScheduledAt("2026-08-28", "17:52:00"), "2026-08-28T10:52:00.000Z");
    });
});
