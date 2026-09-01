import multer from "multer";
import { HttpError } from "../utils/http-error.mjs";

export const MIN_COMPLETION_IMAGES = 3;
export const MAX_COMPLETION_IMAGES = 5;
export const MAX_COMPLETION_IMAGE_SIZE = 5 * 1024 * 1024;

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedCompletionImageType(mimetype) {
  return allowedTypes.has(mimetype);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_COMPLETION_IMAGE_SIZE, files: MAX_COMPLETION_IMAGES },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedCompletionImageType(file.mimetype)) {
      callback(
        new HttpError(
          400,
          "INVALID_COMPLETION_IMAGE_TYPE",
          "รองรับเฉพาะรูป JPEG, PNG หรือ WebP",
        ),
      );
      return;
    }
    callback(null, true);
  },
});

export function requireCompletionImageCount(files) {
  const count = Array.isArray(files) ? files.length : 0;
  if (count < MIN_COMPLETION_IMAGES) {
    throw new HttpError(
      400,
      "MINIMUM_COMPLETION_IMAGES_REQUIRED",
      `กรุณาอัปโหลดรูปหลักฐานอย่างน้อย ${MIN_COMPLETION_IMAGES} รูป`,
    );
  }
  if (count > MAX_COMPLETION_IMAGES) {
    throw new HttpError(
      400,
      "TOO_MANY_COMPLETION_IMAGES",
      `อัปโหลดรูปหลักฐานได้ไม่เกิน ${MAX_COMPLETION_IMAGES} รูป`,
    );
  }
}

export function uploadJobCompletionImages(req, res, next) {
  upload.array("images", MAX_COMPLETION_IMAGES)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof HttpError) {
      next(error);
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      next(
        new HttpError(
          400,
          "COMPLETION_IMAGE_TOO_LARGE",
          "รูปหลักฐานแต่ละรูปต้องมีขนาดไม่เกิน 5MB",
        ),
      );
      return;
    }

    if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      next(
        new HttpError(
          400,
          "TOO_MANY_COMPLETION_IMAGES",
          `อัปโหลดรูปหลักฐานได้ไม่เกิน ${MAX_COMPLETION_IMAGES} รูป และต้องใช้ field ชื่อ images`,
        ),
      );
      return;
    }

    next(error);
  });
}
