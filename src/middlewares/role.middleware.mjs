export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        message: "Access Denied: Unauthenticated",
        code: "UNAUTHORIZED",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
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
