import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, test } from "node:test";
import supertest from "supertest";
import { createClient } from "@supabase/supabase-js";

import { app } from "../src/app.mjs";
import { pool } from "../src/configs/db.mjs";
import { env } from "../src/configs/env.mjs";

const enabled =
  process.env.RUN_AUTH_INTEGRATION === "1" ||
  process.env.npm_lifecycle_event === "test:auth-integration";
const createdEmails = new Set();

function registrationEmail() {
  return `register.${randomUUID()}@example.com`;
}

function validRegistration(email) {
  return {
    firstName: "Test",
    lastName: "Register",
    email,
    phone: "0812345678",
    password: "password12345",
    acceptedTerms: true,
  };
}

async function deleteAuthUser(email) {
  const found = await pool.query(
    "SELECT id FROM auth.users WHERE lower(email) = lower($1)",
    [email],
  );
  const authUserId = found.rows[0]?.id;
  if (!authUserId) return;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    const admin = createClient(env.supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const deleted = await admin.auth.admin.deleteUser(authUserId);
    if (!deleted.error) return;
  }

  await pool.query("DELETE FROM auth.users WHERE id = $1", [authUserId]);
}

async function deleteRegisteredUser(email) {
  await pool.query("DELETE FROM public.users WHERE lower(email) = lower($1)", [email]);
  await deleteAuthUser(email);
}

afterEach(async () => {
  const emails = [...createdEmails];
  createdEmails.clear();
  for (const email of emails) {
    await deleteRegisteredUser(email);
  }
});

test(
  "customer register creates a real user",
  { skip: enabled ? false : "Set RUN_AUTH_INTEGRATION=1 to run against the test Supabase project" },
  async () => {
    const email = registrationEmail();
    createdEmails.add(email);

    const response = await supertest(app)
      .post("/api/auth/user/register")
      .send(validRegistration(email));

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.email, email);
    assert.ok(Object.hasOwn(response.body.data, "session"));

    const persisted = await pool.query(
      "SELECT email, role FROM public.users WHERE lower(email) = lower($1)",
      [email],
    );
    assert.equal(persisted.rows[0]?.email, email);
    assert.equal(String(persisted.rows[0]?.role).toUpperCase(), "USER");
  },
);

test(
  "customer register rejects an invalid payload before creating a user",
  { skip: enabled ? false : "Set RUN_AUTH_INTEGRATION=1 to run against the test Supabase project" },
  async () => {
    const response = await supertest(app)
      .post("/api/auth/user/register")
      .send({ email: "not-an-email", password: "short" });

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "VALIDATION_ERROR");
    assert.ok(response.body.errors.length > 0);
  },
);

test(
  "customer register rejects an existing email with the wrong password",
  { skip: enabled ? false : "Set RUN_AUTH_INTEGRATION=1 to run against the test Supabase project" },
  async () => {
    const email = registrationEmail();
    createdEmails.add(email);
    const request = supertest(app);

    const created = await request
      .post("/api/auth/user/register")
      .send(validRegistration(email));
    assert.equal(created.status, 201);

    const duplicate = await request.post("/api/auth/user/register").send({
      ...validRegistration(email),
      password: "different-password",
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, "EMAIL_ALREADY_EXISTS");
  },
);
