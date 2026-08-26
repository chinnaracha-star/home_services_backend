import { HttpError } from "../utils/http-error.mjs";
import {
  validateLocation,
  validateUpdateTechnicianSettings,
  parsePositiveId,
  parseTechnicianListQuery,
} from "../validators/technician.validator.mjs";
import {
  findActiveServiceIds,
  findTechnicianSettingsByUserId,
  updateTechnicianLocation,
  updateTechnicianSettings,
} from "../repositories/technician.repository.mjs";
import {
  acceptOrderForTechnician,
  declineOrderForTechnician,
  findAvailableRequests,
  findTechnicianJob,
  findTechnicianJobs,
} from "../repositories/technician-orders.repository.mjs";

function toWorkspaceProfile(settings) {
  return {
    technicianId: String(settings.technicianId),
    userId: String(settings.userId),
    email: settings.email || "",
    fullName:
      settings.fullName || `${settings.firstName} ${settings.lastName}`.trim(),
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
    isAvailable:
      body?.isAvailable !== undefined ? body.isAvailable : current.isAvailable,
    serviceIds:
      body?.serviceIds !== undefined ? body.serviceIds : current.serviceIds,
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
      throw new HttpError(
        404,
        "TECHNICIAN_PROFILE_NOT_FOUND",
        "ไม่พบข้อมูลช่าง",
      );
    }

    res.status(200).json({
      message: "อัปเดตตำแหน่งปัจจุบันสำเร็จ",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

function assignmentError(code) {
  if (code === "ORDER_ALREADY_ASSIGNED") {
    return new HttpError(409, code, "คำขอบริการนี้มีช่างรับงานแล้ว");
  }
  return new HttpError(404, "ORDER_NOT_FOUND", "ไม่พบคำขอบริการ");
}

export async function getMyServiceRequests(req, res, next) {
  try {
    const { errors, value } = parseTechnicianListQuery(req.query);
    if (errors.length > 0) {
      throw new HttpError(
        400,
        "VALIDATION_ERROR",
        "ข้อมูลค้นหาไม่ถูกต้อง",
        errors,
      );
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const latitude = value.latitude ?? settings.latitude;
    const longitude = value.longitude ?? settings.longitude;

    if (!settings.isAvailable || latitude == null || longitude == null) {
      res.status(200).json({
        message: "Success",
        data: [],
        meta: { total: 0, isAvailable: settings.isAvailable },
      });
      return;
    }

    const data = await findAvailableRequests({
      technicianId: settings.technicianId,
      latitude,
      longitude,
      serviceId: value.serviceId,
      search: value.search,
    });

    res.status(200).json({
      message: "Success",
      data,
      meta: { total: data.length, isAvailable: settings.isAvailable },
    });
  } catch (error) {
    next(error);
  }
}

export async function postAcceptServiceRequest(req, res, next) {
  try {
    const orderId = parsePositiveId(req.params.orderId);
    if (!orderId) {
      throw new HttpError(404, "ORDER_NOT_FOUND", "ไม่พบคำขอบริการ");
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    if (!settings.isAvailable) {
      throw new HttpError(
        403,
        "TECHNICIAN_UNAVAILABLE",
        "กรุณาเปิดสถานะพร้อมรับบริการก่อนรับงาน",
      );
    }

    const result = await acceptOrderForTechnician({
      technicianId: settings.technicianId,
      orderId,
    });
    if (result.error) throw assignmentError(result.error);

    const job = await findTechnicianJob({
      technicianId: settings.technicianId,
      assignmentId: result.assignmentId,
    });

    res.status(200).json({
      message: "รับงานสำเร็จ",
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function postDeclineServiceRequest(req, res, next) {
  try {
    const orderId = parsePositiveId(req.params.orderId);
    if (!orderId) {
      throw new HttpError(404, "ORDER_NOT_FOUND", "ไม่พบคำขอบริการ");
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const result = await declineOrderForTechnician({
      technicianId: settings.technicianId,
      orderId,
    });
    if (result.error) throw assignmentError(result.error);

    res.status(200).json({
      message: "ปฏิเสธงานสำเร็จ",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyTechnicianJobs(req, res, next) {
  try {
    const { errors, value } = parseTechnicianListQuery(req.query);
    if (errors.length > 0) {
      throw new HttpError(
        400,
        "VALIDATION_ERROR",
        "ข้อมูลค้นหาไม่ถูกต้อง",
        errors,
      );
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const data = await findTechnicianJobs({
      technicianId: settings.technicianId,
      serviceId: value.serviceId,
      search: value.search,
      sort: value.sort,
      status: value.status,
    });

    res.status(200).json({
      message: "Success",
      data,
      meta: { total: data.length },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyTechnicianJob(req, res, next) {
  try {
    const assignmentId = parsePositiveId(req.params.assignmentId);
    if (!assignmentId) {
      throw new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const job = await findTechnicianJob({
      technicianId: settings.technicianId,
      assignmentId,
    });
    if (!job) {
      throw new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
    }

    res.status(200).json({
      message: "Success",
      data: job,
    });
  } catch (error) {
    next(error);
  }
}
