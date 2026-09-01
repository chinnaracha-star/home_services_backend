import test from "node:test";
import assert from "node:assert/strict";
import { validateChangePassword, validateUpdateProfile } from "../src/validators/user.validator.mjs";

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

const validPasswordChange = {
  currentPassword: "userPassword123!",
  newPassword: "newPassword123!",
  confirmNewPassword: "newPassword123!",
};

test("password change accepts a valid payload", () => {
  const { errors, value } = validateChangePassword(validPasswordChange);
  assert.equal(errors.length, 0);
  assert.equal(value.newPassword, "newPassword123!");
});

test("password change accepts confirmPassword as an alias", () => {
  const { errors } = validateChangePassword({
    currentPassword: "userPassword123!",
    newPassword: "newPassword123!",
    confirmPassword: "newPassword123!",
  });
  assert.equal(errors.length, 0);
});

test("password change requires all three fields", () => {
  const { errors } = validateChangePassword({});
  assert.ok(errors.some((error) => error.field === "currentPassword"));
  assert.ok(errors.some((error) => error.field === "newPassword"));
  assert.ok(errors.some((error) => error.field === "confirmNewPassword"));
});

test("password change rejects a short new password", () => {
  const { errors } = validateChangePassword({
    ...validPasswordChange,
    newPassword: "short",
    confirmNewPassword: "short",
  });
  assert.ok(errors.some((error) => error.field === "newPassword"));
});

test("password change rejects mismatched confirmation", () => {
  const { errors } = validateChangePassword({
    ...validPasswordChange,
    confirmNewPassword: "otherPassword123!",
  });
  assert.ok(errors.some((error) => error.field === "confirmNewPassword"));
});

test("password change rejects reusing the current password", () => {
  const { errors } = validateChangePassword({
    currentPassword: "userPassword123!",
    newPassword: "userPassword123!",
    confirmNewPassword: "userPassword123!",
  });
  assert.ok(errors.some((error) => error.field === "newPassword"));
});
