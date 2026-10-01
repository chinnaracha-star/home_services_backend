import { findCategories } from "../repositories/category.repository.mjs";
import { parseLocale } from "../validators/locale.validator.mjs";

export function listCategories(localeValue) {
  return findCategories(parseLocale(localeValue));
}
