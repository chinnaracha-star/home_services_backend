import { Router } from "express";
import { getCategories } from "../controllers/category.controller.mjs";

const categoryRouter = Router();
categoryRouter.get("/", getCategories);

export { categoryRouter };
