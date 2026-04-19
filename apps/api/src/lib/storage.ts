/**
 * Single S3 client used for both MinIO (dev) and Scaleway (prod).
 * Swap happens via env: S3_ENDPOINT / S3_FORCE_PATH_STYLE / credentials.
 *
 * Design rules:
 *   - Photo bytes NEVER transit through the API. The API returns a presigned
 *     URL and the mobile uploads directly to S3.
 *   - Keys are namespaced by user: `photos/{userId}/{photoId}.{ext}`.
 *   - Presigned PUT URLs expire in 5 minutes.
 *   - Content-Type is pinned in the signed URL; the upload will fail if the
 *     client sends anything else.
 *   - Max bytes (15 MB) is enforced server-side on /photos/:id/complete via
 *     HEAD + ContentLength check. Oversized uploads are deleted immediately.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { loadEnv } from "../env.js";

const env = loadEnv();

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB
export const UPLOAD_URL_TTL_SECONDS = 60 * 5;
export const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const EXT_BY_CONTENT_TYPE: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

let s3: S3Client | null = null;

export function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }
  return s3;
}

export function photoStorageKey(
  userId: string,
  photoId: string,
  contentType: AllowedContentType,
): string {
  return `photos/${userId}/${photoId}.${EXT_BY_CONTENT_TYPE[contentType]}`;
}

/** Presigned PUT URL for direct upload from the mobile client. */
export async function getPhotoUploadUrl(params: {
  userId: string;
  photoId: string;
  contentType: AllowedContentType;
}): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number }> {
  const storageKey = photoStorageKey(
    params.userId,
    params.photoId,
    params.contentType,
  );
  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(getS3(), cmd, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });
  return { uploadUrl, storageKey, expiresIn: UPLOAD_URL_TTL_SECONDS };
}

/** Presigned GET URL — used later for worker fetch + mobile preview. */
export async function getPhotoDownloadUrl(storageKey: string): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
  });
  return getSignedUrl(getS3(), cmd, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

/** Returns `{ size }` if the object exists, or null if absent. */
export async function statPhoto(
  storageKey: string,
): Promise<{ size: number } | null> {
  try {
    const res = await getS3().send(
      new HeadObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
      }),
    );
    return { size: res.ContentLength ?? 0 };
  } catch (err) {
    if (err instanceof NoSuchKey) return null;
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function deletePhoto(storageKey: string): Promise<void> {
  await getS3().send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
    }),
  );
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "$metadata" in err &&
    typeof err.$metadata === "object" &&
    err.$metadata !== null &&
    "httpStatusCode" in err.$metadata &&
    err.$metadata.httpStatusCode === 404
  );
}
