const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;
const NAME_PATTERN = /^[\p{Letter}\p{Mark}]+(?:[ '\-][\p{Letter}\p{Mark}]+)*$/u;
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
  const firstName = asText(body?.firstName);
  const lastName = asText(body?.lastName);
  let fullName = asText(body?.fullName);
  const displayName = asText(body?.displayName);
  const email = asText(body?.email).toLowerCase();
  const phone = asText(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";
  const acceptedTerms = body?.acceptedTerms === true;

  if (firstName || lastName) {
    if (!firstName) {
      errors.push({
        field: "firstName",
        message: "กรุณากรอกชื่อจริง",
      });
    } else if (firstName.length < 2 || firstName.length > 50) {
      errors.push({
        field: "firstName",
        message: "กรุณากรอกชื่อจริง 2 ถึง 50 ตัวอักษร",
      });
    } else if (!NAME_PATTERN.test(firstName)) {
      errors.push({
        field: "firstName",
        message: "ชื่อจริงต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
      });
    }

    if (!lastName) {
      errors.push({
        field: "lastName",
        message: "กรุณากรอกนามสกุล",
      });
    } else if (lastName.length < 2 || lastName.length > 50) {
      errors.push({
        field: "lastName",
        message: "กรุณากรอกนามสกุล 2 ถึง 50 ตัวอักษร",
      });
    } else if (!NAME_PATTERN.test(lastName)) {
      errors.push({
        field: "lastName",
        message: "นามสกุลต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
      });
    }

    if (!fullName) {
      fullName = displayName || `${firstName} ${lastName}`.trim();
    }
  } else {
    // Legacy fallback if only fullName is provided
    if (!fullName) {
      errors.push({
        field: "firstName",
        message: "กรุณากรอกชื่อจริง",
      });
      errors.push({
        field: "lastName",
        message: "กรุณากรอกนามสกุล",
      });
    } else if (fullName.length < 2 || fullName.length > 80) {
      errors.push({
        field: "fullName",
        message: "กรุณากรอกชื่อ-นามสกุล 2 ถึง 80 ตัวอักษร",
      });
    } else if (!NAME_PATTERN.test(fullName)) {
      errors.push({
        field: "fullName",
        message: "ชื่อ-นามสกุลต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
      });
    }
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
      firstName: firstName || (fullName ? fullName.split(/\s+/)[0] : ""),
      lastName: lastName || (fullName ? fullName.split(/\s+/).slice(1).join(" ") : ""),
      fullName,
      displayName: displayName || fullName,
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
