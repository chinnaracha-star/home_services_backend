import { createServer } from "node:http";
import { app } from "./app.mjs";
import { env } from "./configs/env.mjs";
import { pool } from "./configs/db.mjs";
import { createChatSocketServer } from "./sockets/chat.socket.mjs";

const server = createServer(app);
const allowedOrigins = [env.clientOrigin, "http://localhost:3000", "http://127.0.0.1:3000"];
const io = createChatSocketServer(server, allowedOrigins);

server.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  io.close();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
