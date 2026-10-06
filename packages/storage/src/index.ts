export type PresignPutInput = { key: string; mime: string; byteSize: number };
export type PresignResult = { url: string; headers: Record<string, string> };

export interface IStoragePort {
  presignPut(input: PresignPutInput): Promise<PresignResult>;
  presignGet(key: string): Promise<PresignResult>;
  putLocal?(key: string, body: Buffer, mime: string): Promise<void>;
  getLocal?(key: string): Promise<{ body: Buffer; mime: string } | null>;
}

import { createS3Storage } from './s3.js';

export { createS3Storage };

export type StorageEnv = {
  API_PUBLIC_URL: string;
  S3_ENDPOINT?: string | undefined;
  S3_BUCKET?: string | undefined;
  S3_ACCESS_KEY?: string | undefined;
  S3_SECRET_KEY?: string | undefined;
  S3_REGION?: string | undefined;
};

export const createStorageFromEnv = (env: StorageEnv): IStoragePort => {
  if (env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
    return createS3Storage({
      endpoint: env.S3_ENDPOINT,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      region: env.S3_REGION && env.S3_REGION.length > 0 ? env.S3_REGION : 'auto',
    });
  }
  return createLocalStorage({ publicBaseUrl: env.API_PUBLIC_URL });
};

export const createLocalStorage = (opts: { publicBaseUrl: string }): IStoragePort => {
  const blobs = new Map<string, { body: Buffer; mime: string }>();
  return {
    async presignPut(input) {
      return {
        url: `${opts.publicBaseUrl}/v1/files/local/${encodeURIComponent(input.key)}`,
        headers: { 'content-type': input.mime },
      };
    },
    async presignGet(key) {
      return {
        url: `${opts.publicBaseUrl}/v1/files/local/${encodeURIComponent(key)}`,
        headers: {},
      };
    },
    async putLocal(key, body, mime) {
      blobs.set(key, { body, mime });
    },
    async getLocal(key) {
      return blobs.get(key) ?? null;
    },
  };
};
