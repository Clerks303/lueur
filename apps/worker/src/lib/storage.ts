/**
 * Worker-side S3 client: streams the photo bytes straight into memory (with
 * a hard size cap) and hands a base64 payload to the caller. The API side
 * has its own client that does presigning; the two never share a client.
 */
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { loadEnv } from "../env.js";

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

let s3: S3Client | null = null;

export function getS3(): S3Client {
  if (!s3) {
    const env = loadEnv();
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

export interface FetchedPhoto {
  base64: string;
  mediaType: string;
  bytes: number;
}

export async function fetchPhotoBytes(params: {
  storageKey: string;
  bucket?: string;
}): Promise<FetchedPhoto> {
  const env = loadEnv();
  const res = await getS3().send(
    new GetObjectCommand({
      Bucket: params.bucket ?? env.S3_BUCKET,
      Key: params.storageKey,
    }),
  );
  if (!res.Body) {
    throw new Error(`empty body for ${params.storageKey}`);
  }
  const mediaType = res.ContentType ?? inferMediaType(params.storageKey);

  const chunks: Uint8Array[] = [];
  let total = 0;
  // AWS SDK returns a Node Readable / Web ReadableStream. We iterate the
  // raw chunks to enforce MAX_PHOTO_BYTES without ever buffering more than
  // the cap. `transformToByteArray` would buffer everything without limit.
  const body = res.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of body) {
    total += chunk.byteLength;
    if (total > MAX_PHOTO_BYTES) {
      throw new Error(
        `photo ${params.storageKey} exceeds max (${MAX_PHOTO_BYTES} bytes)`,
      );
    }
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return {
    base64: buffer.toString("base64"),
    mediaType,
    bytes: total,
  };
}

function inferMediaType(storageKey: string): string {
  if (storageKey.endsWith(".jpg") || storageKey.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (storageKey.endsWith(".png")) return "image/png";
  if (storageKey.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}
