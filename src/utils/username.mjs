export function usernameFromEmail(email) {
  const localPart = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

  return localPart || "user";
}

export function nextAvailableUsername(preferred, takenUsernames) {
  const taken = new Set(takenUsernames);
  const base = (preferred || "user").slice(0, 40);

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}_${suffix}`)) {
    suffix += 1;
  }

  return `${base}_${suffix}`;
}
