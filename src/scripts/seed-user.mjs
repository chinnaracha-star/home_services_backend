import { query, pool } from "../configs/db.mjs";
import { supabase } from "../configs/supabase.mjs";

const USER_EMAIL = "user@user.com";
const USER_PASSWORD = "userPassword123!";
const USER_FULL_NAME = "สมชาย ใจดี";
const USER_PHONE = "0812345678";

async function createOrUpdateNormalUser() {
  console.log(`Starting to create/update normal user: ${USER_EMAIL}...`);

  // 1. ตรวจสอบใน auth.users ของ PostgreSQL โดยตรง
  const authCheck = await query(
    `SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1)`,
    [USER_EMAIL]
  );

  let userId;
  if (authCheck.rows.length === 0) {
    const insertAuth = await query(
      `
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          confirmation_token,
          recovery_token,
          email_change_token_new,
          email_change,
          reauthentication_token,
          raw_app_meta_data,
          raw_user_meta_data,
          is_sso_user,
          is_anonymous,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf')),
          now(),
          '',
          '',
          '',
          '',
          '',
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('full_name', $3::text, 'phone', $4::text, 'role', 'USER'),
          false,
          false,
          now(),
          now()
        )
        RETURNING id
      `,
      [USER_EMAIL, USER_PASSWORD, USER_FULL_NAME, USER_PHONE]
    );
    userId = insertAuth.rows[0].id;
    console.log("Created user in auth.users with ID:", userId);
  } else {
    userId = authCheck.rows[0].id;
    await query(
      `
        UPDATE auth.users 
        SET 
          encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          confirmation_token = '',
          recovery_token = '',
          email_change_token_new = '',
          email_change = '',
          reauthentication_token = '',
          raw_app_meta_data = '{"provider":"email","providers":["email"]}',
          raw_user_meta_data = jsonb_build_object('full_name', $2::text, 'phone', $3::text, 'role', 'USER'),
          updated_at = now()
        WHERE LOWER(email) = LOWER($4)
      `,
      [USER_PASSWORD, USER_FULL_NAME, USER_PHONE, USER_EMAIL]
    );
    console.log("Updated existing user in auth.users with ID:", userId);
  }

  // 2. ตรวจสอบ / บันทึกใน auth.identities
  const identityCheck = await query(
    `SELECT id FROM auth.identities WHERE user_id = $1::uuid`,
    [userId]
  );

  if (identityCheck.rows.length === 0) {
    await query(
      `
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
          'email',
          $1::text,
          now(),
          now(),
          now()
        )
      `,
      [userId, USER_EMAIL]
    );
    console.log("Created identity in auth.identities successfully!");
  } else {
    await query(
      `
        UPDATE auth.identities
        SET
          identity_data = jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
          updated_at = now()
        WHERE user_id = $1::uuid
      `,
      [userId, USER_EMAIL]
    );
    console.log("Updated identity in auth.identities successfully!");
  }

  // 3. บันทึก / อัปเดตในตาราง public.users ให้ role = 'USER'
  const userCheck = await query(
    `SELECT user_id, email, role FROM public.users WHERE LOWER(email) = LOWER($1)`,
    [USER_EMAIL]
  );

  if (userCheck.rows.length === 0) {
    await query(
      `
        INSERT INTO public.users (username, password, email, full_name, phone, role, created_at, updated_at)
        VALUES ('somchai', $1, $2, $3, $4, 'USER', now(), now())
      `,
      [USER_PASSWORD, USER_EMAIL, USER_FULL_NAME, USER_PHONE]
    );
    console.log("Created user in public.users successfully!");
  } else {
    await query(
      `
        UPDATE public.users
        SET 
          role = 'USER',
          full_name = $2,
          phone = $3,
          updated_at = now()
        WHERE LOWER(email) = LOWER($1)
      `,
      [USER_EMAIL, USER_FULL_NAME, USER_PHONE]
    );
    console.log("Updated user in public.users successfully!");
  }

  // 4. ทดสอบ Login กับ Supabase และ Backend API
  const { data: testLogin, error: loginErr } =
    await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

  if (loginErr || !testLogin?.session) {
    console.error("Login verification error:", loginErr);
  } else {
    console.log("✅ User Sign In verified successfully with Supabase Auth!");
  }

  console.log("\n==========================================");
  console.log("👤 NORMAL USER TEST ACCOUNT READY:");
  console.log("Email:     ", USER_EMAIL);
  console.log("Password:  ", USER_PASSWORD);
  console.log("Full Name: ", USER_FULL_NAME);
  console.log("Phone:     ", USER_PHONE);
  console.log("Role:       USER");
  console.log("==========================================\n");

  await pool.end();
}

createOrUpdateNormalUser().catch((err) => {
  console.error("Failed to seed normal user:", err);
  process.exit(1);
});
