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
  addCompletionImages,
  acceptOrderForTechnician,
  completeJobForTechnician,
  declineOrderForTechnician,
  findAvailableRequests,
  findCompletionImagePaths,
  findCompletionUploadTarget,
  findTechnicianJob,
  findTechnicianJobs,
} from "../repositories/technician-orders.repository.mjs";
import {
  createCompletionImageSignedUrls,
  removeCompletionImages,
  uploadCompletionImages,
} from "../services/job-completion-image.service.mjs";
import {
  MAX_COMPLETION_IMAGES,
  MIN_COMPLETION_IMAGES,
  requireCompletionImageCount,
} from "../middlewares/job-completion-upload.middleware.mjs";

function toWorkspaceProfile(settings) {
  const firstName = settings.firstName || "";
  const lastName = settings.lastName || "";

  return {
    technicianId: String(settings.technicianId),
    userId: String(settings.userId),
    email: settings.email || "",
    firstName,
    lastName,
    fullName: settings.fullName || `${firstName} ${lastName}`.trim(),
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

function pickProvidedText(body, camelKey, snakeKey) {
  if (body?.[camelKey] !== undefined) return String(body[camelKey] ?? "");
  if (body?.[snakeKey] !== undefined) return String(body[snakeKey] ?? "");
  return undefined;
}

function settingsFromWorkspaceBody(body, current) {
  const firstFromBody = pickProvidedText(body, "firstName", "first_name");
  const lastFromBody = pickProvidedText(body, "lastName", "last_name");

  let firstName = current.firstName;
  let lastName = current.lastName;

  if (firstFromBody !== undefined || lastFromBody !== undefined) {
    firstName = firstFromBody !== undefined ? firstFromBody.trim() : current.firstName;
    lastName = lastFromBody !== undefined ? lastFromBody.trim() : current.lastName;
  } else if (body?.fullName !== undefined) {
    const parts = String(body.fullName).trim().split(/\s+/).filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ");
  }

  return {
    firstName,
    lastName,
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

function completionError(code, imageCount = 0) {
  if (code === "JOB_ALREADY_COMPLETED") {
    return new HttpError(409, code, "งานนี้ถูกดำเนินการเสร็จสิ้นแล้ว");
  }
  if (code === "INVALID_JOB_STATUS") {
    return new HttpError(
      409,
      code,
      "สถานะปัจจุบันของงานไม่อนุญาตให้ส่งมอบงาน",
    );
  }
  if (code === "TOO_MANY_COMPLETION_IMAGES") {
    return new HttpError(
      400,
      code,
      `อัปโหลดรูปหลักฐานได้ไม่เกิน ${MAX_COMPLETION_IMAGES} รูป`,
    );
  }
  if (code === "MINIMUM_COMPLETION_IMAGES_REQUIRED") {
    return new HttpError(
      400,
      code,
      `ต้องมีรูปหลักฐานอย่างน้อย ${MIN_COMPLETION_IMAGES} รูป (ปัจจุบัน ${imageCount} รูป)`,
      [{ field: "images", imageCount, minimum: MIN_COMPLETION_IMAGES }],
    );
  }
  return new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
}

async function tryCreateCompletionImageSignedUrls(accessToken, objectPaths) {
  try {
    return await createCompletionImageSignedUrls({
      accessToken,
      objectPaths,
    });
  } catch {
    return [];
  }
}

async function attachCompletionImages(job, technicianId, accessToken) {
  if (!job) return job;
  const images = await findCompletionImagePaths({
    technicianId,
    assignmentId: job.assignmentId,
  });
  const signed = await tryCreateCompletionImageSignedUrls(
    accessToken,
    images.map((image) => image.objectPath),
  );
  const signedByPath = new Map(
    signed.map((image) => [image.objectPath, image]),
  );

  return {
    ...job,
    completionImages: images.map((image) => ({
      ...image,
      signedUrl: signedByPath.get(image.objectPath)?.signedUrl ?? null,
      expiresIn: signedByPath.get(image.objectPath)?.expiresIn ?? null,
    })),
  };
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
    let job = await findTechnicianJob({
      technicianId: settings.technicianId,
      assignmentId,
    });
    if (!job) {
      throw new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
    }
    job = await attachCompletionImages(
      job,
      settings.technicianId,
      req.accessToken,
    );

    res.status(200).json({
      message: "Success",
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function postMyJobCompletionImages(req, res, next) {
  let uploadedPaths = [];
  try {
    const assignmentId = parsePositiveId(req.params.assignmentId);
    if (!assignmentId) {
      throw new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
    }
    requireCompletionImageCount(req.files);

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const target = await findCompletionUploadTarget({
      technicianId: settings.technicianId,
      assignmentId,
    });
    if (!target) throw completionError("JOB_NOT_FOUND");

    const status = String(target.status).toUpperCase();
    if (status === "COMPLETED") {
      throw completionError("JOB_ALREADY_COMPLETED");
    }
    if (!["ACCEPTED", "IN_PROGRESS"].includes(status)) {
      throw completionError("INVALID_JOB_STATUS");
    }
    if (target.imageCount + req.files.length > MAX_COMPLETION_IMAGES) {
      throw completionError("TOO_MANY_COMPLETION_IMAGES");
    }

    uploadedPaths = await uploadCompletionImages({
      authUserId: req.authUserId,
      accessToken: req.accessToken,
      assignmentId,
      files: req.files,
    });

    const result = await addCompletionImages({
      technicianId: settings.technicianId,
      assignmentId,
      objectPaths: uploadedPaths,
      maxImages: MAX_COMPLETION_IMAGES,
    });
    if (result.error) {
      await removeCompletionImages({
        accessToken: req.accessToken,
        objectPaths: uploadedPaths,
      });
      uploadedPaths = [];
      throw completionError(result.error);
    }

    const persistedPaths = uploadedPaths;
    uploadedPaths = [];
    const signed = await tryCreateCompletionImageSignedUrls(
      req.accessToken,
      persistedPaths,
    );
    const signedByPath = new Map(
      signed.map((image) => [image.objectPath, image]),
    );

    res.status(201).json({
      message: "อัปโหลดรูปหลักฐานสำเร็จ",
      data: {
        assignmentId: String(assignmentId),
        imageCount: result.imageCount,
        images: result.images.map((image) => ({
          ...image,
          signedUrl: signedByPath.get(image.objectPath)?.signedUrl ?? null,
          expiresIn: signedByPath.get(image.objectPath)?.expiresIn ?? null,
        })),
      },
    });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await removeCompletionImages({
        accessToken: req.accessToken,
        objectPaths: uploadedPaths,
      });
    }
    next(error);
  }
}

export async function postCompleteMyTechnicianJob(req, res, next) {
  try {
    const assignmentId = parsePositiveId(req.params.assignmentId);
    if (!assignmentId) {
      throw new HttpError(404, "JOB_NOT_FOUND", "ไม่พบงานที่ต้องการ");
    }

    const settings = await getOwnedTechnicianSettings(req.user.id);
    const result = await completeJobForTechnician({
      technicianId: settings.technicianId,
      assignmentId,
      minimumImages: MIN_COMPLETION_IMAGES,
    });
    if (result.error) {
      throw completionError(result.error, result.imageCount);
    }

    let job = await findTechnicianJob({
      technicianId: settings.technicianId,
      assignmentId,
    });
    job = await attachCompletionImages(
      job,
      settings.technicianId,
      req.accessToken,
    );

    res.status(200).json({
      message: "ดำเนินการเสร็จสิ้นและส่งมอบงานสำเร็จ",
      data: job,
    });
  } catch (error) {
    next(error);
  }
}
