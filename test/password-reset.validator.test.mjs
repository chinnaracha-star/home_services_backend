import test from "node:test";
import assert from "node:assert/strict";
import {
  validateForgotPassword,
  validateResetPassword,
} from "../src/validators/password-reset.validator.mjs";

test("forgot password accepts a valid email", () => {
  const { errors, value } = validateForgotPassword({ email: "user@example.com" });
  assert.equal(errors.length, 0);
  assert.equal(value.email, "user@example.com");
});

test("forgot password rejects an invalid email", () => {
  const { errors } = validateForgotPassword({ email: "not-an-email" });
  assert.ok(errors.some((error) => error.field === "email"));
});

test("user forgot password requires a .com email", () => {
  const { errors } = validateForgotPassword(
    { email: "user@example.co.th" },
    { requireDotCom: true },
  );
  assert.ok(errors.some((error) => error.field === "email"));
});

test("reset password accepts matching new passwords", () => {
  const { errors } = validateResetPassword({
    newPassword: "newPassword123!",
    confirmNewPassword: "newPassword123!",
  });
  assert.equal(errors.length, 0);
});

test("reset password rejects a short password", () => {
  const { errors } = validateResetPassword({
    newPassword: "short",
    confirmNewPassword: "short",
  });
  assert.ok(errors.some((error) => error.field === "newPassword"));
});

test("reset password rejects mismatched confirmation", () => {
  const { errors } = validateResetPassword({
    newPassword: "newPassword123!",
    confirmPassword: "otherPassword123!",
  });
  assert.ok(errors.some((error) => error.field === "confirmNewPassword"));
});
