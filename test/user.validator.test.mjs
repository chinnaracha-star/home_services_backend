import test from "node:test";
import assert from "node:assert/strict";
import { validateUpdateProfile } from "../src/validators/user.validator.mjs";

const validProfile = {
  fullName: "สมชาย ใจดี",
  displayName: "สมชาย ใจดี",
  firstName: "สมชาย",
  lastName: "ใจดี",
  email: "somchai@example.com",
  phone: "0812345678",
};

test("profile update accepts and normalizes separate name fields", () => {
  const { errors, value } = validateUpdateProfile(validProfile);
  assert.equal(errors.length, 0);
  assert.equal(value.displayName, "สมชาย ใจดี");
  assert.equal(value.firstName, "สมชาย");
  assert.equal(value.lastName, "ใจดี");
});

test("profile update preserves omitted optional name fields", () => {
  const { value } = validateUpdateProfile({
    fullName: "John Doe",
    email: "john@example.com",
  });
  assert.equal(value.displayName, undefined);
  assert.equal(value.firstName, undefined);
  assert.equal(value.lastName, undefined);
});

test("profile update allows explicitly clearing first and last name", () => {
  const { errors, value } = validateUpdateProfile({
    ...validProfile,
    firstName: null,
    lastName: "",
  });
  assert.equal(errors.length, 0);
  assert.equal(value.firstName, null);
  assert.equal(value.lastName, null);
});

test("profile update rejects invalid names, email, and phone", () => {
  const { errors } = validateUpdateProfile({
    ...validProfile,
    displayName: "A",
    firstName: "John2",
    email: "invalid-email",
    phone: "123",
  });
  assert.ok(errors.some((error) => error.field === "displayName"));
  assert.ok(errors.some((error) => error.field === "firstName"));
  assert.ok(errors.some((error) => error.field === "email"));
  assert.ok(errors.some((error) => error.field === "phone"));
});
