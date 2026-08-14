import { query } from "../configs/db.mjs";

export async function getHealth(_req, res) {
  try {
    await query("SELECT 1");

    res.status(200).json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed");
    res.status(500).json({
      ok: false,
      database: "disconnected",
    });
  }
}
