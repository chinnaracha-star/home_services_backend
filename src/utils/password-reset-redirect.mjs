function stripTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function normalizePath(path) {
  const text = String(path || "").trim();
  if (!text) {
    return "/reset-password";
  }

  return text.startsWith("/") ? text : `/${text}`;
}

export function buildPasswordResetRedirectUrl({
  redirectUrl,
  clientOrigin,
  resetPath,
} = {}) {
  const explicitRedirectUrl = stripTrailingSlash(redirectUrl);
  if (explicitRedirectUrl) {
    return explicitRedirectUrl;
  }

  const origin = stripTrailingSlash(clientOrigin || "http://localhost:3000");
  return `${origin}${normalizePath(resetPath)}`;
}
