import { listCategories } from "../services/category.service.mjs";

export async function getCategories(req, res, next) {
  try {
    const categories = await listCategories(req.query.locale);
    res.status(200).json({ data: categories, message: "Success" });
  } catch (error) {
    next(error);
  }
}
