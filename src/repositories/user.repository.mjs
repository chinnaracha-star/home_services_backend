import { query } from "../configs/db.mjs";
import { HttpError } from "../utils/http-error.mjs";
import { nextAvailableUsername, usernameFromEmail } from "../utils/username.mjs";

const PROFILE_COLUMNS = `
  user_id AS id,
  email,
  COALESCE(full_name, CONCAT(first_name, ' ', last_name), username) AS "fullName",
  COALESCE(full_name, CONCAT(first_name, ' ', last_name), username) AS "displayName",
  first_name AS "firstName",
  last_name AS "lastName",
  phone,
  NULL AS address,
  avatar_url AS "avatarUrl",
  UPPER(role) AS role
`;

export async function findUserById(userId) {
  if (!userId || isNaN(Number(userId))) {
    return null;
  }

  const result = await query(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE user_id = $1 LIMIT 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(email) {
  if (!email) return null;

  const result = await query(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
}

async function allocateUniqueUsername(preferred) {
  const base = (preferred || "user").slice(0, 40);
  const result = await query(
    `
      SELECT username
      FROM users
      WHERE username = $1
         OR starts_with(username, $1 || '_')
    `,
    [base],
  );

  return nextAvailableUsername(base, result.rows.map((row) => row.username));
}

function isUniqueViolation(error, column) {
  if (error?.code !== "23505") {
    return false;
  }

  const constraint = String(error.constraint || "");
  const detail = String(error.detail || "");
  return constraint.includes(column) || detail.includes(`(${column})=`);
}

async function insertUser({
  username,
  password,
  email,
  fullName,
  firstName,
  lastName,
  phone,
  role,
}) {
  const finalFullName =
    fullName ||
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : username);

  const result = await query(
    `
      INSERT INTO users (username, password, email, full_name, first_name, last_name, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
      RETURNING ${PROFILE_COLUMNS}
    `,
    [
      username,
      password,
      email,
      finalFullName,
      firstName || null,
      lastName || null,
      phone,
      role,
    ],
  );

  return result.rows[0] ?? null;
}

export async function createUser({
  username = null,
  password = "",
  email,
  fullName,
  displayName,
  firstName = null,
  lastName = null,
  phone = null,
  role = "USER",
}) {
  const preferred = usernameFromEmail(username || email);
  let uname = await allocateUniqueUsername(preferred);
  const resolvedFullName = displayName || fullName;

  try {
    return await insertUser({
      username: uname,
      password,
      email,
      fullName: resolvedFullName,
      firstName,
      lastName,
      phone,
      role,
    });
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      const existing = await findUserByEmail(email);
      if (existing) {
        return existing;
      }

      throw new HttpError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "อีเมลนี้ถูกใช้งานแล้ว",
        [{ field: "email", message: "อีเมลนี้ถูกใช้งานแล้ว" }],
      );
    }

    if (isUniqueViolation(error, "username")) {
      uname = await allocateUniqueUsername(`${preferred}_${Date.now().toString(36)}`);
      return insertUser({
        username: uname,
        password,
        email,
        fullName: resolvedFullName,
        firstName,
        lastName,
        phone,
        role,
      });
    }

    throw error;
  }
}

export async function updateUserProfile(userId, profile) {
  const hasDisplayName = profile.displayName !== undefined;
  const hasFullName = profile.fullName !== undefined;
  const derivedFullName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : null;
  const resolvedFullName = hasDisplayName
    ? profile.displayName
    : hasFullName
      ? profile.fullName
      : derivedFullName;

  const result = await query(
    `
      UPDATE users
      SET
        full_name = CASE WHEN $2 THEN $3 ELSE full_name END,
        first_name = CASE WHEN $4 THEN $5 ELSE first_name END,
        last_name = CASE WHEN $6 THEN $7 ELSE last_name END,
        phone = CASE WHEN $8 THEN $9 ELSE phone END,
        avatar_url = CASE WHEN $10 THEN $11 ELSE avatar_url END,
        email = CASE WHEN $12 THEN $13 ELSE email END,
        updated_at = now()
      WHERE user_id = $1
      RETURNING ${PROFILE_COLUMNS}
    `,
    [
      userId,
      hasDisplayName || hasFullName || Boolean(derivedFullName),
      resolvedFullName || null,
      profile.firstName !== undefined,
      profile.firstName ?? null,
      profile.lastName !== undefined,
      profile.lastName ?? null,
      profile.phone !== undefined,
      profile.phone ?? null,
      profile.avatarUrl !== undefined,
      profile.avatarUrl ?? null,
      Boolean(profile.email),
      profile.email || null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function updateUserAvatar(userId, avatarUrl) {
  const result = await query(
    `
      UPDATE users
      SET avatar_url = $2, updated_at = now()
      WHERE user_id = $1
      RETURNING ${PROFILE_COLUMNS}
    `,
    [userId, avatarUrl],
  );

  return result.rows[0] ?? null;
}
