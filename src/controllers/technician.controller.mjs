import { HttpError } from "../utils/http-error.mjs";
import {
  validateLocation,
  validateUpdateTechnicianSettings,
} from "../validators/technician.validator.mjs";
import {
  findActiveServiceIds,
  findTechnicianSettingsByUserId,
  updateTechnicianLocation,
  updateTechnicianSettings,
} from "../repositories/technician.repository.mjs";

function toWorkspaceProfile(settings) {
  return {
    technicianId: String(settings.technicianId),
    userId: String(settings.userId),
    email: settings.email || "",
    fullName: settings.fullName || `${settings.firstName} ${settings.lastName}`.trim(),
    phone: settings.phone || null,
    address: settings.address || null,
    isAvailable: Boolean(settings.isAvailable),
    latitude: settings.latitude ?? null,
    longitude: settings.longitude ?? null,
    locationUpdatedAt: settings.locationUpdatedAt ?? null,
    services: settings.services ?? [],
  };
}

async function getOwnedTechnicianSettings(userId) {
  const settings = await findTechnicianSettingsByUserId(userId);

  if (!settings) {
    throw new HttpError(404, "TECHNICIAN_PROFILE_NOT_FOUND", "ไม่พบข้อมูลช่าง");
  }

  return settings;
}

function settingsFromWorkspaceBody(body, current) {
  const fullName =
    body?.fullName !== undefined
      ? String(body.fullName).trim()
      : `${current.firstName} ${current.lastName}`.trim();
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || current.firstName,
    lastName: parts.slice(1).join(" ") || current.lastName || "-",
    phone: body?.phone !== undefined ? body.phone : current.phone,
    address: body?.address !== undefined ? body.address || "" : current.address,
    isAvailable: body?.isAvailable !== undefined ? body.isAvailable : current.isAvailable,
    serviceIds: body?.serviceIds !== undefined ? body.serviceIds : current.serviceIds,
  };
}

export async function getMyTechnicianSettings(req, res, next) {
  try {
    const settings = await getOwnedTechnicianSettings(req.user.id);

    res.status(200).json({
      message: "Success",
      data: toWorkspaceProfile(settings),
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
      data: toWorkspaceProfile(settings),
    });
  } catch (error) {
    next(error);
  }
}

export async function patchMyTechnicianWorkspaceSettings(req, res, next) {
  try {
    const current = await getOwnedTechnicianSettings(req.user.id);
    const { errors, value } = validateUpdateTechnicianSettings(
      settingsFromWorkspaceBody(req.body, current),
    );

    if (errors.length > 0) {
      res.status(400).json({
        message: "ข้อมูลโปรไฟล์ช่างไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

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
      message: "บันทึกการตั้งค่าสำเร็จ",
      data: toWorkspaceProfile(settings),
    });
  } catch (error) {
    next(error);
  }
}

export async function patchMyTechnicianLocation(req, res, next) {
  try {
    const { errors, value } = validateLocation(req.body);
    if (errors.length > 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "พิกัดไม่ถูกต้อง", errors);
    }

    await getOwnedTechnicianSettings(req.user.id);
    const result = await updateTechnicianLocation(req.user.id, value);
    if (!result) {
      throw new HttpError(404, "TECHNICIAN_PROFILE_NOT_FOUND", "ไม่พบข้อมูลช่าง");
    }

    res.status(200).json({
      message: "อัปเดตตำแหน่งปัจจุบันสำเร็จ",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyServiceRequests(req, res, next) {
  try {
    const settings = await getOwnedTechnicianSettings(req.user.id);
    res.status(200).json({
      message: "Success",
      data: [],
      meta: { total: 0, isAvailable: settings.isAvailable },
    });
  } catch (error) {
    next(error);
  }
}

export async function postAcceptServiceRequest(_req, res, next) {
  next(new HttpError(404, "ORDER_NOT_FOUND", "ไม่พบคำขอบริการ"));
}

export async function postDeclineServiceRequest(_req, res, next) {
  next(new HttpError(404, "ORDER_NOT_FOUND", "ไม่พบคำขอบริการ"));
}

export async function getMyTechnicianJobs(_req, res, next) {
  try {
    res.status(200).json({
      message: "Success",
      data: [],
      meta: { total: 0 },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyTechnicianJob(_req, res, next) {
  next(new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ"));
}
