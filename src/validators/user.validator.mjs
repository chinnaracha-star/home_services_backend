const PHONE_PATTERN = /^0[0-9]{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{Letter}\p{Mark}]+(?:[ '\-][\p{Letter}\p{Mark}]+)*$/u;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateUpdateProfile(body) {
  const errors = [];
  const fullName = asText(body?.fullName);
  const displayName = asText(body?.displayName);
  const firstName = asText(body?.firstName);
  const lastName = asText(body?.lastName);
  const email = asText(body?.email).toLowerCase();
  const phone = asText(body?.phone);
  const address = asText(body?.address);
  const avatarUrl = asText(body?.avatarUrl);

  if (fullName.length < 2 || fullName.length > 80) {
    errors.push({
      field: "fullName",
      message: "กรุณากรอกชื่อ-นามสกุล 2 ถึง 80 ตัวอักษร",
    });
  }

  for (const [field, label, value, maxLength] of [
    ["displayName", "ชื่อที่แสดง", displayName, 80],
    ["firstName", "ชื่อจริง", firstName, 50],
    ["lastName", "นามสกุล", lastName, 50],
  ]) {
    if (value && (value.length < 2 || value.length > maxLength || !NAME_PATTERN.test(value))) {
      errors.push({
        field,
        message: `${label}ต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษ 2 ถึง ${maxLength} ตัวอักษร`,
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

  if (address.length > 200) {
    errors.push({
      field: "address",
      message: "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร",
    });
  }

  if (avatarUrl.length > 500) {
    errors.push({
      field: "avatarUrl",
      message: "ลิงก์รูปโปรไฟล์ยาวเกินไป",
    });
  }

  return {
    errors,
    value: {
      fullName,
      displayName: Object.hasOwn(body ?? {}, "displayName") ? displayName || null : undefined,
      firstName: Object.hasOwn(body ?? {}, "firstName") ? firstName || null : undefined,
      lastName: Object.hasOwn(body ?? {}, "lastName") ? lastName || null : undefined,
      email: email || null,
      phone: phone || null,
      address: address || null,
      avatarUrl: avatarUrl || null,
    },
  };
}
