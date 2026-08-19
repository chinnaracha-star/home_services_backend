import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user-auth.controller.mjs";

const userAuthRouter = Router();

userAuthRouter.post("/register", registerUser);
userAuthRouter.post("/login", loginUser);

export { userAuthRouter };
