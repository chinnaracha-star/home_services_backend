import { supabase } from "../configs/supabase.mjs";
import { findUserById, findUserByEmail } from "../repositories/user.repository.mjs";

export async function protect(req, res, next) {
  try {
    // 1. ตรวจสอบ dev header 'x-user-id' (สำหรับ development & smoke test)
    const devUserId = req.headers["x-user-id"];
    if (devUserId) {
      const devUser = await findUserById(devUserId);
      if (devUser) {
        req.user = devUser;
      } else {
        req.user = { id: devUserId, email: null, role: "USER" };
      }
      return next();
    }

    // 2. ตรวจสอบ Authorization Bearer Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Access Denied: No token provided",
        code: "UNAUTHORIZED",
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
        code: "UNAUTHORIZED",
      });
      return;
    }

    // ค้นหา user จาก email ในฐานข้อมูล
    let dbUser = await findUserByEmail(user.email);

    if (!dbUser) {
      req.user = {
        id: user.id,
        email: user.email,
        role: "USER",
        fullName: user.user_metadata?.full_name || "",
      };
    } else {
      req.user = dbUser;
    }

    next();
  } catch (error) {
    next(error);
  }
}
