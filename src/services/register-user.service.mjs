import { supabase } from "../configs/supabase.mjs";
import {
  createUser,
  findUserByEmail,
  updateUserProfile,
} from "../repositories/user.repository.mjs";
import { HttpError } from "../utils/http-error.mjs";

function emailAlreadyExistsError() {
  return new HttpError(
    409,
    "EMAIL_ALREADY_EXISTS",
    "อีเมลนี้ถูกใช้งานแล้ว",
    [{ field: "email", message: "อีเมลนี้ถูกใช้งานแล้ว" }],
  );
}

export async function ensurePublicUser({
  email,
  fullName,
  displayName,
  firstName,
  lastName,
  phone,
  role = "USER",
}) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    if (
      (firstName || lastName || displayName) &&
      (!existingUser.firstName || !existingUser.lastName || !existingUser.displayName)
    ) {
      const updated = await updateUserProfile(existingUser.id, {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        displayName: displayName || existingUser.displayName || fullName,
        fullName: fullName || displayName || existingUser.fullName,
        phone: phone || existingUser.phone,
        avatarUrl: existingUser.avatarUrl,
      });
      if (updated) return updated;
    }
    return existingUser;
  }

  try {
    return await createUser({
      username: email.split("@")[0],
      email,
      fullName,
      displayName,
      firstName,
      lastName,
      phone,
      role,
    });
  } catch (error) {
    if (error instanceof HttpError && error.code === "EMAIL_ALREADY_EXISTS") {
      const createdInParallel = await findUserByEmail(email);
      if (createdInParallel) {
        return createdInParallel;
      }
    }

    throw error;
  }
}

export async function registerCustomer({
  email,
  password,
  fullName,
  displayName,
  firstName,
  lastName,
  phone,
}) {
  const resolvedFullName =
    displayName ||
    fullName ||
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : email.split("@")[0]);

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user || !data?.session) {
      throw emailAlreadyExistsError();
    }

    return {
      user: existingUser,
      session: data.session,
    };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: resolvedFullName,
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName || resolvedFullName,
        phone,
      },
    },
  });

  if (authError || !authData?.user) {
    throw new HttpError(
      400,
      "AUTH_REGISTRATION_FAILED",
      authError?.message || "ไม่สามารถลงทะเบียนผู้ใช้ได้",
    );
  }

  const user = await ensurePublicUser({
    email: authData.user.email,
    fullName: resolvedFullName,
    displayName: displayName || resolvedFullName,
    firstName,
    lastName,
    phone,
    role: "USER",
  });

  if (authData.session) {
    return {
      user,
      session: authData.session,
    };
  }

  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError || !loginData?.session) {
    return {
      user,
      session: null,
    };
  }

  return {
    user,
    session: loginData.session,
  };
}
