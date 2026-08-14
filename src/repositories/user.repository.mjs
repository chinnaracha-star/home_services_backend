import { query } from "../configs/db.mjs";

const PROFILE_COLUMNS = `
  id,
  email,
  full_name AS "fullName",
  phone,
  address,
  avatar_url AS "avatarUrl",
  role
`;

export async function findUserById(userId) {
  const result = await query(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [userId],
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
        address = $4,
        avatar_url = $5,
        updated_at = now()
      WHERE id = $1
      RETURNING ${PROFILE_COLUMNS}
    `,
    [
      userId,
      profile.fullName,
      profile.phone,
      profile.address,
      profile.avatarUrl,
    ],
  );

  return result.rows[0] ?? null;
}
