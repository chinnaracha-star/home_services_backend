const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{Letter}\p{Mark}]+(?:[ '\-][\p{Letter}\p{Mark}]+)*$/u;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasOwn(body, key) {
  return Object.hasOwn(body ?? {}, key);
}

export function validateUpdateProfile(body) {
  const errors = [];
  const fullName = hasOwn(body, "fullName") ? asText(body.fullName) : undefined;
  const displayName = hasOwn(body, "displayName") ? asText(body.displayName) : undefined;
  const firstName = hasOwn(body, "firstName") ? asText(body.firstName) : undefined;
  const lastName = hasOwn(body, "lastName") ? asText(body.lastName) : undefined;
  const email = hasOwn(body, "email") ? asText(body.email).toLowerCase() : undefined;
  const phone = hasOwn(body, "phone") ? asText(body.phone) : undefined;
  const address = hasOwn(body, "address") ? asText(body.address) : undefined;
  const avatarUrl = hasOwn(body, "avatarUrl") ? asText(body.avatarUrl) : undefined;

  if (firstName !== undefined && firstName !== "") {
    if (firstName.length < 2 || firstName.length > 50) {
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
  }

  if (lastName !== undefined && lastName !== "") {
    if (lastName.length < 2 || lastName.length > 50) {
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
  }

  const primaryName = displayName !== undefined ? displayName : fullName;
  if (primaryName !== undefined && primaryName !== "") {
    if (primaryName.length < 2 || primaryName.length > 80) {
      errors.push({
        field: displayName !== undefined ? "displayName" : "fullName",
        message: "ชื่อที่แสดงต้องมีความยาว 2 ถึง 80 ตัวอักษร",
      });
    } else if (!NAME_PATTERN.test(primaryName)) {
      errors.push({
        field: displayName !== undefined ? "displayName" : "fullName",
        message: "ชื่อที่แสดงต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น",
      });
    }
  }

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
      fullName,
      displayName: hasOwn(body, "displayName") ? displayName || null : undefined,
      firstName: hasOwn(body, "firstName") ? firstName || null : undefined,
      lastName: hasOwn(body, "lastName") ? lastName || null : undefined,
      email: email || null,
      phone: phone || null,
      address: address || null,
      avatarUrl: avatarUrl || null,
    },
  };
}
