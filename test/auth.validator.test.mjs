import test from "node:test";
import assert from "node:assert/strict";
import { validateLogin, validateRegister } from "../src/validators/auth.validator.mjs";
import {
  validateUserLogin,
  validateUserRegister,
} from "../src/validators/user-auth.validator.mjs";

const validUserRegister = {
  fullName: "John Doe",
  phone: "0812345678",
  email: "user@example.com",
  password: "password12345",
  acceptedTerms: true,
};

test("old auth still accepts a short password and non-.com email on login", () => {
  const { errors } = validateLogin({
    email: "admin@company.co.th",
    password: "short",
  });

  assert.equal(errors.length, 0);
});

test("old register still accepts a Thai name without acceptedTerms", () => {
  const { errors } = validateRegister({
    fullName: "สมชาย ใจดี",
    email: "admin@company.co.th",
    phone: "0812345678",
    password: "123456",
  });

  assert.equal(errors.length, 0);
});

test("user register accepts a valid payload", () => {
  const { errors, value } = validateUserRegister(validUserRegister);

  assert.equal(errors.length, 0);
  assert.equal(value.email, "user@example.com");
  assert.equal(value.acceptedTerms, true);
});

test("user register accepts English names with apostrophe or hyphen", () => {
  assert.equal(
    validateUserRegister({ ...validUserRegister, fullName: "O'Brien" }).errors.length,
    0,
  );
  assert.equal(
    validateUserRegister({ ...validUserRegister, fullName: "Mary-Jane" }).errors.length,
    0,
  );
});

test("user register rejects a name that is not English letters", () => {
  const thaiName = validateUserRegister({ ...validUserRegister, fullName: "สมชาย ใจดี" });
  const withNumber = validateUserRegister({ ...validUserRegister, fullName: "John2 Doe" });

  assert.equal(thaiName.errors[0].field, "fullName");
  assert.equal(withNumber.errors[0].field, "fullName");
});

test("user register requires a valid phone number", () => {
  const missing = validateUserRegister({ ...validUserRegister, phone: "" });
  const invalid = validateUserRegister({ ...validUserRegister, phone: "123" });

  assert.equal(missing.errors[0].field, "phone");
  assert.equal(invalid.errors[0].field, "phone");
});

test("user auth requires email to include @ and .com", () => {
  const withoutCom = validateUserRegister({
    ...validUserRegister,
    email: "user@example.co.th",
  });
  const withoutAt = validateUserLogin({
    email: "userexample.com",
    password: "password12345",
  });

  assert.ok(withoutCom.errors.some((error) => error.field === "email"));
  assert.ok(withoutAt.errors.some((error) => error.field === "email"));
});

test("user auth requires password to be at least 12 characters", () => {
  const registerResult = validateUserRegister({
    ...validUserRegister,
    password: "12345678901",
  });
  const loginResult = validateUserLogin({
    email: "user@example.com",
    password: "short",
  });

  assert.equal(registerResult.errors[0].field, "password");
  assert.ok(loginResult.errors.some((error) => error.field === "password"));
});

test("user register requires accepted terms", () => {
  const missing = validateUserRegister({ ...validUserRegister, acceptedTerms: false });

  assert.equal(missing.errors[0].field, "acceptedTerms");
});
