import { Router } from "express";
import { login, logout } from "../controllers/auth.controller.mjs";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
