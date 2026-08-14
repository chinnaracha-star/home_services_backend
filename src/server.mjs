import { app } from "./app.mjs";
import { env } from "./configs/env.mjs";
import { pool } from "./configs/db.mjs";

const server = app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
