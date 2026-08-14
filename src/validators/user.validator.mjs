const PHONE_PATTERN = /^0[0-9]{8,9}$/;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateUpdateProfile(body) {
  const errors = [];
  const fullName = asText(body?.fullName);
  const phone = asText(body?.phone);
  const address = asText(body?.address);
  const avatarUrl = asText(body?.avatarUrl);

  if (fullName.length < 2 || fullName.length > 80) {
    errors.push({
      field: "fullName",
      message: "กรุณากรอกชื่อ-นามสกุล 2 ถึง 80 ตัวอักษร",
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
      phone: phone || null,
      address: address || null,
      avatarUrl: avatarUrl || null,
    },
  };
}
