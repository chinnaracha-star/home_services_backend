import { supabase } from "../configs/supabase.mjs";
import { createUser, findUserByEmail } from "../repositories/user.repository.mjs";
import { HttpError } from "../utils/http-error.mjs";

function emailAlreadyExistsError() {
  return new HttpError(
    409,
    "EMAIL_ALREADY_EXISTS",
    "อีเมลนี้ถูกใช้งานแล้ว",
    [{ field: "email", message: "อีเมลนี้ถูกใช้งานแล้ว" }],
  );
}

export async function ensurePublicUser({ email, fullName, phone, role = "USER" }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  try {
    return await createUser({
      username: email.split("@")[0],
      email,
      fullName,
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

export async function registerCustomer({ email, password, fullName, phone }) {
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
        full_name: fullName,
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
    fullName,
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
