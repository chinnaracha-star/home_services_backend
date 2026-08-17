import {
  findUserById,
  updateUserAvatar,
  updateUserProfile,
} from "../repositories/user.repository.mjs";
import { uploadAvatar } from "../services/avatar.service.mjs";
import { HttpError } from "../utils/http-error.mjs";
import { validateUpdateProfile } from "../validators/user.validator.mjs";

export async function getMyProfile(req, res, next) {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้",
        code: "USER_NOT_FOUND",
        errors: [],
      });
      return;
    }

    res.status(200).json({
      data: user,
      message: "Success",
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const { errors, value } = validateUpdateProfile(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        message: "ข้อมูลโปรไฟล์ไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

    const user = await updateUserProfile(req.user.id, value);

    if (!user) {
      res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้",
        code: "USER_NOT_FOUND",
        errors: [],
      });
      return;
    }

    res.status(200).json({
      data: user,
      message: "อัปเดตโปรไฟล์สำเร็จ",
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadMyAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new HttpError(400, "AVATAR_REQUIRED", "กรุณาเลือกรูปโปรไฟล์");
    }

    if (!req.accessToken || !req.authUserId) {
      throw new HttpError(
        401,
        "AUTH_TOKEN_REQUIRED",
        "กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปโปรไฟล์",
      );
    }

    const avatarUrl = await uploadAvatar({
      authUserId: req.authUserId,
      accessToken: req.accessToken,
      file: req.file,
    });
    const user = await updateUserAvatar(req.user.id, avatarUrl);

    if (!user) {
      throw new HttpError(404, "USER_NOT_FOUND", "ไม่พบข้อมูลผู้ใช้");
    }

    res.status(200).json({
      data: user,
      message: "อัปโหลดรูปโปรไฟล์สำเร็จ",
    });
  } catch (error) {
    next(error);
  }
}
