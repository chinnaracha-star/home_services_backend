import { createClient } from "@supabase/supabase-js";
import { env } from "../configs/env.mjs";
import { HttpError } from "../utils/http-error.mjs";

const AVATAR_BUCKET = "avatars";

export async function uploadAvatar({ authUserId, accessToken, file }) {
  const userClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const objectPath = `${authUserId}/avatar`;
  const { error } = await userClient.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file.buffer, {
      cacheControl: "3600",
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new HttpError(
      502,
      "AVATAR_UPLOAD_FAILED",
      `ไม่สามารถอัปโหลดรูปโปรไฟล์ได้: ${error.message}`,
    );
  }

  const { data } = userClient.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(objectPath);

  return `${data.publicUrl}?v=${Date.now()}`;
}
