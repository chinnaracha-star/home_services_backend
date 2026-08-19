import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../app.mjs";
import { pool } from "../configs/db.mjs";

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(method, path, { body, headers } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { response, body: await response.json().catch(() => null) };
}

try {
  console.log("Testing Technician settings API...");

  const unauthenticated = await request("GET", "/api/technician/me");
  assert.equal(unauthenticated.response.status, 401);

  const login = await request("POST", "/auth/technician/login", {
    body: {
      email: "technician@example.com",
      password: "technicianPassword123!",
    },
  });
  assert.equal(login.response.status, 200);
  const token = login.body.data.session.accessToken;

  const profile = await request("GET", "/api/technician/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(profile.response.status, 200);
  assert.ok(profile.body.data.technicianId);
  assert.equal(typeof profile.body.data.isAvailable, "boolean");
  assert.ok(Array.isArray(profile.body.data.serviceIds));

  const invalidUpdate = await request("PATCH", "/api/technician/me", {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      firstName: "",
      lastName: "",
      phone: "123",
      address: "",
      isAvailable: "yes",
      serviceIds: "aircon",
    },
  });
  assert.equal(invalidUpdate.response.status, 400);
  assert.equal(invalidUpdate.body.code, "VALIDATION_ERROR");

  const updated = await request("PATCH", "/api/technician/me", {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      firstName: "สมาน",
      lastName: "เยี่ยมยอด",
      phone: "0890002345",
      address: "332 อาคารเดอะไนน์ทาวเวอร์ กรุงเทพมหานคร",
      isAvailable: true,
      serviceIds: profile.body.data.serviceIds,
    },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.data.firstName, "สมาน");
  assert.equal(updated.body.data.phone, "0890002345");
  assert.equal(updated.body.data.isAvailable, true);

  console.log("Technician settings API tests passed!");
} finally {
  server.close();
  await once(server, "close");
  await pool.end();
}
