import { HttpError } from "../utils/http-error.mjs";

export function parseServiceListQuery(query = {}) {
  if (
    query.featured !== undefined &&
    query.featured !== "true" &&
    query.featured !== "false"
  ) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "ค่า featured ต้องเป็น true หรือ false",
      [{ field: "featured", message: "กรุณาระบุ featured เป็น true หรือ false" }],
    );
  }

  const featured = query.featured === "true";
  const rawLimit = query.limit === undefined ? 100 : Number(query.limit);

  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "ค่า limit ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 100",
      [{ field: "limit", message: "กรุณาระบุ limit ระหว่าง 1 ถึง 100" }],
    );
  }

  return { featured, limit: rawLimit };
}

export function parseServiceId(value) {
  return /^\d+$/.test(String(value)) && BigInt(value) > 0n ? String(value) : null;
}
