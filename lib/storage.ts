import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key; // store the key in DB; generate signed URLs on demand
}

export async function getSignedFileUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 60 * 60 }); // 1 hour
}

export function generateKey(prefix: string, ext: string): string {
  return `${prefix}/${randomUUID()}.${ext}`;
}

/*
 * DEV ALTERNATIVE (no S3 account needed while building locally):
 * Replace the body of uploadFile with fs.writeFile into /public/uploads/<key>
 * and have getSignedFileUrl just return `/uploads/<key>`. Swap back to S3
 * before deploying since Next.js serverless hosts have ephemeral disks.
 */
