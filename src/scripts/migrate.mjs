import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "../configs/db.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(scriptDir, "../database/schema.sql");
const sql = await readFile(schemaPath, "utf8");

await query(sql);
console.log("Database schema applied");
process.exit(0);
