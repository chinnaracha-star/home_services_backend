import {
  clearChatHistory,
  getChatHistory,
  sendChatMessage,
} from "../services/chatbot.service.mjs";
import { validateChatRequest } from "../validators/chatbot.validator.mjs";

export async function postChatMessage(req, res, next) {
  try {
    const input = validateChatRequest(req.body);
    const result = await sendChatMessage({ ...input, user: req.user ?? null });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getChatbotHistory(req, res, next) {
  try {
    res.status(200).json(await getChatHistory(req.user));
  } catch (error) {
    next(error);
  }
}

export async function deleteChatbotHistory(req, res, next) {
  try {
    res.status(200).json(await clearChatHistory(req.user));
  } catch (error) {
    next(error);
  }
}
