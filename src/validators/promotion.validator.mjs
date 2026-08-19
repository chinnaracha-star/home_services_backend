import { body, param, validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateCreatePromotion = [
  body("promotion_code")
    .trim()
    .notEmpty()
    .withMessage("Promotion code is required")
    .isString()
    .withMessage("Promotion code must be a string"),
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Promotion type is required")
    .isIn(["Fixed", "Percent"])
    .withMessage("Promotion type must be either 'Fixed' or 'Percent'"),
  body("discount")
    .notEmpty()
    .withMessage("Discount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Discount must be greater than 0")
    .custom((value, { req }) => {
      if (req.body.type === "Percent" && parseFloat(value) > 100) {
        throw new Error("Percent discount cannot exceed 100%");
      }
      return true;
    }),
  body("quota")
    .notEmpty()
    .withMessage("Quota is required")
    .isInt({ min: 1 })
    .withMessage("Quota must be an integer of at least 1"),
  body("expire")
    .notEmpty()
    .withMessage("Expiration date is required")
    .isISO8601()
    .withMessage("Expiration date must be a valid ISO8601 date string"),
  handleValidationErrors,
];

const validateUpdatePromotion = [
  param("id").isInt({ min: 1 }).withMessage("Invalid promotion ID format"),
  body("promotion_code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Promotion code cannot be empty")
    .isString(),
  body("type")
    .optional()
    .trim()
    .isIn(["Fixed", "Percent"])
    .withMessage("Promotion type must be either 'Fixed' or 'Percent'"),
  body("discount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Discount must be greater than 0")
    .custom((value, { req }) => {
      if (req.body.type === "Percent" && parseFloat(value) > 100) {
        throw new Error("Percent discount cannot exceed 100%");
      }
      return true;
    }),
  body("quota")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quota must be an integer of at least 1"),
  body("expire")
    .optional()
    .isISO8601()
    .withMessage("Expiration date must be a valid ISO8601 date string"),
  handleValidationErrors,
];

const validateIdParam = [
  param("id").isInt({ min: 1 }).withMessage("Invalid promotion ID format"),
  handleValidationErrors,
];

export {
  validateCreatePromotion,
  validateUpdatePromotion,
  validateIdParam,
};
