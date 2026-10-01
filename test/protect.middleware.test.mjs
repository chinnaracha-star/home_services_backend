import test from "node:test";
import assert from "node:assert/strict";
import { createProtect } from "../src/middlewares/protect.middleware.mjs";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("protect rejects a request without authentication", async () => {
  const res = responseRecorder();
  const protect = createProtect();

  await protect({ headers: {} }, res, () => assert.fail());

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "UNAUTHORIZED");
});

test("protect accepts a development user id", async () => {
  const req = { headers: { "x-user-id": "1" } };
  let called = false;
  const protect = createProtect({
    findById: async () => ({ id: "1", email: "dev@example.com", role: "USER" }),
    allowDevUserId: true,
  });

  await protect(req, responseRecorder(), () => { called = true; });

  assert.equal(called, true);
  assert.equal(req.user.id, "1");
});

test("protect attaches auth metadata for a bearer token", async () => {
  const req = { headers: { authorization: "Bearer valid-token" } };
  let called = false;
  const protect = createProtect({
    authClient: {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "auth-uuid",
              email: "user@example.com",
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    },
    findByEmail: async () => ({
      id: "7",
      email: "user@example.com",
      role: "USER",
    }),
  });

  await protect(req, responseRecorder(), () => { called = true; });

  assert.equal(called, true);
  assert.equal(req.user.id, "7");
  assert.equal(req.authUserId, "auth-uuid");
  assert.equal(req.accessToken, "valid-token");
});
