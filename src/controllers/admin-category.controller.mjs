import categoryRepository from '../repositories/category.repository.mjs';

const respondNameConflict = (res, existing) => {
  if (existing.is_active) {
    return res.status(409).json({
      success: false,
      code: 'CATEGORY_NAME_EXISTS',
      message: 'Category name already exists',
      data: { id: existing.category_id, is_active: true },
    });
  }

  return res.status(409).json({
    success: false,
    code: 'CATEGORY_INACTIVE',
    message: 'A category with this name was deleted. Restore it instead of creating a new one.',
    data: { id: existing.category_id, is_active: false },
  });
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryRepository.findAll();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryRepository.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingByName = await categoryRepository.findByName(name);
    if (existingByName) {
      return respondNameConflict(res, existingByName);
    }

    const newCategory = await categoryRepository.create(name);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) {
      const existingByName = await categoryRepository.findByName(name);
      if (existingByName && String(existingByName.category_id) !== String(id)) {
        return respondNameConflict(res, existingByName);
      }
    }

    const updatedCategory = await categoryRepository.update(id, { name, is_active });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await categoryRepository.delete(id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};