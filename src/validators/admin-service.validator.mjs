import { body, param, validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
      errors: errors.array(),
    });
  }
  next();
};

export const validateIdParam = [
  param("id").isInt({ min: 1 }).withMessage("ID บริการต้องเป็นจำนวนเต็มบวก"),
  handleValidationErrors,
];

export const validateCreateService = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("กรุณากรอกชื่อบริการ")
    .isLength({ max: 255 })
    .withMessage("ชื่อบริการต้องไม่เกิน 255 ตัวอักษร"),
  body("categoryId")
    .optional()
    .customSanitizer((val, { req }) => val || req.body.category_id),
  body("category_id")
    .optional()
    .customSanitizer((val, { req }) => val || req.body.categoryId),
  body(["categoryId", "category_id"])
    .custom((_, { req }) => {
      const catId = req.body.categoryId || req.body.category_id;
      const catName = req.body.category;
      if (!catId && !catName) {
        throw new Error("กรุณาระบุหมวดหมู่บริการ (categoryId หรือ category)");
      }
      return true;
    }),
  body("serviceOptions")
    .optional()
    .customSanitizer((val, { req }) => val || req.body.service_options),
  body("service_options")
    .optional()
    .customSanitizer((val, { req }) => val || req.body.serviceOptions),
  body(["serviceOptions", "service_options"])
    .custom((_, { req }) => {
      const options = req.body.serviceOptions || req.body.service_options;
      if (!Array.isArray(options) || options.length === 0) {
        throw new Error("ต้องมีรายการบริการย่อยอย่างน้อย 1 รายการ");
      }
      for (const opt of options) {
        const optName = opt.name || opt.option_name;
        if (!optName || typeof optName !== "string" || !optName.trim()) {
          throw new Error("กรุณากรอกชื่อรายการบริการย่อยให้ครบถ้วน");
        }
        if (opt.price === undefined || opt.price === null || isNaN(Number(opt.price)) || Number(opt.price) < 0) {
          throw new Error("ราคาค่าบริการย่อยต้องเป็นตัวเลขที่ไม่ติดลบ");
        }
        if (!opt.unit || typeof opt.unit !== "string" || !opt.unit.trim()) {
          throw new Error("กรุณากรอกหน่วยบริการย่อย");
        }
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateUpdateService = [
  param("id").isInt({ min: 1 }).withMessage("ID บริการต้องเป็นจำนวนเต็มบวก"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("ชื่อบริการต้องไม่เป็นค่าว่าง")
    .isLength({ max: 255 })
    .withMessage("ชื่อบริการต้องไม่เกิน 255 ตัวอักษร"),
  body(["serviceOptions", "service_options"])
    .optional()
    .custom((val) => {
      if (val !== undefined) {
        if (!Array.isArray(val) || val.length === 0) {
          throw new Error("ต้องมีรายการบริการย่อยอย่างน้อย 1 รายการ");
        }
        for (const opt of val) {
          const optName = opt.name || opt.option_name;
          if (!optName || typeof optName !== "string" || !optName.trim()) {
            throw new Error("กรุณากรอกชื่อรายการบริการย่อยให้ครบถ้วน");
          }
          if (opt.price === undefined || opt.price === null || isNaN(Number(opt.price)) || Number(opt.price) < 0) {
            throw new Error("ราคาค่าบริการย่อยต้องเป็นตัวเลขที่ไม่ติดลบ");
          }
          if (!opt.unit || typeof opt.unit !== "string" || !opt.unit.trim()) {
            throw new Error("กรุณากรอกหน่วยบริการย่อย");
          }
        }
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateReorderServices = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("items ต้องเป็น Array ของรายการบริการและ display_order"),
  body("items.*.id")
    .custom((val, { req, path }) => {
      const match = path.match(/items\[(\d+)\]/);
      const index = match ? match[1] : null;
      const item = index !== null ? req.body.items[index] : null;
      const id = val || item?.service_id;
      if (!id || isNaN(Number(id)) || Number(id) <= 0) {
        throw new Error("ID ของแต่ละบริการต้องเป็นจำนวนเต็มบวก");
      }
      return true;
    }),
  body("items.*.displayOrder")
    .optional()
    .customSanitizer((val, { req, path }) => {
      const match = path.match(/items\[(\d+)\]/);
      const index = match ? match[1] : null;
      return val !== undefined ? val : req.body.items[index]?.display_order;
    }),
  handleValidationErrors,
];
