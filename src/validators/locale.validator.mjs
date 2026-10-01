import { HttpError } from "../utils/http-error.mjs";

export const SUPPORTED_LOCALES = ["th", "en"];
export const DEFAULT_LOCALE = "th";

export function parseLocale(value) {
  const locale =
    typeof value === "string" && value.trim()
      ? value.trim().toLowerCase()
      : DEFAULT_LOCALE;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new HttpError(
      400,
      "INVALID_LOCALE",
      `รองรับภาษา ${SUPPORTED_LOCALES.join(" และ ")} เท่านั้น`,
      [{ field: "locale", message: "locale ต้องเป็น th หรือ en" }],
    );
  }

  return locale;
}
