import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user-auth.controller.mjs";
import {
  forgotPasswordForUser,
  resetPassword,
} from "../controllers/password-reset.controller.mjs";

const userAuthRouter = Router();

userAuthRouter.post("/register", registerUser);
userAuthRouter.post("/login", loginUser);
userAuthRouter.post("/forgot-password", forgotPasswordForUser);
userAuthRouter.post("/reset-password", resetPassword);

export { userAuthRouter };
