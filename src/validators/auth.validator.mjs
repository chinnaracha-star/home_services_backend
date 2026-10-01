const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{Letter}\p{Mark}]+(?:[ '\-][\p{Letter}\p{Mark}]+)*$/u;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRegister(body) {
  const errors = [];
  const firstName = asText(body?.firstName);
  const lastName = asText(body?.lastName);
  let fullName = asText(body?.fullName);
  const displayName = asText(body?.displayName);
  const email = asText(body?.email).toLowerCase();
  const phone = asText(body?.phone);
  const password = typeof body?.password === "string" ? body.password : "";

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
      firstName: firstName || (fullName ? fullName.split(/\s+/)[0] : ""),
      lastName: lastName || (fullName ? fullName.split(/\s+/).slice(1).join(" ") : ""),
      fullName,
      displayName: displayName || fullName,
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
