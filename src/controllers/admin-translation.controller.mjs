import { HttpError } from "../utils/http-error.mjs";
import {
  categoryExists,
  findCategoryTranslations,
  findServiceOptionTranslations,
  findServiceTranslations,
  serviceExists,
  serviceOptionExists,
  upsertCategoryTranslation,
  upsertServiceOptionTranslation,
  upsertServiceTranslation,
} from "../repositories/translation.repository.mjs";
import { parseLocale } from "../validators/locale.validator.mjs";
import { parseTranslationBody } from "../validators/translation.validator.mjs";

function parseId(value, entity) {
  if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
    throw new HttpError(404, `${entity}_NOT_FOUND`, "ไม่พบข้อมูลที่ต้องการ");
  }
  return String(value);
}

async function requireService(serviceId) {
  if (!(await serviceExists(serviceId))) {
    throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
  }
}

async function requireCategory(categoryId) {
  if (!(await categoryExists(categoryId))) {
    throw new HttpError(404, "CATEGORY_NOT_FOUND", "ไม่พบหมวดหมู่");
  }
}

async function requireServiceOption(optionId) {
  if (!(await serviceOptionExists(optionId))) {
    throw new HttpError(404, "SERVICE_OPTION_NOT_FOUND", "ไม่พบตัวเลือกบริการ");
  }
}

export async function getServiceTranslations(req, res, next) {
  try {
    const serviceId = parseId(req.params.id, "SERVICE");
    await requireService(serviceId);
    const data = await findServiceTranslations(serviceId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryTranslations(req, res, next) {
  try {
    const categoryId = parseId(req.params.id, "CATEGORY");
    await requireCategory(categoryId);
    const data = await findCategoryTranslations(categoryId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getServiceOptionTranslations(req, res, next) {
  try {
    const optionId = parseId(req.params.optionId, "SERVICE_OPTION");
    await requireServiceOption(optionId);
    const data = await findServiceOptionTranslations(optionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function putServiceTranslation(req, res, next) {
  try {
    const serviceId = parseId(req.params.id, "SERVICE");
    const locale = parseLocale(req.params.locale);
    const translation = parseTranslationBody(req.body);
    const data = await upsertServiceTranslation(
      serviceId,
      locale,
      translation,
    );
    if (!data) {
      throw new HttpError(404, "SERVICE_NOT_FOUND", "ไม่พบบริการ");
    }
    res.status(200).json({
      success: true,
      message: "บันทึกคำแปลบริการสำเร็จ",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function putCategoryTranslation(req, res, next) {
  try {
    const categoryId = parseId(req.params.id, "CATEGORY");
    const locale = parseLocale(req.params.locale);
    const translation = parseTranslationBody(req.body);
    const data = await upsertCategoryTranslation(
      categoryId,
      locale,
      translation,
    );
    if (!data) {
      throw new HttpError(404, "CATEGORY_NOT_FOUND", "ไม่พบหมวดหมู่");
    }
    res.status(200).json({
      success: true,
      message: "บันทึกคำแปลหมวดหมู่สำเร็จ",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function putServiceOptionTranslation(req, res, next) {
  try {
    const optionId = parseId(req.params.optionId, "SERVICE_OPTION");
    const locale = parseLocale(req.params.locale);
    const translation = parseTranslationBody(req.body, { allowUnit: true });
    const data = await upsertServiceOptionTranslation(
      optionId,
      locale,
      translation,
    );
    if (!data) {
      throw new HttpError(
        404,
        "SERVICE_OPTION_NOT_FOUND",
        "ไม่พบตัวเลือกบริการ",
      );
    }
    res.status(200).json({
      success: true,
      message: "บันทึกคำแปลตัวเลือกบริการสำเร็จ",
      data,
    });
  } catch (error) {
    next(error);
  }
}
