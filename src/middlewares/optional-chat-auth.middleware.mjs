import { supabase } from "../configs/supabase.mjs";
import { findUserByEmail } from "../repositories/user.repository.mjs";
import { HttpError } from "../utils/http-error.mjs";

export function createOptionalChatAuth({
  authClient = supabase,
  findByEmail = findUserByEmail,
} = {}) {
  return async function optionalChatAuth(req, _res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        next();
        return;
      }

      if (!authHeader.startsWith("Bearer ")) {
        throw new HttpError(401, "UNAUTHORIZED", "Invalid authorization header");
      }

      const token = authHeader.slice("Bearer ".length).trim();
      const { data, error } = await authClient.auth.getUser(token);
      if (error || !data?.user?.email) {
        throw new HttpError(401, "UNAUTHORIZED", "Invalid or expired token");
      }

      const user = await findByEmail(data.user.email);
      if (!user) {
        throw new HttpError(401, "UNAUTHORIZED", "User account was not found");
      }
      if (String(user.role).toUpperCase() !== "USER") {
        throw new HttpError(403, "CHAT_AUDIENCE_RESTRICTED", "Chatbot is available to customers only");
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const optionalChatAuth = createOptionalChatAuth();
