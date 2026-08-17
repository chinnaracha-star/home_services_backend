export function protect(req, res, next) {
  // old
  /*
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
  */
  // new
  try{

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Access Denied: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const {data: {user}, error: authError} = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({
        message: "Access Denied: Invalid or Expired token",
      });
    }

    next();

  }catch (error) {
    res.status(500).json({
      message: "Server connection error",
    });
  }
}
