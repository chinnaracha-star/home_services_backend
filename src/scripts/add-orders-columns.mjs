import { pool } from "../configs/db.mjs";

async function addMissingColumns() {
  console.log("🔧 Adding missing columns to orders table...\n");

  const columnsToAdd = [
    {
      name: "scheduled_date",
      definition: "DATE",
      description: "Service schedule date"
    },
    {
      name: "scheduled_time",
      definition: "TIME",
      description: "Service schedule time"
    },
    {
      name: "address",
      definition: "TEXT",
      description: "Full address"
    },
    {
      name: "province",
      definition: "VARCHAR(255)",
      description: "Province name"
    },
    {
      name: "district",
      definition: "VARCHAR(255)",
      description: "District name"
    },
    {
      name: "subdistrict",
      definition: "VARCHAR(255)",
      description: "Subdistrict name"
    },
    {
      name: "additional_info",
      definition: "TEXT",
      description: "Additional information"
    },
    {
      name: "promotion_id",
      definition: "BIGINT",
      description: "Promotion ID reference"
    },
    {
      name: "discount",
      definition: "NUMERIC(10, 2) DEFAULT 0",
      description: "Discount amount"
    },
    {
      name: "created_at",
      definition: "TIMESTAMPTZ NOT NULL DEFAULT now()",
      description: "Creation timestamp"
    },
    {
      name: "updated_at",
      definition: "TIMESTAMPTZ NOT NULL DEFAULT now()",
      description: "Last update timestamp"
    }
  ];

  try {
    for (const column of columnsToAdd) {
      try {
        // Check if column exists
        const checkResult = await pool.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = 'orders' AND column_name = $1`,
          [column.name]
        );

        if (checkResult.rows.length === 0) {
          // Column doesn't exist, add it
          await pool.query(
            `ALTER TABLE orders ADD COLUMN ${column.name} ${column.definition}`
          );
          console.log(`✅ Added: ${column.name} - ${column.description}`);
        } else {
          console.log(`⏭️  Skipped: ${column.name} (already exists)`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${column.name}:`, error.message);
      }
    }

    console.log("\n📊 Final table structure:\n");

    // Show final structure
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.table(result.rows);

    console.log("\n🎉 Orders table is now ready!");
    console.log("\nYou can test with:");
    console.log("POST http://localhost:3001/api/orders\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
