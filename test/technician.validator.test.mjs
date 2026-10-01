import test from "node:test";
import assert from "node:assert/strict";
import { validateUpdateTechnicianSettings, parsePositiveId, parseTechnicianListQuery } from "../src/validators/technician.validator.mjs";

const validSettings = {
  firstName: "สมาน",
  lastName: "เยี่ยมยอด",
  phone: "0890002345",
  address: "332 อาคารเดอะไนน์ทาวเวอร์ กรุงเทพมหานคร",
  isAvailable: true,
  serviceIds: [1, 2, 3],
};

test("accepts a valid technician settings payload", () => {
  const { errors, value } = validateUpdateTechnicianSettings(validSettings);

  assert.equal(errors.length, 0);
  assert.equal(value.firstName, "สมาน");
  assert.equal(value.isAvailable, true);
  assert.deepEqual(value.serviceIds, [1, 2, 3]);
});

test("requires first name, last name, phone, and address", () => {
  const { errors } = validateUpdateTechnicianSettings({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    isAvailable: true,
    serviceIds: [],
  });

  assert.ok(errors.some((error) => error.field === "firstName"));
  assert.ok(errors.some((error) => error.field === "lastName"));
  assert.ok(errors.some((error) => error.field === "phone"));
  assert.ok(errors.some((error) => error.field === "address"));
});

test("requires a boolean availability flag", () => {
  const { errors } = validateUpdateTechnicianSettings({
    ...validSettings,
    isAvailable: "yes",
  });

  assert.ok(errors.some((error) => error.field === "isAvailable"));
});

test("rejects invalid service ids", () => {
  const { errors } = validateUpdateTechnicianSettings({
    ...validSettings,
    serviceIds: ["aircon"],
  });

  assert.ok(errors.some((error) => error.field === "serviceIds"));
});

test("parses request list query and positive ids", () => {
  assert.equal(parsePositiveId("101"), 101);
  assert.equal(parsePositiveId("abc"), null);

  const { errors, value } = parseTechnicianListQuery({
    search: "HS-1",
    sort: "nearest",
    latitude: "18.7964",
    longitude: "98.9673",
    serviceId: "3",
  });

  assert.equal(errors.length, 0);
  assert.equal(value.search, "HS-1");
  assert.equal(value.sort, "nearest");
  assert.equal(value.serviceId, 3);
  assert.equal(value.latitude, 18.7964);
  assert.equal(value.longitude, 98.9673);
});

test("rejects an invalid sort value", () => {
  const { errors } = parseTechnicianListQuery({ sort: "far" });
  assert.ok(errors.some((error) => error.field === "sort"));
});
