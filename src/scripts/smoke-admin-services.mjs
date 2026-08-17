import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../app.mjs";
import { pool, query } from "../configs/db.mjs";

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(method, path, body = null, headers = {}) {
  const reqHeaders = { "Content-Type": "application/json", ...headers };
  const options = { method, headers: reqHeaders };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${baseUrl}${path}`, options);
  const json = await response.json().catch(() => null);
  return { response, body: json };
}

try {
  console.log("=== Running Admin Services API Smoke Tests ===");

  // 1. Check unauthorized access without token/headers
  console.log("1. Testing 401 on unauthenticated access...");
  const unauthRes = await request("GET", "/api/admin/services");
  assert.equal(unauthRes.response.status, 401);

  // Find or create an admin user for testing
  let adminRes = await query("SELECT user_id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1");
  let adminId;
  if (adminRes.rows.length > 0) {
    adminId = String(adminRes.rows[0].user_id);
  } else {
    // If no admin exists in users table, insert temporary or update one
    const insertAdmin = await query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'ADMIN') RETURNING user_id",
      [`test-admin-${Date.now()}@example.com`, "hash123", "Test Admin"]
    );
    adminId = String(insertAdmin.rows[0].user_id);
  }

  const adminHeaders = { "x-user-id": adminId };

  // Find a category for testing
  let catRes = await query("SELECT category_id, name FROM categories LIMIT 1");
  let testCategoryId;
  let testCategoryName;
  if (catRes.rows.length > 0) {
    testCategoryId = String(catRes.rows[0].category_id);
    testCategoryName = catRes.rows[0].name;
  } else {
    const insertCat = await query("INSERT INTO categories (name) VALUES ($1) RETURNING category_id, name", [
      "หมวดหมู่ทดสอบ",
    ]);
    testCategoryId = String(insertCat.rows[0].category_id);
    testCategoryName = insertCat.rows[0].name;
  }

  // 2. Test Get All Services
  console.log("2. Testing GET /api/admin/services...");
  const listRes = await request("GET", "/api/admin/services", null, adminHeaders);
  assert.equal(listRes.response.status, 200);
  assert.ok(Array.isArray(listRes.body.data));

  // 3. Test Create Service (Validation Error)
  console.log("3. Testing Validation Error on POST /api/admin/services...");
  const invalidCreate = await request("POST", "/api/admin/services", { name: "" }, adminHeaders);
  assert.equal(invalidCreate.response.status, 400);

  // 4. Test Create Service (Success)
  console.log("4. Testing POST /api/admin/services (Success)...");
  const createPayload = {
    name: `บริการทดสอบระบบ ${Date.now()}`,
    categoryId: testCategoryId,
    imageUrl: "https://example.com/test-service.jpg",
    serviceOptions: [
      { name: "รายการย่อยที่ 1", price: 500, unit: "เครื่อง" },
      { name: "รายการย่อยที่ 2", price: 850, unit: "จุด" },
    ],
  };
  const createRes = await request("POST", "/api/admin/services", createPayload, adminHeaders);
  assert.equal(createRes.response.status, 201);
  assert.ok(createRes.body.data);
  const createdService = createRes.body.data;
  assert.equal(createdService.name, createPayload.name);
  assert.equal(createdService.serviceOptions.length, 2);
  const createdId = String(createdService.id);

  // 5. Test Get Service by ID
  console.log("5. Testing GET /api/admin/services/:id...");
  const getByIdRes = await request("GET", `/api/admin/services/${createdId}`, null, adminHeaders);
  assert.equal(getByIdRes.response.status, 200);
  assert.equal(getByIdRes.body.data.id, createdId);
  assert.equal(getByIdRes.body.data.serviceOptions.length, 2);

  // 6. Test Update Service
  console.log("6. Testing PUT/PATCH /api/admin/services/:id...");
  const updatePayload = {
    name: `${createPayload.name} (Updated)`,
    categoryId: testCategoryId,
    imageUrl: "https://example.com/updated.jpg",
    serviceOptions: [
      { name: "รายการย่อยแก้ไขแล้ว", price: 990, unit: "หลัง" },
    ],
  };
  const updateRes = await request("PATCH", `/api/admin/services/${createdId}`, updatePayload, adminHeaders);
  assert.equal(updateRes.response.status, 200);
  assert.equal(updateRes.body.data.name, updatePayload.name);
  assert.equal(updateRes.body.data.serviceOptions.length, 1);
  assert.equal(updateRes.body.data.serviceOptions[0].name, "รายการย่อยแก้ไขแล้ว");
  assert.equal(updateRes.body.data.serviceOptions[0].price, 990);

  // 7. Test Reorder Services
  console.log("7. Testing PATCH /api/admin/services/reorder...");
  const reorderPayload = {
    items: [
      { id: createdId, displayOrder: 99 },
    ],
  };
  const reorderRes = await request("PATCH", "/api/admin/services/reorder", reorderPayload, adminHeaders);
  assert.equal(reorderRes.response.status, 200);

  // 8. Test Soft Delete Service
  console.log("8. Testing DELETE /api/admin/services/:id...");
  const deleteRes = await request("DELETE", `/api/admin/services/${createdId}`, null, adminHeaders);
  assert.equal(deleteRes.response.status, 200);

  // Verify it is not found in active list or by ID
  const afterDeleteRes = await request("GET", `/api/admin/services/${createdId}`, null, adminHeaders);
  assert.equal(afterDeleteRes.response.status, 404);

  console.log("=== All Admin Services API Smoke Tests Passed Successfully! ===");
} catch (err) {
  console.error("Test failure:", err);
  process.exitCode = 1;
} finally {
  server.close();
  await once(server, "close");
  await pool.end();
}
