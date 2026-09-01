import { HttpError } from "../utils/http-error.mjs";

export function parseTranslationBody(body = {}, { allowUnit = false } = {}) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const unit =
    allowUnit && typeof body.unit === "string" ? body.unit.trim() : null;
  const errors = [];

  if (!name || name.length > 255) {
    errors.push({
      field: "name",
      message: "กรุณาระบุชื่อคำแปลความยาว 1 ถึง 255 ตัวอักษร",
    });
  }
  if (allowUnit && unit && unit.length > 100) {
    errors.push({
      field: "unit",
      message: "หน่วยต้องมีความยาวไม่เกิน 100 ตัวอักษร",
    });
  }

  if (errors.length > 0) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "ข้อมูลคำแปลไม่ถูกต้อง",
      errors,
    );
  }

  return { name, ...(allowUnit ? { unit } : {}) };
}
