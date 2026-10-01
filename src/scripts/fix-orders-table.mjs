import { pool } from "../configs/db.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixOrdersTable() {
  console.log("🔧 Fixing orders table structure...\n");

  try {
    // Read the ALTER TABLE SQL script
    const sqlPath = path.join(__dirname, "../database/alter-orders-table.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    await pool.query(sql);

    console.log("\n✅ Orders table structure updated successfully!");
    console.log("\n📊 Checking current table structure...\n");

    // Show current structure
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.table(result.rows);

    console.log("\n🎉 You can now test your POST /api/orders endpoint!");

  } catch (error) {
    console.error("❌ Error fixing orders table:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixOrdersTable();
