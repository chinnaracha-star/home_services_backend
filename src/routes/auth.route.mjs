import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller.mjs";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/password-reset.controller.mjs";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
