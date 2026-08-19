const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;
const FULL_NAME_PATTERN = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;
const MIN_PASSWORD_LENGTH = 12;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateEmailValue(email) {
  if (!email || !email.includes("@") || !email.includes(".com") || !EMAIL_PATTERN.test(email)) {
    return "กรุณากรอกอีเมลให้ถูกต้อง (ต้องมี @ และ .com)";
  }

  return null;
}

function validatePasswordValue(password) {
  if (!password) {
    return "กรุณากรอกรหัสผ่าน";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `รหัสผ่านต้องมีความยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  }

  return null;
}

export function validateUserRegister(body) {
  const errors = [];
  const fullName = asText(body?.fullName);
  const email = asText(body?.email).toLowerCase();
  const phone = asText(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";
  const acceptedTerms = body?.acceptedTerms === true;

  if (!fullName) {
    errors.push({
      field: "fullName",
      message: "กรุณากรอกชื่อ-นามสกุล",
    });
  } else if (fullName.length < 2 || fullName.length > 80) {
    errors.push({
      field: "fullName",
      message: "กรุณากรอกชื่อ-นามสกุล 2 ถึง 80 ตัวอักษร",
    });
  } else if (!FULL_NAME_PATTERN.test(fullName)) {
    errors.push({
      field: "fullName",
      message: "ชื่อ-นามสกุลต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น และใช้อักขระ ' หรือ - ได้",
    });
  }

  const emailError = validateEmailValue(email);
  if (emailError) {
    errors.push({ field: "email", message: emailError });
  }

  if (!phone) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์โทรศัพท์",
    });
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)",
    });
  }

  const passwordError = validatePasswordValue(password);
  if (passwordError) {
    errors.push({ field: "password", message: passwordError });
  }

  if (!acceptedTerms) {
    errors.push({
      field: "acceptedTerms",
      message: "กรุณายอมรับข้อตกลงและนโยบายความเป็นส่วนตัว",
    });
  }

  return {
    errors,
    value: {
      fullName,
      email,
      phone,
      password,
      acceptedTerms,
    },
  };
}

export function validateUserLogin(body) {
  const errors = [];
  const email = asText(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";

  const emailError = validateEmailValue(email);
  if (emailError) {
    errors.push({ field: "email", message: emailError });
  }

  const passwordError = validatePasswordValue(password);
  if (passwordError) {
    errors.push({ field: "password", message: passwordError });
  }

  return {
    errors,
    value: {
      email,
      password,
    },
  };
}
