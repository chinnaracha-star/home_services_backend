import { supabase } from "../configs/supabase.mjs";
import { findTechnicianByUserId } from "../repositories/technician.repository.mjs";
import { findUserByEmail } from "../repositories/user.repository.mjs";
import { validateLogin } from "../validators/auth.validator.mjs";

export async function loginTechnician(req, res, next) {
  try {
    const { errors, value } = validateLogin(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        message: "กรุณากรอกข้อมูลเข้าสู่ระบบให้ครบถ้วน",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

    const { email, password } = value;
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.user || !authData?.session) {
      res.status(401).json({
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        code: "INVALID_CREDENTIALS",
      });
      return;
    }

    const userProfile = await findUserByEmail(authData.user.email);

    if (!userProfile || userProfile.role !== "TECHNICIAN") {
      res.status(403).json({
        message: "บัญชีนี้ไม่ใช่บัญชีช่าง",
        code: "NOT_TECHNICIAN",
      });
      return;
    }

    const technician = await findTechnicianByUserId(userProfile.id);

    if (!technician) {
      res.status(403).json({
        message: "ไม่พบข้อมูลช่างสำหรับบัญชีนี้",
        code: "TECHNICIAN_PROFILE_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      data: {
        user: userProfile,
        technician,
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at,
          tokenType: authData.session.token_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
