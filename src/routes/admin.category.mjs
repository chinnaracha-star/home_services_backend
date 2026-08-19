import express from "express";
import { protect } from "../middlewares/protect.middleware.mjs";
import { requireAdmin } from "../middlewares/role.middleware.mjs";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/admin-category.controller.mjs";
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateIdParam,
} from "../validators/category.validator.mjs";

export const adminCategoryRouter = express.Router();

// ป้องกันทุก route ในหมวดหมู่นี้ด้วย protect และ requireAdmin
adminCategoryRouter.use(protect, requireAdmin);

adminCategoryRouter.get("/", getCategories);
adminCategoryRouter.get("/:id", validateIdParam, getCategoryById);
adminCategoryRouter.post("/", validateCreateCategory, createCategory);
adminCategoryRouter.patch("/:id", validateUpdateCategory, updateCategory);
adminCategoryRouter.delete("/:id", validateIdParam, deleteCategory);

export default adminCategoryRouter;