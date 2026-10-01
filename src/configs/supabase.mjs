import { createClient } from "@supabase/supabase-js";
import { env } from "./env.mjs";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

export function createRequestAuthClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
