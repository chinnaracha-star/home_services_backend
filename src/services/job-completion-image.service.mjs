import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../configs/env.mjs";
import { HttpError } from "../utils/http-error.mjs";

export const JOB_COMPLETION_BUCKET = "job-completion-images";
export const COMPLETION_IMAGE_URL_TTL_SECONDS = 60 * 60;

const extensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function createStorageClient(accessToken) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function removeCompletionImages({ accessToken, objectPaths }) {
  if (!accessToken || objectPaths.length === 0) return;
  const client = createStorageClient(accessToken);
  await client.storage.from(JOB_COMPLETION_BUCKET).remove(objectPaths);
}

export async function uploadCompletionImages({
  authUserId,
  accessToken,
  assignmentId,
  files,
}) {
  if (!authUserId || !accessToken) {
    throw new HttpError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบใหม่");
  }

  const client = createStorageClient(accessToken);
  const objectPaths = [];

  try {
    for (const file of files) {
      const extension = extensions[file.mimetype];
      const objectPath =
        `${authUserId}/${assignmentId}/${randomUUID()}.${extension}`;
      const { error } = await client.storage
        .from(JOB_COMPLETION_BUCKET)
        .upload(objectPath, file.buffer, {
          cacheControl: "3600",
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }
      objectPaths.push(objectPath);
    }
  } catch (error) {
    if (objectPaths.length > 0) {
      await client.storage.from(JOB_COMPLETION_BUCKET).remove(objectPaths);
    }
    throw new HttpError(
      502,
      "COMPLETION_IMAGE_UPLOAD_FAILED",
      `ไม่สามารถอัปโหลดรูปหลักฐานได้: ${error.message}`,
    );
  }

  return objectPaths;
}

export async function createCompletionImageSignedUrls({
  accessToken,
  objectPaths,
}) {
  if (objectPaths.length === 0) return [];
  if (!accessToken) {
    throw new HttpError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบใหม่");
  }

  const client = createStorageClient(accessToken);
  const { data, error } = await client.storage
    .from(JOB_COMPLETION_BUCKET)
    .createSignedUrls(objectPaths, COMPLETION_IMAGE_URL_TTL_SECONDS);

  if (error) {
    throw new HttpError(
      502,
      "COMPLETION_IMAGE_URL_FAILED",
      `ไม่สามารถเปิดรูปหลักฐานได้: ${error.message}`,
    );
  }

  return (data ?? []).map((item, index) => ({
    objectPath: objectPaths[index],
    signedUrl: item.signedUrl,
    expiresIn: COMPLETION_IMAGE_URL_TTL_SECONDS,
  }));
}
