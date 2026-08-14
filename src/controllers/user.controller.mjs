import {
  findUserById,
  updateUserProfile,
} from "../repositories/user.repository.mjs";
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
