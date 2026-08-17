import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../app.mjs";
import { pool } from "../configs/db.mjs";

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function post(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => null) };
}

async function get(path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  return { response, body: await response.json().catch(() => null) };
}

try {
  console.log("Testing Auth API...");

  // 1. Test Login with missing body (Validation error)
  const invalidLogin = await post("/auth/login", { email: "invalid-email" });
  assert.equal(invalidLogin.response.status, 400);
  assert.equal(invalidLogin.body.code, "VALIDATION_ERROR");

  // 2. Test Register with invalid phone
  const invalidRegister = await post("/auth/register", {
    fullName: "T",
    email: "test@example.com",
    phone: "123",
    password: "123",
  });
  assert.equal(invalidRegister.response.status, 400);
  assert.equal(invalidRegister.body.code, "VALIDATION_ERROR");

  // 3. Test Admin category without auth (should be 401)
  const unauthAdmin = await get("/api/admin/categories");
  assert.equal(unauthAdmin.response.status, 401);

  console.log("Auth API basic tests passed!");
} finally {
  server.close();
  await once(server, "close");
  await pool.end();
}
