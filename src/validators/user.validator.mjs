const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{Letter}\p{Mark}]+(?:[ '\-][\p{Letter}\p{Mark}]+)*$/u;
const MIN_PASSWORD_LENGTH = 6;

function asPassword(value) {
  return typeof value === "string" ? value : "";
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(body, field, { lowercase = false } = {}) {
  if (!Object.hasOwn(body ?? {}, field)) {
    return undefined;
  }

  const value = asText(body[field]);
  if (!value) {
    return null;
  }

  return lowercase ? value.toLowerCase() : value;
}

function validateOptionalName(errors, field, value, { maxLength, lengthMessage, patternMessage }) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (value.length < 2 || value.length > maxLength) {
    errors.push({ field, message: lengthMessage });
    return;
  }

  if (!NAME_PATTERN.test(value)) {
    errors.push({ field, message: patternMessage });
  }
}

export function validateUpdateProfile(body) {
  const errors = [];
  const firstName = optionalText(body, "firstName");
  const lastName = optionalText(body, "lastName");
  const displayName = optionalText(body, "displayName");
  const fullName = optionalText(body, "fullName");
  const email = optionalText(body, "email", { lowercase: true });
  const phone = optionalText(body, "phone");
  const address = optionalText(body, "address");
  const avatarUrl = optionalText(body, "avatarUrl");

  validateOptionalName(errors, "firstName", firstName, {
    maxLength: 50,
    lengthMessage: "กรุณากรอกชื่อจริง 2 ถึง 50 ตัวอักษร",
    patternMessage: "ชื่อจริงต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
  });
  validateOptionalName(errors, "lastName", lastName, {
    maxLength: 50,
    lengthMessage: "กรุณากรอกนามสกุล 2 ถึง 50 ตัวอักษร",
    patternMessage: "นามสกุลต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
  });

  const primaryNameField = displayName !== undefined ? "displayName" : "fullName";
  const primaryName = displayName !== undefined ? displayName : fullName;
  validateOptionalName(errors, primaryNameField, primaryName, {
    maxLength: 80,
    lengthMessage: "ชื่อที่แสดงต้องมีความยาว 2 ถึง 80 ตัวอักษร",
    patternMessage: "ชื่อที่แสดงต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
  });

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.push({
      field: "email",
      message: "กรุณากรอกอีเมลให้ถูกต้อง",
    });
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง",
    });
  }

  if (address && address.length > 200) {
    errors.push({
      field: "address",
      message: "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร",
    });
  }

  if (avatarUrl && avatarUrl.length > 500) {
    errors.push({
      field: "avatarUrl",
      message: "ลิงก์รูปโปรไฟล์ยาวเกินไป",
    });
  }

  return {
    errors,
    value: {
      firstName,
      lastName,
      displayName,
      fullName,
      email,
      phone,
      address,
      avatarUrl,
    },
  };
}

export function validateChangePassword(body) {
  const errors = [];
  const currentPassword = asPassword(body?.currentPassword);
  const newPassword = asPassword(body?.newPassword);
  const confirmNewPassword = asPassword(
    body?.confirmNewPassword ?? body?.confirmPassword,
  );

  if (!currentPassword) {
    errors.push({
      field: "currentPassword",
      message: "กรุณากรอกรหัสผ่านปัจจุบัน",
    });
  }

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

  if (
    currentPassword &&
    newPassword &&
    currentPassword === newPassword &&
    !errors.some((error) => error.field === "newPassword")
  ) {
    errors.push({
      field: "newPassword",
      message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน",
    });
  }

  return {
    errors,
    value: {
      currentPassword,
      newPassword,
      confirmNewPassword,
    },
  };
}
