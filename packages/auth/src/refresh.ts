import { createHash, randomBytes } from 'node:crypto';

export const newRefreshToken = (): string => randomBytes(32).toString('base64url');

export const hashRefresh = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
