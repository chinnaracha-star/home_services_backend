import { Router } from "express";
import {
  deleteChatbotHistory,
  getChatbotHistory,
  postChatMessage,
} from "../controllers/chatbot.controller.mjs";
import {
  chatbotPreAuthRateLimit,
  chatbotRateLimit,
} from "../middlewares/chatbot-rate-limit.middleware.mjs";
import { optionalChatAuth } from "../middlewares/optional-chat-auth.middleware.mjs";

export const chatbotRouter = Router();

chatbotRouter.use(chatbotPreAuthRateLimit, optionalChatAuth);
chatbotRouter.post("/", chatbotRateLimit, postChatMessage);
chatbotRouter.get("/history", getChatbotHistory);
chatbotRouter.delete("/history", deleteChatbotHistory);
