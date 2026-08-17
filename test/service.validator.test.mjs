import test from "node:test";
import assert from "node:assert/strict";
import {
  parseServiceId,
  parseServiceListQuery,
} from "../src/validators/service.validator.mjs";

test("parses featured and limit query values", () => {
  assert.deepEqual(parseServiceListQuery({ featured: "true", limit: "3" }), {
    featured: true,
    limit: 3,
  });
});

test("rejects invalid limits", () => {
  assert.throws(() => parseServiceListQuery({ limit: "0" }), {
    code: "VALIDATION_ERROR",
  });
  assert.throws(() => parseServiceListQuery({ limit: "101" }), {
    code: "VALIDATION_ERROR",
  });
});

test("rejects an invalid featured query", () => {
  assert.throws(() => parseServiceListQuery({ featured: "yes" }), {
    code: "VALIDATION_ERROR",
  });
});

test("accepts only positive service ids", () => {
  assert.equal(parseServiceId("12"), "12");
  assert.equal(parseServiceId("0"), null);
  assert.equal(parseServiceId("service-1"), null);
});
