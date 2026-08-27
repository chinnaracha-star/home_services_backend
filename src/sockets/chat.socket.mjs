import { Server } from "socket.io";
import { supabase } from "../configs/supabase.mjs";
import { findUserByEmail } from "../repositories/user.repository.mjs";
import { normalizeChatMessage } from "../utils/chat-message.mjs";
import {
  createChatMessage,
  findChatMessages,
  findChatRoomAccess,
  findChatRooms,
  syncChatRooms,
} from "../repositories/chat.repository.mjs";

function socketError(code, message) {
  return { ok: false, error: { code, message } };
}

async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) throw new Error("UNAUTHORIZED");

  const user = await findUserByEmail(data.user.email);
  if (!user || !Number.isSafeInteger(Number(user.id))) throw new Error("UNAUTHORIZED");
  return user;
}

function acknowledge(ack, response) {
  if (typeof ack === "function") ack(response);
}

export function createChatSocketServer(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.user = await authenticateSocket(socket);
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    const role = String(user.role).toUpperCase();
    socket.join(`user:${user.id}`);
    if (role === "ADMIN") socket.join("role:admin");

    async function loadRooms() {
      await syncChatRooms(user);
      const rooms = await findChatRooms(user);
      await socket.join(rooms.map((room) => `chat:${room.roomId}`));

      if (role === "USER") {
        const supportRooms = rooms.filter((room) => room.roomType === "SUPPORT");
        await io.in("role:admin").socketsJoin(
          supportRooms.map((room) => `chat:${room.roomId}`),
        );
      }

      return rooms;
    }

    try {
      const rooms = await loadRooms();
      if (role === "USER") io.to("role:admin").emit("chat:rooms-updated");
      for (const room of rooms.filter((item) => item.roomType === "ORDER")) {
        io.to(`user:${room.customerId}`).emit("chat:rooms-updated");
      }
    } catch (error) {
      console.error("Unable to initialize chat socket", error);
    }

    socket.on("chat:rooms", async (ack) => {
      try {
        acknowledge(ack, { ok: true, data: await loadRooms() });
      } catch (error) {
        console.error("Unable to load chat rooms", error);
        acknowledge(ack, socketError("CHAT_ROOMS_FAILED", "ไม่สามารถโหลดห้องแชทได้"));
      }
    });

    socket.on("chat:messages", async (payload, ack) => {
      try {
        const roomId = String(payload?.roomId || "");
        const access = await findChatRoomAccess(user, roomId);
        if (!access) {
          acknowledge(ack, socketError("FORBIDDEN", "คุณไม่มีสิทธิ์เข้าถึงห้องนี้"));
          return;
        }

        socket.join(`chat:${roomId}`);
        acknowledge(ack, { ok: true, data: await findChatMessages(roomId) });
      } catch (error) {
        console.error("Unable to load chat messages", error);
        acknowledge(ack, socketError("CHAT_MESSAGES_FAILED", "ไม่สามารถโหลดข้อความได้"));
      }
    });

    socket.on("chat:send", async (payload, ack) => {
      try {
        const roomId = String(payload?.roomId || "");
        const content = normalizeChatMessage(payload?.content);
        if (!content) {
          acknowledge(ack, socketError("INVALID_MESSAGE", "ข้อความต้องมี 1-2000 ตัวอักษร"));
          return;
        }

        const access = await findChatRoomAccess(user, roomId);
        if (!access) {
          acknowledge(ack, socketError("FORBIDDEN", "คุณไม่มีสิทธิ์เข้าถึงห้องนี้"));
          return;
        }
        if (!access.canSend) {
          acknowledge(ack, socketError("ROOM_CLOSED", "ห้องนี้ปิดการส่งข้อความแล้ว"));
          return;
        }

        const message = await createChatMessage({ roomId, senderId: user.id, content });
        io.to(`chat:${roomId}`).emit("chat:message", message);
        acknowledge(ack, { ok: true, data: message });
      } catch (error) {
        console.error("Unable to send chat message", error);
        acknowledge(ack, socketError("CHAT_SEND_FAILED", "ส่งข้อความไม่สำเร็จ"));
      }
    });
  });

  return io;
}
