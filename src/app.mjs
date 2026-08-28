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
import { reviewRouter } from "./routes/review.route.mjs";

import dotenv from "dotenv";

import addressRouter from "./routes/address.routes.mjs";
import paymentRouter from "./routes/payment.route.mjs";
import promotionRouter from "./routes/promotion.routes.mjs";
import orderRouter from "./routes/order.route.mjs";

export const app = express();


app.use(
  cors({
    origin: [env.clientOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// ============================================
// 1. HEALTH CHECK (No prefix)
// ============================================
app.use("/health", healthRouter);

// ============================================
// 2. AUTHENTICATION ROUTES
// ============================================
app.use("/api/auth", authRouter);
app.use("/api/auth/user", userAuthRouter);
app.use("/api/auth/technician", technicianAuthRouter);
app.use("/auth", authRouter); // Fallback alias

// ============================================
// 3. PUBLIC API ROUTES (No auth required)
// ============================================
app.use("/api/categories", categoryRouter);
app.use("/api/services", serviceRouter);
app.use("/api/promotions", promotionRouter);      // Changed from "/" to "/api/promotions"
app.use("/api", addressRouter);                    // Mount at /api for provinces/districts/subdistricts
app.use("/api/payments", paymentRouter);           // Changed from "/" to "/api/payments"
app.use("/api/orders", orderRouter);               // Orders endpoint

// ============================================
// 4. USER ROUTES (Auth required)
// ============================================
app.use("/api/users", userRouter);

// ============================================
// 5. TECHNICIAN ROUTES (Auth required)
// ============================================
app.use("/api/technicians", technicianRouter);

// ============================================
// 6. ADMIN ROUTES (Admin auth required)
// ============================================
app.use("/api/admin/categories", adminCategoryRouter);
app.use("/api/admin/services", adminServiceRouter);
app.use("/api/admin/promotions", adminPromotionRouter);
app.use("/api/reviews", reviewRouter);


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
