import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/utils/http-error.mjs";

const signUp = vi.fn();
const signInWithPassword = vi.fn();
const findUserByEmail = vi.fn();
const createUser = vi.fn();
const updateUserProfile = vi.fn();

vi.mock("../src/configs/supabase.mjs", () => ({
  supabase: {
    auth: {
      signUp: (...args) => signUp(...args),
      signInWithPassword: (...args) => signInWithPassword(...args),
    },
  },
}));

vi.mock("../src/repositories/user.repository.mjs", () => ({
  findUserByEmail: (...args) => findUserByEmail(...args),
  createUser: (...args) => createUser(...args),
  updateUserProfile: (...args) => updateUserProfile(...args),
}));

const { ensurePublicUser, registerCustomer } = await import(
  "../src/services/register-user.service.mjs"
);

const registration = {
  email: "new.user@example.com",
  password: "password12345",
  fullName: "New User",
  displayName: "New User",
  firstName: "New",
  lastName: "User",
  phone: "0812345678",
};

describe("registerCustomer", () => {
  beforeEach(() => {
    signUp.mockReset();
    signInWithPassword.mockReset();
    findUserByEmail.mockReset();
    createUser.mockReset();
    updateUserProfile.mockReset();
  });

  it("returns the new user and Supabase session", async () => {
    const createdUser = { id: 1, email: registration.email, role: "USER" };
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(createdUser);
    signUp.mockResolvedValue({
      data: {
        user: { email: registration.email },
        session: { access_token: "session-token" },
      },
      error: null,
    });

    const result = await registerCustomer(registration);

    expect(result).toEqual({
      user: createdUser,
      session: { access_token: "session-token" },
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs in when signup does not return a session", async () => {
    const createdUser = { id: 2, email: registration.email, role: "USER" };
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue(createdUser);
    signUp.mockResolvedValue({
      data: { user: { email: registration.email }, session: null },
      error: null,
    });
    signInWithPassword.mockResolvedValue({
      data: { session: { access_token: "login-token" } },
      error: null,
    });

    const result = await registerCustomer(registration);

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: registration.email,
      password: registration.password,
    });
    expect(result.session).toEqual({ access_token: "login-token" });
  });

  it("rejects an existing email when the password does not match", async () => {
    findUserByEmail.mockResolvedValue({
      id: 3,
      email: registration.email,
      role: "USER",
    });
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(registerCustomer(registration)).rejects.toMatchObject({
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("rejects a failed Supabase signup", async () => {
    findUserByEmail.mockResolvedValue(null);
    signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "signup failed" },
    });

    await expect(registerCustomer(registration)).rejects.toMatchObject({
      status: 400,
      code: "AUTH_REGISTRATION_FAILED",
      message: "signup failed",
    });
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe("ensurePublicUser", () => {
  beforeEach(() => {
    findUserByEmail.mockReset();
    createUser.mockReset();
    updateUserProfile.mockReset();
  });

  it("returns the user created by a parallel request after a unique conflict", async () => {
    const parallelUser = { id: 4, email: registration.email, role: "USER" };
    findUserByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(parallelUser);
    createUser.mockRejectedValue(
      new HttpError(409, "EMAIL_ALREADY_EXISTS", "อีเมลนี้ถูกใช้งานแล้ว"),
    );

    const result = await ensurePublicUser(registration);

    expect(result).toEqual(parallelUser);
  });
});
