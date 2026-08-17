import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../app.mjs";
import { pool, query } from "../configs/db.mjs";

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function get(path, headers) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  return { response, body: await response.json() };
}

try {
  const categories = await get("/api/categories");
  assert.equal(categories.response.status, 200);
  assert.ok(categories.body.data.length >= 3);

  const featured = await get("/api/services?featured=true&limit=3");
  assert.equal(featured.response.status, 200);
  assert.equal(featured.body.data.length, 3);
  assert.ok(featured.body.data.every((service) => service.isFeatured));
  assert.deepEqual(
    featured.body.data.map((service) => service.displayOrder),
    [...featured.body.data]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((service) => service.displayOrder),
  );

  const services = await get("/api/services");
  assert.equal(services.response.status, 200);
  assert.ok(services.body.data.length >= featured.body.data.length);

  const serviceId = featured.body.data[0].id;
  const detail = await get(`/api/services/${serviceId}`);
  assert.equal(detail.response.status, 200);
  assert.ok(detail.body.data.serviceOptions.length > 0);
  assert.ok(detail.body.data.maxPrice >= detail.body.data.minPrice);

  const missingService = await get("/api/services/999999999999");
  assert.equal(missingService.response.status, 404);

  const unauthorized = await get("/api/users/me");
  assert.equal(unauthorized.response.status, 401);

  const missingUser = await get("/api/users/me", {
    "x-user-id": "999999999999999999",
  });
  assert.equal(missingUser.response.status, 404);

  const userResult = await query("SELECT user_id FROM users ORDER BY user_id LIMIT 1");
  const userId = userResult.rows[0]?.user_id;
  assert.ok(userId, "A user row is required for the profile smoke test");
  const profile = await get("/api/users/me", { "x-user-id": String(userId) });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.body.data.id, String(userId));
  assert.equal("password" in profile.body.data, false);

  console.log("Public API smoke test passed");
} finally {
  server.close();
  await once(server, "close");
  await pool.end();
}
