import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import supertest from "supertest";

import { app } from "../src/app.mjs";
import { pool } from "../src/configs/db.mjs";

test("admin category API creates and updates categories in the configured database", async () => {
  const request = supertest(app);
  const prefix = `codex_category_test_${randomUUID().replaceAll("-", "")}`;
  const originalName = `${prefix}_original`;
  const updatedName = `${prefix}_updated`;
  const otherName = `${prefix}_other`;
  const createdIds = [];

  try {
    const admin = await pool.query(
      "SELECT user_id FROM users WHERE UPPER(role) = 'ADMIN' LIMIT 1",
    );
    assert.ok(admin.rows[0], "An existing admin user is required for this API test");
    const headers = { "x-user-id": String(admin.rows[0].user_id) };

    const unauthenticated = await request.post("/api/admin/categories").send({ name: originalName });
    assert.equal(unauthenticated.status, 401);

    const nonAdmin = await request
      .post("/api/admin/categories")
      .set("x-user-id", "999999999999999999")
      .send({ name: originalName });
    assert.equal(nonAdmin.status, 403);

    const invalidCreate = await request
      .post("/api/admin/categories")
      .set(headers)
      .send({ name: "" });
    assert.equal(invalidCreate.status, 400);

    const create = await request
      .post("/api/admin/categories")
      .set(headers)
      .send({ name: originalName });
    if (create.status === 201 && create.body.data?.category_id) {
      createdIds.push(String(create.body.data.category_id));
    }
    assert.equal(create.status, 201);
    assert.equal(create.body.data.name, originalName);
    assert.equal(create.body.data.is_active, true);
    const categoryId = String(create.body.data.category_id);

    const persistedCreate = await pool.query(
      "SELECT name FROM categories WHERE category_id = $1",
      [categoryId],
    );
    assert.equal(persistedCreate.rows[0]?.name, originalName);

    const duplicateCreate = await request
      .post("/api/admin/categories")
      .set(headers)
      .send({ name: originalName });
    assert.equal(duplicateCreate.status, 409);
    assert.equal(duplicateCreate.body.code, "CATEGORY_NAME_EXISTS");

    const createOther = await request
      .post("/api/admin/categories")
      .set(headers)
      .send({ name: otherName });
    if (createOther.status === 201 && createOther.body.data?.category_id) {
      createdIds.push(String(createOther.body.data.category_id));
    }
    assert.equal(createOther.status, 201);

    const invalidUpdate = await request
      .patch(`/api/admin/categories/${categoryId}`)
      .set(headers)
      .send({ name: 123 });
    assert.equal(invalidUpdate.status, 400);

    const unauthenticatedUpdate = await request
      .patch(`/api/admin/categories/${categoryId}`)
      .send({ name: updatedName });
    assert.equal(unauthenticatedUpdate.status, 401);

    const nonAdminUpdate = await request
      .patch(`/api/admin/categories/${categoryId}`)
      .set("x-user-id", "999999999999999999")
      .send({ name: updatedName });
    assert.equal(nonAdminUpdate.status, 403);

    const duplicateUpdate = await request
      .patch(`/api/admin/categories/${categoryId}`)
      .set(headers)
      .send({ name: otherName });
    assert.equal(duplicateUpdate.status, 409);
    assert.equal(duplicateUpdate.body.code, "CATEGORY_NAME_EXISTS");

    const update = await request
      .patch(`/api/admin/categories/${categoryId}`)
      .set(headers)
      .send({ name: updatedName });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.name, updatedName);

    const persistedUpdate = await pool.query(
      "SELECT name FROM categories WHERE category_id = $1",
      [categoryId],
    );
    assert.equal(persistedUpdate.rows[0]?.name, updatedName);
  } finally {
    try {
      for (const categoryId of createdIds) {
        const removed = await pool.query(
          "DELETE FROM categories WHERE category_id = $1 AND name LIKE $2",
          [categoryId, `${prefix}%`],
        );
        assert.equal(removed.rowCount, 1, `Failed to remove test category ${categoryId}`);
      }
    } finally {
      await pool.end();
    }
  }
});
