import { app } from "../app.mjs";
import { query } from "../configs/db.mjs";

let server;

async function runSmokeTest() {
  console.log("=== Starting Review API Smoke Test ===");

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testOrderCode = `TEST_ORDER_${Date.now()}`;

  try {
    // Test 1: POST /api/reviews with valid review
    console.log("1. Testing POST /api/reviews create review...");
    const createRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderCode: testOrderCode,
        rating: 5,
        comment: "ช่างมาตรงเวลา, ทำงานสะอาดเรียบร้อย",
        serviceName: "ล้างแอร์ติดผนัง",
        technicianName: "สมาน เยี่ยมยอด",
      }),
    });

    const createJson = await createRes.json();
    console.log("Create status:", createRes.status, createJson);
    if (createRes.status !== 201 || !createJson.data?.reviewId) {
      throw new Error("Failed to create review");
    }

    // Test 2: POST duplicate review for same orderCode -> should return 409
    console.log("2. Testing POST duplicate review (expect 409)...");
    const dupRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderCode: testOrderCode,
        rating: 4,
        comment: "รีวิวซ้ำ",
      }),
    });
    console.log("Duplicate status:", dupRes.status);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409, got ${dupRes.status}`);
    }

    // Test 3: GET /api/reviews/order/:orderCode
    console.log("3. Testing GET /api/reviews/order/:orderCode...");
    const getByOrderRes = await fetch(`${baseUrl}/api/reviews/order/${testOrderCode}`);
    const getByOrderJson = await getByOrderRes.json();
    console.log("GetByOrder status:", getByOrderRes.status, getByOrderJson);
    if (getByOrderRes.status !== 200 || !getByOrderJson.isReviewed) {
      throw new Error("Failed to get review by order code");
    }

    // Test 4: GET /api/reviews
    console.log("4. Testing GET /api/reviews...");
    const listRes = await fetch(`${baseUrl}/api/reviews?limit=10`);
    const listJson = await listRes.json();
    console.log("List status:", listRes.status, `count: ${listJson.data?.length}`);
    if (listRes.status !== 200 || !Array.isArray(listJson.data)) {
      throw new Error("Failed to list reviews");
    }

    // Cleanup test record
    await query(`DELETE FROM reviews WHERE order_code = $1`, [testOrderCode]);
    console.log("Cleaned up test review record");

    console.log("=== All Review API Tests Passed Successfully! ===");
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

runSmokeTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Smoke test error:", err);
    process.exit(1);
  });
