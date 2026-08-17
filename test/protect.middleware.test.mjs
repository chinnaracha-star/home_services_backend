import test from "node:test";
import assert from "node:assert/strict";
import { protect } from "../src/middlewares/protect.middleware.mjs";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("protect rejects a missing user id", () => {
  const res = responseRecorder();
  protect({ headers: {} }, res, () => assert.fail());
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("protect accepts a positive bigint id", () => {
  const req = { headers: { "x-user-id": "1" } };
  let called = false;
  protect(req, responseRecorder(), () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.user.id, "1");
});
