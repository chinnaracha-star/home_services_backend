import { createClient } from "@supabase/supabase-js";
import { env } from "./env.mjs";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
