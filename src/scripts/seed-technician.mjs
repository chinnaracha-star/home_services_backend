import { query, pool } from "../configs/db.mjs";
import { supabase } from "../configs/supabase.mjs";

const TECHNICIAN_EMAIL = "technician@example.com";
const TECHNICIAN_PASSWORD = "technicianPassword123!";
const TECHNICIAN_FULL_NAME = "สมาน เยี่ยมยอด";
const TECHNICIAN_PHONE = "0890002345";
const TECHNICIAN_ADDRESS = "กรุงเทพมหานคร";

async function createOrUpdateTechnician() {
  console.log(`Starting to create/update technician: ${TECHNICIAN_EMAIL}...`);

  const authCheck = await query(
    `SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER($1)`,
    [TECHNICIAN_EMAIL],
  );

  let authUserId;
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
          jsonb_build_object('full_name', $3::text, 'phone', $4::text, 'role', 'TECHNICIAN'),
          false,
          false,
          now(),
          now()
        )
        RETURNING id
      `,
      [TECHNICIAN_EMAIL, TECHNICIAN_PASSWORD, TECHNICIAN_FULL_NAME, TECHNICIAN_PHONE],
    );
    authUserId = insertAuth.rows[0].id;
    console.log("Created technician in auth.users with ID:", authUserId);
  } else {
    authUserId = authCheck.rows[0].id;
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
          raw_user_meta_data = jsonb_build_object('full_name', $2::text, 'phone', $3::text, 'role', 'TECHNICIAN'),
          updated_at = now()
        WHERE LOWER(email) = LOWER($4)
      `,
      [TECHNICIAN_PASSWORD, TECHNICIAN_FULL_NAME, TECHNICIAN_PHONE, TECHNICIAN_EMAIL],
    );
    console.log("Updated existing technician in auth.users with ID:", authUserId);
  }

  const identityCheck = await query(
    `SELECT id FROM auth.identities WHERE user_id = $1::uuid`,
    [authUserId],
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
      [authUserId, TECHNICIAN_EMAIL],
    );
  } else {
    await query(
      `
        UPDATE auth.identities
        SET
          identity_data = jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
          updated_at = now()
        WHERE user_id = $1::uuid
      `,
      [authUserId, TECHNICIAN_EMAIL],
    );
  }

  const userCheck = await query(
    `SELECT user_id, email, role FROM public.users WHERE LOWER(email) = LOWER($1)`,
    [TECHNICIAN_EMAIL],
  );

  let userId;
  if (userCheck.rows.length === 0) {
    const insertedUser = await query(
      `
        INSERT INTO public.users (username, password, email, full_name, first_name, last_name, phone, role, created_at, updated_at)
        VALUES ('saman', $1, $2, $3, 'สมาน', 'เยี่ยมยอด', $4, 'TECHNICIAN', now(), now())
        RETURNING user_id
      `,
      [TECHNICIAN_PASSWORD, TECHNICIAN_EMAIL, TECHNICIAN_FULL_NAME, TECHNICIAN_PHONE],
    );
    userId = insertedUser.rows[0].user_id;
    console.log("Created technician in public.users successfully!");
  } else {
    const updatedUser = await query(
      `
        UPDATE public.users
        SET
          role = 'TECHNICIAN',
          full_name = $2,
          first_name = 'สมาน',
          last_name = 'เยี่ยมยอด',
          phone = $3,
          updated_at = now()
        WHERE LOWER(email) = LOWER($1)
        RETURNING user_id
      `,
      [TECHNICIAN_EMAIL, TECHNICIAN_FULL_NAME, TECHNICIAN_PHONE],
    );
    userId = updatedUser.rows[0].user_id;
    console.log("Updated technician in public.users successfully!");
  }

  const technicianCheck = await query(
    `SELECT technician_id FROM technicians WHERE user_id = $1`,
    [userId],
  );

  if (technicianCheck.rows.length === 0) {
    await query(
      `
        INSERT INTO technicians (user_id, is_available, address, created_at, updated_at)
        VALUES ($1, true, $2, now(), now())
      `,
      [userId, TECHNICIAN_ADDRESS],
    );
    console.log("Created technician profile successfully!");
  } else {
    await query(
      `
        UPDATE technicians
        SET
          is_available = true,
          address = $2,
          updated_at = now()
        WHERE user_id = $1
      `,
      [userId, TECHNICIAN_ADDRESS],
    );
    console.log("Updated technician profile successfully!");
  }

  const { data: testLogin, error: loginErr } =
    await supabase.auth.signInWithPassword({
      email: TECHNICIAN_EMAIL,
      password: TECHNICIAN_PASSWORD,
    });

  if (loginErr || !testLogin?.session) {
    console.error("Login verification error:", loginErr);
  } else {
    console.log("✅ Technician Sign In verified successfully with Supabase Auth!");
  }

  console.log("\n==========================================");
  console.log("🔧 TECHNICIAN TEST ACCOUNT READY:");
  console.log("Email:     ", TECHNICIAN_EMAIL);
  console.log("Password:  ", TECHNICIAN_PASSWORD);
  console.log("Full Name: ", TECHNICIAN_FULL_NAME);
  console.log("Phone:     ", TECHNICIAN_PHONE);
  console.log("Role:       TECHNICIAN");
  console.log("==========================================\n");

  await pool.end();
}

createOrUpdateTechnician().catch((err) => {
  console.error("Failed to seed technician:", err);
  process.exit(1);
});
