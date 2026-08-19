const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRegister(body) {
  const errors = [];
  const fullName = asText(body?.fullName);
  const email = asText(body?.email).toLowerCase();
  const phone = asText(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";

  if (fullName.length < 2 || fullName.length > 80) {
    errors.push({
      field: "fullName",
      message: "กรุณากรอกชื่อ-นามสกุล 2 ถึง 80 ตัวอักษร",
    });
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.push({
      field: "email",
      message: "กรุณากรอกอีเมลให้ถูกต้อง",
    });
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)",
    });
  }

  if (!password || password.length < 6) {
    errors.push({
      field: "password",
      message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    });
  }

  return {
    errors,
    value: {
      fullName,
      email,
      phone: phone || null,
      password,
    },
  };
}

export function validateLogin(body) {
  const errors = [];
  const email = asText(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.push({
      field: "email",
      message: "กรุณากรอกอีเมลให้ถูกต้อง",
    });
  }

  if (!password) {
    errors.push({
      field: "password",
      message: "กรุณากรอกรหัสผ่าน",
    });
  }

  return {
    errors,
    value: {
      email,
      password,
    },
  };
}
