import { query } from "../configs/db.mjs";

try {
  await query("SELECT 1");
  console.log("Database connected");
  process.exit(0);
} catch (error) {
  console.error("Database connection failed");
  console.error(error.message);
  process.exit(1);
}
