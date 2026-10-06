import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStoragePort } from './index.js';

export const createS3Storage = (opts: {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
}): IStoragePort => {
  const client = new S3Client({
    endpoint: opts.endpoint,
    region: opts.region,
    credentials: { accessKeyId: opts.accessKey, secretAccessKey: opts.secretKey },
    forcePathStyle: true,
  });
  return {
    async presignPut(input) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: opts.bucket,
          Key: input.key,
          ContentType: input.mime,
          ContentLength: input.byteSize,
        }),
        { expiresIn: 600 },
      );
      return { url, headers: { 'content-type': input.mime } };
    },
    async presignGet(key) {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: opts.bucket, Key: key }),
        { expiresIn: 600 },
      );
      return { url, headers: {} };
    },
  };
};
