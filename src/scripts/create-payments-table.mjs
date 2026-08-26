import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query } from "../configs/db.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(scriptDir, "../database/create-payments-table.sql");

await query(await readFile(schemaPath, "utf8"));
console.log("Payments table applied");
