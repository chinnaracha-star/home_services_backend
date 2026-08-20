import { query } from "../configs/db.mjs";

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

export async function createUser({
  username = null,
  password = "",
  email,
  fullName,
  phone = null,
  role = "USER",
}) {
  const uname = username || email.split("@")[0];
  const result = await query(
    `
      INSERT INTO users (username, password, email, full_name, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, now(), now())
      RETURNING ${PROFILE_COLUMNS}
    `,
    [uname, password, email, fullName, phone, role],
  );

  return result.rows[0] ?? null;
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
