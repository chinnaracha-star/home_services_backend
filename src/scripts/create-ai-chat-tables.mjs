import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool, query } from "../configs/db.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(scriptDir, "../database/create-ai-chat-tables.sql");
const sql = await readFile(sqlPath, "utf8");

try {
  await query(sql);
  console.log("AI chat tables applied");
} finally {
  await pool.end();
}
