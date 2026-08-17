import { Router } from "express";
import { register } from "../controllers/auth.controller.mjs";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
