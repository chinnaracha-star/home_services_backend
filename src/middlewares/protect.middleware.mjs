import { supabase } from "../configs/supabase.mjs";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Access Denied: No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({
        message: "Access Denied: Invalid or Expired token",
      });
      return;
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
}
