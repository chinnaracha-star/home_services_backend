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
  console.log("=== Running Admin Promotions API Tests ===");

  // 1. Check unauthorized access without token/headers
  console.log("1. Testing 401 on unauthenticated access...");
  const unauthRes = await request("GET", "/api/admin/promotions");
  assert.equal(unauthRes.response.status, 401);

  // Find or create an admin user for testing
  let adminRes = await query("SELECT user_id, email, role FROM users WHERE role = 'ADMIN' LIMIT 1");
  let adminId;
  if (adminRes.rows.length > 0) {
    adminId = String(adminRes.rows[0].user_id);
  } else {
    const insertAdmin = await query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'ADMIN') RETURNING user_id",
      [`test-admin-${Date.now()}@example.com`, "hash123", "Test Admin"]
    );
    adminId = String(insertAdmin.rows[0].user_id);
  }

  const adminHeaders = { "x-user-id": adminId };

  // 2. Test Get All Promotions (should return 200 array)
  console.log("2. Testing GET /api/admin/promotions...");
  const listRes = await request("GET", "/api/admin/promotions", null, adminHeaders);
  assert.equal(listRes.response.status, 200);
  assert.equal(listRes.body.success, true);
  assert.ok(Array.isArray(listRes.body.data));

  // 3. Test Create Fixed Promotion
  console.log("3. Testing POST /api/admin/promotions (Fixed Discount)...");
  const testCodeFixed = `FIXED${Date.now()}`;
  const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();

  const createFixedRes = await request("POST", "/api/admin/promotions", {
    promotion_code: testCodeFixed,
    type: "Fixed",
    discount: 50.00,
    quota: 100,
    expire: futureDate,
  }, adminHeaders);

  assert.equal(createFixedRes.response.status, 201);
  assert.equal(createFixedRes.body.success, true);
  const createdPromotionId = createFixedRes.body.data.promotion_id;
  assert.ok(createdPromotionId);
  assert.equal(createFixedRes.body.data.promotion_code, testCodeFixed);
  assert.equal(createFixedRes.body.data.type, "Fixed");
  assert.equal(createFixedRes.body.data.status, "active");

  // 4. Test Duplicate Code rejection (409)
  console.log("4. Testing POST duplicate code (409 Conflict)...");
  const dupRes = await request("POST", "/api/admin/promotions", {
    promotion_code: testCodeFixed,
    type: "Fixed",
    discount: 50,
    quota: 50,
    expire: futureDate,
  }, adminHeaders);
  assert.equal(dupRes.response.status, 409);
  assert.equal(dupRes.body.code, "PROMOTION_CODE_EXISTS");

  // 5. Test Create Percent Promotion
  console.log("5. Testing POST /api/admin/promotions (Percent Discount)...");
  const testCodePercent = `PERC${Date.now()}`;
  const createPercentRes = await request("POST", "/api/admin/promotions", {
    promotion_code: testCodePercent,
    type: "Percent",
    discount: 15.5,
    quota: 50,
    expire: futureDate,
  }, adminHeaders);
  assert.equal(createPercentRes.response.status, 201);
  assert.equal(createPercentRes.body.data.type, "Percent");

  // 6. Test Validation failure on invalid percent (> 100)
  console.log("6. Testing POST validation failure on percent > 100...");
  const invalidPercentRes = await request("POST", "/api/admin/promotions", {
    promotion_code: `INV${Date.now()}`,
    type: "Percent",
    discount: 150,
    quota: 10,
    expire: futureDate,
  }, adminHeaders);
  assert.equal(invalidPercentRes.response.status, 400);

  // 7. Test Get Promotion by ID
  console.log("7. Testing GET /api/admin/promotions/:id...");
  const getByIdRes = await request("GET", `/api/admin/promotions/${createdPromotionId}`, null, adminHeaders);
  assert.equal(getByIdRes.response.status, 200);
  assert.equal(getByIdRes.body.data.promotion_code, testCodeFixed);

  // 8. Test Search by Code
  console.log("8. Testing GET /api/admin/promotions?search=...");
  const searchRes = await request("GET", `/api/admin/promotions?search=${testCodeFixed.slice(0, 8)}`, null, adminHeaders);
  assert.equal(searchRes.response.status, 200);
  assert.ok(searchRes.body.data.some(p => p.promotion_code === testCodeFixed));

  // 9. Test Update Promotion
  console.log("9. Testing PATCH /api/admin/promotions/:id...");
  const updatedDiscount = 75;
  const updateRes = await request("PATCH", `/api/admin/promotions/${createdPromotionId}`, {
    discount: updatedDiscount,
    quota: 200,
  }, adminHeaders);
  assert.equal(updateRes.response.status, 200);
  assert.equal(updateRes.body.data.discount, String(updatedDiscount));
  assert.equal(updateRes.body.data.quota, 200);

  // 10. Test Soft Delete Promotion
  console.log("10. Testing DELETE /api/admin/promotions/:id...");
  const deleteRes = await request("DELETE", `/api/admin/promotions/${createdPromotionId}`, null, adminHeaders);
  assert.equal(deleteRes.response.status, 200);
  assert.equal(deleteRes.body.success, true);

  // 11. Verify deleted item is no longer returned in getById or active list
  console.log("11. Verifying deleted item is 404...");
  const verifyGetRes = await request("GET", `/api/admin/promotions/${createdPromotionId}`, null, adminHeaders);
  assert.equal(verifyGetRes.response.status, 404);

  console.log("=== All Admin Promotion API tests passed successfully! ===");
} finally {
  server.close();
  await pool.end();
}
