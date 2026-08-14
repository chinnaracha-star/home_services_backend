export function protect(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      res.status(401).json({
        message: "กรุณาเข้าสู่ระบบ",
        code: "UNAUTHORIZED",
        errors: [],
      });
      return;
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    next(error);
  }
}
