import { query } from "../configs/db.mjs";
import { HttpError } from "../utils/http-error.mjs";
import { nextAvailableUsername, usernameFromEmail } from "../utils/username.mjs";

const PROFILE_COLUMNS = `
  user_id AS id,
  email,
  COALESCE(full_name, CONCAT(first_name, ' ', last_name), username) AS "fullName",
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

async function insertUser({ username, password, email, fullName, phone, role }) {
  const result = await query(
    `
      INSERT INTO users (username, password, email, full_name, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      RETURNING ${PROFILE_COLUMNS}
    `,
    [username, password, email, fullName, phone, role],
  );

  return result.rows[0] ?? null;
}

export async function createUser({
  username = null,
  password = "",
  email,
  fullName,
  phone = null,
  role = "USER",
}) {
  const preferred = usernameFromEmail(username || email);
  let uname = await allocateUniqueUsername(preferred);

  try {
    return await insertUser({
      username: uname,
      password,
      email,
      fullName,
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
        fullName,
        phone,
        role,
      });
    }

    throw error;
  }
}

export async function updateUserProfile(userId, profile) {
  const result = await query(
    `
      UPDATE users
      SET
        full_name = $2,
        phone = $3,
        avatar_url = $4,
        email = COALESCE($5, email),
        updated_at = now()
      WHERE user_id = $1
      RETURNING ${PROFILE_COLUMNS}
    `,
    [
      userId,
      profile.fullName,
      profile.phone,
      profile.avatarUrl,
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
