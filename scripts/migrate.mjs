import { query } from "../src/configs/db.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const schemaPath = path.resolve("database/schema.sql");
const sql = await readFile(schemaPath, "utf8");

await query(sql);
console.log("Database schema applied");
process.exit(0);
