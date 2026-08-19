import { HttpError } from "../utils/http-error.mjs";
import { validateUpdateTechnicianSettings } from "../validators/technician.validator.mjs";
import {
  findActiveServiceIds,
  findTechnicianSettingsByUserId,
  updateTechnicianSettings,
} from "../repositories/technician.repository.mjs";

async function getOwnedTechnicianSettings(userId) {
  const settings = await findTechnicianSettingsByUserId(userId);

  if (!settings) {
    throw new HttpError(404, "TECHNICIAN_PROFILE_NOT_FOUND", "ไม่พบข้อมูลช่าง");
  }

  return settings;
}

export async function getMyTechnicianSettings(req, res, next) {
  try {
    const settings = await getOwnedTechnicianSettings(req.user.id);

    res.status(200).json({
      message: "Success",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyTechnicianSettings(req, res, next) {
  try {
    const { errors, value } = validateUpdateTechnicianSettings(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        message: "ข้อมูลโปรไฟล์ช่างไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

    const current = await getOwnedTechnicianSettings(req.user.id);
    const activeServiceIds = await findActiveServiceIds(value.serviceIds);

    if (activeServiceIds.length !== value.serviceIds.length) {
      throw new HttpError(
        400,
        "INVALID_SERVICE_IDS",
        "มีบริการที่ไม่ถูกต้องหรือไม่พร้อมใช้งาน",
      );
    }

    const settings = await updateTechnicianSettings(
      req.user.id,
      current.technicianId,
      value,
    );

    res.status(200).json({
      message: "อัปเดตข้อมูลช่างสำเร็จ",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}
