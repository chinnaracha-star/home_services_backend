import { body, param, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateCreateCategory = [
  body('name').notEmpty().withMessage('Category name is required').isString(),
  handleValidationErrors,
];

const validateUpdateCategory = [
  param('id').isInt().withMessage('Invalid category ID format'),
  body('name').optional().isString(),
  handleValidationErrors,
];

const validateIdParam = [
  param('id').isInt().withMessage('Invalid category ID format'),
  handleValidationErrors,
];

export {
  validateCreateCategory,
  validateUpdateCategory,
  validateIdParam
};