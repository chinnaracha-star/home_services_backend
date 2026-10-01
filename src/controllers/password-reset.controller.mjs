import {
  requestPasswordResetEmail,
  resetPasswordWithRecoveryToken,
} from "../services/password-reset.service.mjs";
import {
  validateForgotPassword,
  validateResetPassword,
} from "../validators/password-reset.validator.mjs";

function forgotPasswordHandler({ requireDotCom = false } = {}) {
  return async function forgotPassword(req, res, next) {
    try {
      const { errors, value } = validateForgotPassword(req.body, { requireDotCom });

      if (errors.length > 0) {
        res.status(400).json({
          message: "กรุณากรอกอีเมลให้ถูกต้อง",
          code: "VALIDATION_ERROR",
          errors,
        });
        return;
      }

      await requestPasswordResetEmail(value.email);

      res.status(200).json({
        data: null,
        message: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่แล้ว",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const forgotPassword = forgotPasswordHandler();
export const forgotPasswordForUser = forgotPasswordHandler({ requireDotCom: true });

export async function resetPassword(req, res, next) {
  try {
    const { errors, value } = validateResetPassword(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        message: "ข้อมูลรหัสผ่านไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

    await resetPasswordWithRecoveryToken(req, value.newPassword, value.refreshToken);

    res.status(200).json({
      data: null,
      message: "ตั้งรหัสผ่านใหม่สำเร็จ",
    });
  } catch (error) {
    next(error);
  }
}
