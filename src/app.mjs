import express from "express";
import cors from "cors";
import { env } from "./configs/env.mjs";
import { healthRouter } from "./routes/health.route.mjs";
import { userRouter } from "./routes/user.route.mjs";

export const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/users", userRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: "เกิดข้อผิดพลาดภายในระบบ",
    code: "INTERNAL_ERROR",
    errors: [],
  });
});

