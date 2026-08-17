import { query, pool } from "../configs/db.mjs";
import { supabase } from "../configs/supabase.mjs";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "adminPassword123!";

async function resetAndVerifyAdmin() {
  console.log("1. Updating password in auth.users and public.users...");

  // Update password in Supabase auth.users using pgcrypto crypt
  await query(
    `
      UPDATE auth.users 
      SET 
        encrypted_password = crypt($1, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}',
        raw_user_meta_data = '{"full_name":"Admin Master","role":"ADMIN"}'
      WHERE LOWER(email) = LOWER($2)
    `,
    [ADMIN_PASSWORD, ADMIN_EMAIL]
  );

  // Sync / Ensure user exists in public.users with role = 'ADMIN'
  const userCheck = await query(
    `SELECT user_id, email, role FROM public.users WHERE LOWER(email) = LOWER($1)`,
    [ADMIN_EMAIL]
  );

  if (userCheck.rows.length === 0) {
    await query(
      `
        INSERT INTO public.users (username, password, email, full_name, role, created_at, updated_at)
        VALUES ('admin', $1, $2, 'Admin Master', 'ADMIN', now(), now())
      `,
      [ADMIN_PASSWORD, ADMIN_EMAIL]
    );
  } else {
    await query(
      `
        UPDATE public.users
        SET 
          role = 'ADMIN',
          full_name = 'Admin Master',
          updated_at = now()
        WHERE LOWER(email) = LOWER($1)
      `,
      [ADMIN_EMAIL]
    );
  }

  // Fix PostgreSQL sequence for users.user_id if needed
  await query(
    `SELECT setval(pg_get_serial_sequence('public.users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM public.users), 1), true)`
  );

  console.log("2. Testing Supabase signInWithPassword...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error || !data?.session) {
    console.error("Login verification failed:", error);
  } else {
    console.log("✅ Supabase Sign In verified successfully!");
    console.log("Access Token acquired:", data.session.access_token.slice(0, 20) + "...");
  }

  console.log("\n==========================================");
  console.log("👑 ADMIN TEST ACCOUNT READY:");
  console.log("Email:    ", ADMIN_EMAIL);
  console.log("Password: ", ADMIN_PASSWORD);
  console.log("Role:      ADMIN");
  console.log("==========================================\n");

  await pool.end();
}

resetAndVerifyAdmin().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
