import express from "express";
import cors from "cors";
import { env } from "./configs/env.mjs";
import { HttpError } from "./utils/http-error.mjs";
import { healthRouter } from "./routes/health.route.mjs";
import { userRouter } from "./routes/user.route.mjs";
import { categoryRouter } from "./routes/category.route.mjs";
import { serviceRouter } from "./routes/service.route.mjs";
import adminCategoryRouter from "./routes/admin.category.mjs";
import adminServiceRouter from "./routes/admin.service.mjs";
import adminPromotionRouter from "./routes/admin.promotion.mjs";
import authRouter from "./routes/auth.route.mjs";
import { userAuthRouter } from "./routes/user-auth.route.mjs";
import { technicianAuthRouter } from "./routes/technician-auth.route.mjs";
import { technicianRouter } from "./routes/technician.route.mjs";

export const app = express();

app.use(
  cors({
    origin: [env.clientOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/users", userRouter);
app.use("/user", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/services", serviceRouter);
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin/services", adminServiceRouter);
app.use("/api/admin/promotions", adminPromotionRouter);
app.use("/api/admin/promotion", adminPromotionRouter);
app.use("/api/technician", technicianRouter);
app.use("/api/technicians", technicianRouter);
app.use("/auth/user", userAuthRouter);
app.use("/api/auth/user", userAuthRouter);
app.use("/auth/technician", technicianAuthRouter);
app.use("/api/auth/technician", technicianAuthRouter);
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

app.use((error, _req, res, _next) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      message: "รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5MB",
      code: "AVATAR_TOO_LARGE",
      errors: [],
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "เกิดข้อผิดพลาดภายในระบบ",
    code: "INTERNAL_ERROR",
    errors: [],
  });
});
