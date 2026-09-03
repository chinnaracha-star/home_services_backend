import test from "node:test";
import assert from "node:assert/strict";
import { createOptionalChatAuth } from "../src/middlewares/optional-chat-auth.middleware.mjs";

test("optional chat auth permits a guest without fabricating a user", async () => {
  const req = { headers: {} };
  let nextError;
  await createOptionalChatAuth()(req, {}, (error) => { nextError = error; });
  assert.equal(nextError, undefined);
  assert.equal(req.user, undefined);
});

test("optional chat auth ignores x-user-id and verifies bearer identity", async () => {
  const req = { headers: { "x-user-id": "99", authorization: "Bearer valid" } };
  let nextError;
  const middleware = createOptionalChatAuth({
    authClient: {
      auth: {
        getUser: async () => ({
          data: { user: { email: "customer@example.com" } },
          error: null,
        }),
      },
    },
    findByEmail: async () => ({ id: "7", email: "customer@example.com", role: "USER" }),
  });
  await middleware(req, {}, (error) => { nextError = error; });
  assert.equal(nextError, undefined);
  assert.equal(req.user.id, "7");
});

test("optional chat auth rejects invalid tokens and non-customer roles", async () => {
  const invalidToken = createOptionalChatAuth({
    authClient: { auth: { getUser: async () => ({ data: { user: null }, error: {} }) } },
  });
  let tokenError;
  await invalidToken(
    { headers: { authorization: "Bearer invalid" } },
    {},
    (error) => { tokenError = error; },
  );
  assert.equal(tokenError.status, 401);

  const admin = createOptionalChatAuth({
    authClient: {
      auth: {
        getUser: async () => ({ data: { user: { email: "admin@example.com" } }, error: null }),
      },
    },
    findByEmail: async () => ({ id: "1", role: "ADMIN" }),
  });
  let roleError;
  await admin(
    { headers: { authorization: "Bearer valid" } },
    {},
    (error) => { roleError = error; },
  );
  assert.equal(roleError.status, 403);
});
