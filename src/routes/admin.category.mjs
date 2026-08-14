import express from 'express';
export const adminCategoryRouter = express.Router();

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/admin-category.controller.mjs';

import {
  validateCreateCategory,
  validateUpdateCategory,
  validateIdParam,
} from '../validators/category.validator.mjs';

adminCategoryRouter.get("/", getCategories);
adminCategoryRouter.get("/:id", validateIdParam, getCategoryById);
adminCategoryRouter.post("/", validateCreateCategory, createCategory);
adminCategoryRouter.patch("/:id", validateUpdateCategory, updateCategory);
adminCategoryRouter.delete("/:id", validateIdParam, deleteCategory);

export default adminCategoryRouter;