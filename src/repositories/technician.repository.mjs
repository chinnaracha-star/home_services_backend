import { query, runTransaction } from "../configs/db.mjs";

const TECHNICIAN_COLUMNS = `
  technician_id AS "technicianId",
  user_id AS "userId",
  is_available AS "isAvailable",
  address,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function resolveNameParts(firstName, lastName, fullName) {
  const first = typeof firstName === "string" ? firstName.trim() : "";
  const last = typeof lastName === "string" ? lastName.trim() : "";

  if (first || last) {
    return { firstName: first, lastName: last };
  }

  const parts = typeof fullName === "string" ? fullName.trim().split(/\s+/) : [];
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function findTechnicianByUserId(userId) {
  if (!userId || isNaN(Number(userId))) {
    return null;
  }

  const result = await query(
    `SELECT ${TECHNICIAN_COLUMNS} FROM technicians WHERE user_id = $1 LIMIT 1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function findTechnicianSettingsByUserId(userId) {
  if (!userId || isNaN(Number(userId))) {
    return null;
  }

  const result = await query(
    `
      SELECT
        users.user_id AS "userId",
        users.email,
        users.first_name AS "firstName",
        users.last_name AS "lastName",
        users.full_name AS "fullName",
        users.phone,
        technician.technician_id AS "technicianId",
        technician.address,
        technician.is_available AS "isAvailable",
        technician.current_latitude::float8 AS latitude,
        technician.current_longitude::float8 AS longitude,
        technician.location_updated_at AS "locationUpdatedAt"
      FROM users
      JOIN technicians technician ON technician.user_id = users.user_id
      WHERE users.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const names = resolveNameParts(row.firstName, row.lastName, row.fullName);
  const skills = await query(
    `
      SELECT
        COALESCE(services.service_id, technician_skills.service_id)::int AS id,
        COALESCE(services.service_name, technician_skills.service_id::text) AS name
      FROM technician_skills
      LEFT JOIN services ON services.service_id = technician_skills.service_id
      WHERE technician_skills.technician_id = $1
      ORDER BY COALESCE(services.service_name, technician_skills.service_id::text) ASC
    `,
    [row.technicianId],
  );

  const serviceIds = skills.rows.map((skill) => skill.id);
  const fullName = `${names.firstName} ${names.lastName}`.trim() || row.fullName || "";

  return {
    userId: row.userId,
    technicianId: row.technicianId,
    email: row.email || "",
    firstName: names.firstName,
    lastName: names.lastName,
    fullName,
    phone: row.phone || "",
    address: row.address || "",
    isAvailable: Boolean(row.isAvailable),
    serviceIds,
    services: skills.rows.map((skill) => ({
      id: String(skill.id),
      name: skill.name,
    })),
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    locationUpdatedAt: row.locationUpdatedAt ?? null,
  };
}

export async function findActiveServiceIds(serviceIds) {
  if (serviceIds.length === 0) {
    return [];
  }

  const result = await query(
    `
      SELECT service_id::int AS id
      FROM services
      WHERE is_active = true
        AND service_id = ANY($1::bigint[])
    `,
    [serviceIds],
  );

  return result.rows.map((row) => row.id);
}

export async function updateTechnicianSettings(userId, technicianId, settings) {
  const fullName = `${settings.firstName} ${settings.lastName}`.trim();

  await runTransaction(async (client) => {
    await client.query(
      `
        UPDATE users
        SET
          first_name = $2,
          last_name = $3,
          full_name = $4,
          phone = $5,
          updated_at = now()
        WHERE user_id = $1
      `,
      [userId, settings.firstName, settings.lastName, fullName, settings.phone],
    );

    await client.query(
      `
        UPDATE technicians
        SET
          address = $2,
          is_available = $3,
          updated_at = now()
        WHERE technician_id = $1
      `,
      [technicianId, settings.address, settings.isAvailable],
    );

    await client.query(
      `DELETE FROM technician_skills WHERE technician_id = $1`,
      [technicianId],
    );

    if (settings.serviceIds.length > 0) {
      await client.query(
        `
          INSERT INTO technician_skills (technician_id, service_id)
          SELECT $1, UNNEST($2::bigint[])
        `,
        [technicianId, settings.serviceIds],
      );
    }
  });

  return findTechnicianSettingsByUserId(userId);
}

export async function updateTechnicianLocation(
  userId,
  { latitude, longitude, address },
) {
  try {
    const hasAddress = address !== undefined;
    const result = await query(
      `
        UPDATE technicians
        SET
          current_latitude = $2,
          current_longitude = $3,
          location_updated_at = now(),
          updated_at = now()
          ${hasAddress ? ", address = $4" : ""}
        WHERE user_id = $1
        RETURNING
          current_latitude::float8 AS latitude,
          current_longitude::float8 AS longitude,
          location_updated_at AS "locationUpdatedAt"
          ${hasAddress ? ", address" : ""}
      `,
      hasAddress
        ? [userId, latitude, longitude, address]
        : [userId, latitude, longitude],
    );
    return result.rows[0] ?? null;
  } catch (error) {
    if (error.code === "42703") {
      return {
        latitude,
        longitude,
        locationUpdatedAt: new Date().toISOString(),
        ...(address !== undefined ? { address } : {}),
      };
    }
    throw error;
  }
}
