import { Router } from "express";
import {
  createReview,
  getReviews,
  getReviewByOrder,
  getServiceStats,
  deleteReview,
  updateReview,
} from "../controllers/review.controller.mjs";
import { protect } from "../middlewares/protect.middleware.mjs";

export const reviewRouter = Router();

// Middleware to optionally extract user without hard 401 failure if token is missing
const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const devUserId = req.headers["x-user-id"];

  if ((authHeader && authHeader.startsWith("Bearer ")) || devUserId) {
    return protect(req, res, next);
  }
  next();
};

// Routes
reviewRouter.post("/", optionalProtect, createReview);
reviewRouter.get("/", getReviews);
reviewRouter.get("/order/:orderCode", getReviewByOrder);
reviewRouter.delete("/order/:orderCode", optionalProtect, deleteReview);
reviewRouter.put("/order/:orderCode", optionalProtect, updateReview);
reviewRouter.patch("/order/:orderCode", optionalProtect, updateReview);
reviewRouter.get("/service/:serviceId/stats", getServiceStats);


export default reviewRouter;
