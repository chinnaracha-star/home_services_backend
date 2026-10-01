import "dotenv/config";

const requiredEnv = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function stripTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: stripTrailingSlash(process.env.SUPABASE_URL),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  port: Number(process.env.PORT) || 3001,
  clientOrigin: stripTrailingSlash(process.env.CLIENT_ORIGIN) || "http://localhost:3000",
  passwordResetRedirectUrl: stripTrailingSlash(process.env.PASSWORD_RESET_REDIRECT_URL),
  passwordResetPath: process.env.PASSWORD_RESET_PATH || "/reset-password",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "",
  openRouterFallbackModels: (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
  openRouterReferer: process.env.OPENROUTER_REFERER || "",
  openRouterTitle: process.env.OPENROUTER_TITLE || "HomeServices Assistant",
  trustProxyHops: Math.max(0, Number(process.env.TRUST_PROXY_HOPS) || 0),
};
