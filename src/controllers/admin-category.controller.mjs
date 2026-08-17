import categoryRepository from '../repositories/category.repository.mjs';

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
    const { name } = req.body;

    const existingCategory = await categoryRepository.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updatedCategory = await categoryRepository.update(id, name);

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