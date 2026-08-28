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

  const unauthPasswordChange = await fetch(`${baseUrl}/api/users/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: "userPassword123!",
      newPassword: "newPassword123!",
      confirmNewPassword: "newPassword123!",
    }),
  });
  assert.equal(unauthPasswordChange.status, 401);

  // 4. User register validation (does not change old /auth/register)
  const invalidUserRegister = await post("/auth/user/register", {
    fullName: "สมชาย",
    email: "test@example.co.th",
    phone: "123",
    password: "123",
    acceptedTerms: false,
  });
  assert.equal(invalidUserRegister.response.status, 400);
  assert.equal(invalidUserRegister.body.code, "VALIDATION_ERROR");

  const missingTerms = await post("/auth/user/register", {
    fullName: "John Doe",
    email: "user@example.com",
    phone: "0812345678",
    password: "password12345",
    acceptedTerms: false,
  });
  assert.equal(missingTerms.response.status, 400);
  assert.ok(missingTerms.body.errors.some((error) => error.field === "acceptedTerms"));

  const shortPasswordUserLogin = await post("/auth/user/login", {
    email: "user@example.com",
    password: "short",
  });
  assert.equal(shortPasswordUserLogin.response.status, 400);
  assert.ok(shortPasswordUserLogin.body.errors.some((error) => error.field === "password"));

  const invalidTechnicianLogin = await post("/auth/technician/login", {
    email: "invalid-email",
  });
  assert.equal(invalidTechnicianLogin.response.status, 400);
  assert.equal(invalidTechnicianLogin.body.code, "VALIDATION_ERROR");

  const userOnTechnicianLogin = await post("/auth/technician/login", {
    email: "user@user.com",
    password: "userPassword123!",
  });
  assert.notEqual(userOnTechnicianLogin.response.status, 200);
  if (userOnTechnicianLogin.response.status === 403) {
    assert.equal(userOnTechnicianLogin.body.code, "NOT_TECHNICIAN");
  }

  const technicianLogin = await post("/auth/technician/login", {
    email: "technician@example.com",
    password: "technicianPassword123!",
  });
  assert.equal(technicianLogin.response.status, 200);
  assert.equal(technicianLogin.body.data.user.role, "TECHNICIAN");
  assert.ok(technicianLogin.body.data.technician.technicianId);
  assert.ok(technicianLogin.body.data.session.accessToken);

  console.log("Auth API basic tests passed!");
} finally {
  server.close();
  await once(server, "close");
  await pool.end();
}
