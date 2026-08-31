import { env } from "../configs/env.mjs";
import { createRequestAuthClient, supabase } from "../configs/supabase.mjs";
import { HttpError } from "../utils/http-error.mjs";

function clientOrigin() {
  return String(env.clientOrigin || "http://localhost:3000").replace(/\/$/, "");
}

function readAccessToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice("Bearer ".length).trim();
}

function readRefreshToken(req, bodyToken) {
  const headerToken = req.headers["x-refresh-token"];
  if (typeof headerToken === "string" && headerToken.trim()) {
    return headerToken.trim();
  }

  return bodyToken || "";
}

export async function requestPasswordResetEmail(email) {
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${clientOrigin()}/reset-password`,
  });
}

export async function resetPasswordWithRecoveryToken(req, newPassword, bodyRefreshToken) {
  const accessToken = readAccessToken(req);
  if (!accessToken) {
    throw new HttpError(
      401,
      "RECOVERY_TOKEN_REQUIRED",
      "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ",
    );
  }

  const authClient = createRequestAuthClient();
  const {
    data: { user: tokenUser },
    error: tokenError,
  } = await authClient.auth.getUser(accessToken);

  if (tokenError || !tokenUser) {
    throw new HttpError(
      401,
      "RECOVERY_TOKEN_INVALID",
      "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ",
    );
  }

  const refreshToken = readRefreshToken(req, bodyRefreshToken);
  if (!refreshToken) {
    throw new HttpError(
      401,
      "RECOVERY_SESSION_INVALID",
      "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ",
    );
  }

  const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError || !sessionData?.session || sessionData.user?.id !== tokenUser.id) {
    await authClient.auth.signOut({ scope: "local" }).catch(() => undefined);
    throw new HttpError(
      401,
      "RECOVERY_SESSION_INVALID",
      "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ",
    );
  }

  const { error: updateError } = await authClient.auth.updateUser({
    password: newPassword,
  });

  await authClient.auth.signOut({ scope: "local" }).catch(() => undefined);

  if (updateError) {
    throw new HttpError(
      400,
      "PASSWORD_RESET_FAILED",
      updateError.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้",
    );
  }
}
