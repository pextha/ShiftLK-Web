import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { Readable } from 'stream';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Returns the public CDN URL for an R2 object key.
 * If R2_PUBLIC_DOMAIN is configured (e.g. https://media.shiftlk.lk or https://pub-xxx.r2.dev),
 * returns the full CDN URL. Otherwise falls back to the backend media streaming proxy.
 */
export function formatR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  if (env.R2_PUBLIC_DOMAIN && env.R2_PUBLIC_DOMAIN.trim() !== '') {
    const base = env.R2_PUBLIC_DOMAIN.trim().replace(/\/+$/, '');
    return `${base}/${cleanKey}`;
  }
  return `http://localhost:${env.PORT || 4000}/api/v1/media/${cleanKey}`;
}

/**
 * Upload a file buffer directly to Cloudflare R2
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; publicUrl: string }> {
  const cleanKey = key.replace(/^\/+/, '');

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return {
    key: cleanKey,
    publicUrl: formatR2PublicUrl(cleanKey),
  };
}

/**
 * Generate a presigned PUT URL for client-side direct uploads to Cloudflare R2
 */
export async function createR2PresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 300
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: cleanKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    uploadUrl,
    publicUrl: formatR2PublicUrl(cleanKey),
    key: cleanKey,
  };
}

/**
 * Fetch an object stream from Cloudflare R2
 */
export async function getR2ObjectStream(key: string): Promise<{
  stream: Readable;
  contentType: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
} | null> {
  const cleanKey = key.replace(/^\/+/, '');

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: cleanKey,
      })
    );

    if (!response.Body) {
      return null;
    }

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
    };
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const cleanKey = key.replace(/^\/+/, '');

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: cleanKey,
    })
  );
}
