import pg from "pg";
import { env } from "./env.mjs";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export async function query(text, params) {
  return pool.query(text, params);
}
