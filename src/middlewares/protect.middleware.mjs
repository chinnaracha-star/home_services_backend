import { supabase } from "../configs/supabase.mjs";
import { findUserById, findUserByEmail } from "../repositories/user.repository.mjs";

export function createProtect({
  authClient = supabase,
  findById = findUserById,
  findByEmail = findUserByEmail,
  allowDevUserId = process.env.NODE_ENV !== "production",
} = {}) {
  return async function protect(req, res, next) {
    try {
      const devUserId = req.headers["x-user-id"];
      if (allowDevUserId && devUserId) {
        const devUser = await findById(devUserId);
        if (devUser) {
          req.user = devUser;
        } else {
          req.user = { id: devUserId, email: null, role: "USER" };
        }
        next();
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          message: "Access Denied: No token provided",
          code: "UNAUTHORIZED",
        });
        return;
      }

      const token = authHeader.slice("Bearer ".length).trim();
      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser(token);

      if (authError || !user) {
        res.status(401).json({
          message: "Access Denied: Invalid or Expired token",
          code: "UNAUTHORIZED",
        });
        return;
      }

      const dbUser = await findByEmail(user.email);
      if (dbUser) {
        req.user = dbUser;
      } else {
        req.user = {
          id: user.id,
          email: user.email,
          role: "USER",
          fullName: user.user_metadata?.full_name || "",
          displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || "",
          firstName: user.user_metadata?.first_name || null,
          lastName: user.user_metadata?.last_name || null,
        };
      }

      req.authUserId = user.id;
      req.accessToken = token;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const protect = createProtect();
