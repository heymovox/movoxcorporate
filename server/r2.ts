import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_S3_API_URL,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function r2Upload(key: string, body: Buffer, contentType: string): Promise<void> {
  await getR2Client().send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function r2GetSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }), { expiresIn });
}

export async function r2Delete(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export function r2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
