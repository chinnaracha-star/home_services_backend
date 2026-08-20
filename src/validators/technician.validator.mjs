const PHONE_PATTERN = /^0[0-9]{8,9}$/;

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseServiceIds(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const ids = [];
  const seen = new Set();

  for (const item of value) {
    const id = Number(item);
    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  return ids;
}

export function validateUpdateTechnicianSettings(body) {
  const errors = [];
  const firstName = asText(body?.firstName);
  const lastName = asText(body?.lastName);
  const phone = asText(body?.phone);
  const address = asText(body?.address);
  const serviceIds = parseServiceIds(body?.serviceIds);

  if (!firstName || firstName.length > 80) {
    errors.push({
      field: "firstName",
      message: "กรุณากรอกชื่อ 1 ถึง 80 ตัวอักษร",
    });
  }

  if (!lastName || lastName.length > 80) {
    errors.push({
      field: "lastName",
      message: "กรุณากรอกนามสกุล 1 ถึง 80 ตัวอักษร",
    });
  }

  if (!phone) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์ติดต่อ",
    });
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.push({
      field: "phone",
      message: "กรุณากรอกเบอร์ติดต่อให้ถูกต้อง (เช่น 0890002345)",
    });
  }

  if (!address) {
    errors.push({
      field: "address",
      message: "กรุณากรอกตำแหน่งที่อยู่ปัจจุบัน",
    });
  } else if (address.length > 500) {
    errors.push({
      field: "address",
      message: "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร",
    });
  }

  if (typeof body?.isAvailable !== "boolean") {
    errors.push({
      field: "isAvailable",
      message: "กรุณาระบุสถานะพร้อมให้บริการ",
    });
  }

  if (!serviceIds) {
    errors.push({
      field: "serviceIds",
      message: "กรุณาเลือกบริการที่รับซ่อมให้ถูกต้อง",
    });
  }

  return {
    errors,
    value: {
      firstName,
      lastName,
      phone,
      address,
      isAvailable: body?.isAvailable === true,
      serviceIds: serviceIds || [],
    },
  };
}

export function validateLocation(body = {}) {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const errors = [];

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: "latitude", message: "latitude ต้องอยู่ระหว่าง -90 ถึง 90" });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: "longitude", message: "longitude ต้องอยู่ระหว่าง -180 ถึง 180" });
  }

  return { errors, value: { latitude, longitude } };
}
