import express from "express";
import cors from "cors";
import { env } from "./configs/env.mjs";
import { HttpError } from "./utils/http-error.mjs";
import { healthRouter } from "./routes/health.route.mjs";
import { userRouter } from "./routes/user.route.mjs";
import { categoryRouter } from "./routes/category.route.mjs";
import { serviceRouter } from "./routes/service.route.mjs";
import adminCategoryRouter from "./routes/admin.category.mjs";
import authRouter from "./routes/auth.route.mjs";
import { userAuthRouter } from "./routes/user-auth.route.mjs";

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
app.use("/auth/user", userAuthRouter);
app.use("/api/auth/user", userAuthRouter);
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

app.use((error, _req, res, _next) => {
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
