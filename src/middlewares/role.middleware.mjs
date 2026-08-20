export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        message: "Access Denied: Unauthenticated",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const userRole = String(req.user.role || "").toUpperCase();
    const allowed = allowedRoles.map((role) => String(role).toUpperCase());
    if (!allowed.includes(userRole)) {
      res.status(403).json({
        message: "Access Denied: คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (Forbidden)",
        code: "FORBIDDEN",
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole("ADMIN");
export const requireTechnician = requireRole("TECHNICIAN");
