import { Router } from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller.mjs";

const userRouter = Router();

userRouter.get("/me", protect, getMyProfile);
userRouter.patch("/me", protect, updateMyProfile);

export { userRouter };
