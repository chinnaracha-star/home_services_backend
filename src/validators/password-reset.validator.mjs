const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;
const MIN_PASSWORD_LENGTH = 12;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asPassword(value) {
  return typeof value === "string" ? value : "";
}

export function validateForgotPassword(body, { requireDotCom = false } = {}) {
  const errors = [];
  const email = asText(body?.email).toLowerCase();
  const pattern = requireDotCom ? USER_EMAIL_PATTERN : EMAIL_PATTERN;

  if (
    !email ||
    !pattern.test(email) ||
    (requireDotCom && (!email.includes("@") || !email.includes(".com")))
  ) {
    errors.push({
      field: "email",
      message: requireDotCom
        ? "กรุณากรอกอีเมลให้ถูกต้อง (ต้องมี @ และ .com)"
        : "กรุณากรอกอีเมลให้ถูกต้อง",
    });
  }

  return {
    errors,
    value: { email },
  };
}

export function validateResetPassword(body) {
  const errors = [];
  const newPassword = asPassword(body?.newPassword);
  const confirmNewPassword = asPassword(
    body?.confirmNewPassword ?? body?.confirmPassword,
  );
  const refreshToken = asPassword(body?.refreshToken);

  if (!newPassword) {
    errors.push({
      field: "newPassword",
      message: "กรุณากรอกรหัสผ่านใหม่",
    });
  } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: "newPassword",
      message: `รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`,
    });
  }

  if (!confirmNewPassword) {
    errors.push({
      field: "confirmNewPassword",
      message: "กรุณายืนยันรหัสผ่านใหม่",
    });
  } else if (newPassword && confirmNewPassword !== newPassword) {
    errors.push({
      field: "confirmNewPassword",
      message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
    });
  }

  return {
    errors,
    value: {
      newPassword,
      confirmNewPassword,
      refreshToken: refreshToken || null,
    },
  };
}
