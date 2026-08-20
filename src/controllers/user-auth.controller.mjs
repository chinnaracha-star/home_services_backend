import { supabase } from "../configs/supabase.mjs";
import { createUser, findUserByEmail } from "../repositories/user.repository.mjs";
import { registerCustomer } from "../services/register-user.service.mjs";
import {
  validateUserLogin,
  validateUserRegister,
} from "../validators/user-auth.validator.mjs";

export async function registerUser(req, res, next) {
  try {
    const { errors, value } = validateUserRegister(req.body);

    if (errors.length > 0) {
      res.status(400).json({
        message: "ข้อมูลการลงทะเบียนไม่ถูกต้อง",
        code: "VALIDATION_ERROR",
        errors,
      });
      return;
    }

    const { user, session } = await registerCustomer(value);

    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ",
      data: {
        user,
        session,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { errors, value } = validateUserLogin(req.body);

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

    let userProfile = await findUserByEmail(authData.user.email);

    if (!userProfile) {
      userProfile = await createUser({
        username: authData.user.email.split("@")[0],
        email: authData.user.email,
        fullName:
          authData.user.user_metadata?.full_name ||
          authData.user.email.split("@")[0],
        phone: authData.user.user_metadata?.phone || null,
        role: "USER",
      });
    }

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      data: {
        user: userProfile,
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
