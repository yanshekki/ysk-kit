import type { Permission, Platform, UserRole } from '@ysk/contracts';
import { type JWTPayload, jwtVerify, SignJWT } from 'jose';

export type AccessClaims = {
  sub: string;
  role: UserRole;
  platform: Platform;
  sid: string;
  permissions?: Permission[];
};

const encoder = new TextEncoder();

export const parseTtlSeconds = (ttl: string): number => {
  const match = ttl.trim().match(/^(\d+)([smh])$/);
  if (!match) return 900;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  return value * 3600;
};

export const signAccessToken = async (
  claims: AccessClaims,
  secret: string,
  ttlSeconds: number,
): Promise<string> =>
  new SignJWT({ role: claims.role, platform: claims.platform, sid: claims.sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(encoder.encode(secret));

export const verifyAccessToken = async (token: string, secret: string): Promise<AccessClaims> => {
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  return toClaims(payload);
};

const toClaims = (payload: JWTPayload): AccessClaims => {
  const sub = payload.sub;
  const role = payload.role;
  const platform = payload.platform;
  const sid = payload.sid;
  if (
    typeof sub !== 'string' ||
    typeof role !== 'string' ||
    typeof platform !== 'string' ||
    typeof sid !== 'string'
  ) {
    throw new Error('invalid claims');
  }
  return {
    sub,
    role: role as AccessClaims['role'],
    platform: platform as AccessClaims['platform'],
    sid,
  };
};
