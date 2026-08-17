import { findCategories } from "../repositories/category.repository.mjs";

export function listCategories() {
  return findCategories();
}
