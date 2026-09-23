import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../configs/db.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(scriptDir, "../database/add-checkout-idempotency.sql");
const sql = await readFile(sqlPath, "utf8");

try {
  await pool.query(sql);
  console.log("Checkout idempotency schema applied");
} finally {
  await pool.end();
}
