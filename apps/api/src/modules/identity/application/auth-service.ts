import {
  type AccessClaims,
  hashOtp,
  hashPassword,
  hashRefresh,
  newOtpCode,
  newRefreshToken,
  parseTtlSeconds,
  signAccessToken,
  verifyPassword,
} from '@ysk-kit/auth';
import type {
  ForgotPasswordCommand,
  LoginPasswordCommand,
  Platform,
  RefreshCommand,
  RegisterCommand,
  RequestAdminOtpCommand,
  RequestOtpCommand,
  ResetPasswordCommand,
  TokenPairDto,
  UserDto,
  VerifyAdminOtpCommand,
  VerifyOtpCommand,
} from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IJobQueue } from '@ysk-kit/jobs';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';
import type { IOtpRepository } from '../domain/otp-repository';
import type { IOtpSender } from '../domain/otp-sender';
import type { IPasswordResetRepository } from '../domain/password-reset-repository';
import type { ISessionRepository } from '../domain/session-repository';
import type { UserRecord } from '../domain/user';
import type { IUserRepository } from '../domain/user-repository';
import { toUserDto } from '../infra/user-mapper';

const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const OTP_MAX_ATTEMPTS = 5;

export type AuthServiceDeps = {
  users: IUserRepository;
  sessions: ISessionRepository;
  otps: IOtpRepository;
  audit: IAuditLogger;
  otpSender: IOtpSender;
  resets: IPasswordResetRepository;
  jobs: IJobQueue;
  webPublicUrl: string;
  jwtSecret: string;
  accessTtl: string;
  otpTtlSeconds: number;
  now?: () => Date;
};

export const createAuthService = (deps: AuthServiceDeps) => {
  const now = () => deps.now?.() ?? new Date();
  const accessTtlSeconds = parseTtlSeconds(deps.accessTtl);

  const issue = async (
    user: UserRecord,
    platform: Platform,
    requestId?: string,
  ): Promise<TokenPairDto> => {
    const refreshToken = newRefreshToken();
    const session = await deps.sessions.create({
      userId: user.id,
      refreshHash: hashRefresh(refreshToken),
      platform,
      expiresAt: new Date(now().getTime() + REFRESH_TTL_MS),
    });
    const accessToken = await signAccessToken(
      { sub: user.id, role: user.role, platform, sid: session.id },
      deps.jwtSecret,
      accessTtlSeconds,
    );
    await deps.audit.record({
      actorId: user.id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      requestId,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtlSeconds,
      user: toUserDto(user),
    };
  };

  const assertActive = (user: UserRecord) => {
    if (user.status !== 'ACTIVE') {
      throw new AppError('FORBIDDEN', 'Account is not active');
    }
  };

  return {
    register: async (body: RegisterCommand, platform: Platform, requestId?: string) => {
      const existing = await deps.users.findByEmail(body.email);
      if (existing) throw new AppError('CONFLICT', 'Account already exists');
      const user = await deps.users.create({
        email: body.email,
        displayName: body.displayName,
        role: 'USER',
        passwordHash: await hashPassword(body.password),
      });
      await deps.audit.record({
        actorId: user.id,
        action: 'auth.register',
        resourceType: 'user',
        resourceId: user.id,
        requestId,
      });
      if (user.email) {
        await deps.jobs.enqueue('email.send', {
          to: user.email,
          template: 'auth.welcome',
          locale: 'zh-HK',
          vars: { displayName: user.displayName },
        });
      }
      await deps.jobs.enqueue('notification.create', {
        userId: user.id,
        type: 'auth.welcome',
        title: '歡迎',
        body: '你嘅帳號已建立。',
      });
      return issue(user, platform, requestId);
    },

    login: async (body: LoginPasswordCommand, platform: Platform, requestId?: string) => {
      const user = await deps.users.findByEmail(body.email);
      if (!user?.passwordHash) throw new AppError('UNAUTHENTICATED', 'Invalid credentials');
      const ok = await verifyPassword(user.passwordHash, body.password);
      if (!ok) throw new AppError('UNAUTHENTICATED', 'Invalid credentials');
      assertActive(user);
      return issue(user, platform, requestId);
    },

    requestOtp: async (body: RequestOtpCommand) => {
      const since = new Date(now().getTime() - 60_000);
      const recent = await deps.otps.countSince(body.phone, since);
      if (recent >= 1) throw new AppError('RATE_LIMITED', 'Wait before requesting another code');
      const code = newOtpCode();
      await deps.otps.create({
        phone: body.phone,
        codeHash: hashOtp(code),
        expiresAt: new Date(now().getTime() + deps.otpTtlSeconds * 1000),
      });
      await deps.otpSender.send(body.phone, code);
      return { sent: true as const };
    },

    verifyOtp: async (body: VerifyOtpCommand, platform: Platform, requestId?: string) => {
      const challenge = await deps.otps.findLatestOpen(body.phone);
      if (!challenge || challenge.expiresAt < now()) {
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired code');
      }
      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        throw new AppError('RATE_LIMITED', 'Too many attempts');
      }
      if (challenge.codeHash !== hashOtp(body.code)) {
        await deps.otps.incrementAttempts(challenge.id);
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired code');
      }
      await deps.otps.consume(challenge.id, now());
      let user = await deps.users.findByPhone(body.phone);
      if (!user) {
        user = await deps.users.create({
          phone: body.phone,
          displayName: body.phone,
          role: 'USER',
        });
      } else {
        assertActive(user);
      }
      return issue(user, platform, requestId);
    },

    requestAdminOtp: async (body: RequestAdminOtpCommand) => {
      const email = body.email.trim().toLowerCase();
      const since = new Date(now().getTime() - 60_000);
      const recent = await deps.otps.countSince(email, since);
      if (recent >= 1) throw new AppError('RATE_LIMITED', 'Wait before requesting another code');
      const user = await deps.users.findByEmail(email);
      if (user?.status === 'ACTIVE' && user.role === 'ADMIN') {
        const code = newOtpCode();
        await deps.otps.create({
          phone: email,
          codeHash: hashOtp(code),
          expiresAt: new Date(now().getTime() + deps.otpTtlSeconds * 1000),
        });
        await deps.jobs.enqueue('email.send', {
          to: email,
          template: 'auth.admin-otp',
          locale: 'zh-HK',
          vars: { code },
        });
      }
      return { sent: true as const };
    },

    verifyAdminOtp: async (body: VerifyAdminOtpCommand, platform: Platform, requestId?: string) => {
      const email = body.email.trim().toLowerCase();
      const challenge = await deps.otps.findLatestOpen(email);
      if (!challenge || challenge.expiresAt < now()) {
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired code');
      }
      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        throw new AppError('RATE_LIMITED', 'Too many attempts');
      }
      if (challenge.codeHash !== hashOtp(body.code)) {
        await deps.otps.incrementAttempts(challenge.id);
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired code');
      }
      const user = await deps.users.findByEmail(email);
      if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired code');
      }
      await deps.otps.consume(challenge.id, now());
      return issue(user, platform, requestId);
    },

    refresh: async (body: RefreshCommand, platform: Platform) => {
      const session = await deps.sessions.findByRefreshHash(hashRefresh(body.refreshToken));
      if (!session) throw new AppError('UNAUTHENTICATED');
      if (session.revokedAt) {
        await deps.sessions.revokeAllForUser(session.userId, now());
        throw new AppError('UNAUTHENTICATED', 'Refresh token reuse detected');
      }
      if (session.expiresAt < now()) throw new AppError('UNAUTHENTICATED');
      const user = await deps.users.findById(session.userId);
      if (!user) throw new AppError('UNAUTHENTICATED');
      assertActive(user);
      await deps.sessions.revoke(session.id, now());
      return issue(user, platform);
    },

    logout: async (claims: AccessClaims, requestId?: string) => {
      await deps.sessions.revoke(claims.sid, now());
      await deps.audit.record({
        actorId: claims.sub,
        action: 'auth.logout',
        resourceType: 'session',
        resourceId: claims.sid,
        requestId,
      });
      return { revoked: true as const };
    },

    me: async (userId: string): Promise<UserDto> => {
      const user = await deps.users.findById(userId);
      if (!user) throw new AppError('UNAUTHENTICATED');
      return toUserDto(user);
    },

    forgotPassword: async (body: ForgotPasswordCommand) => {
      const user = await deps.users.findByEmail(body.email);
      if (user?.email) {
        const token = newRefreshToken();
        await deps.resets.create({
          userId: user.id,
          tokenHash: hashRefresh(token),
          expiresAt: new Date(now().getTime() + 60 * 60 * 1000),
        });
        await deps.jobs.enqueue('email.send', {
          to: user.email,
          template: 'auth.reset',
          locale: 'zh-HK',
          vars: { resetUrl: `${deps.webPublicUrl}/reset?token=${token}` },
        });
        await deps.jobs.enqueue('notification.create', {
          userId: user.id,
          type: 'auth.reset',
          title: '重設密碼',
          body: '我們已寄出重設連結。',
        });
      }
      return { accepted: true as const };
    },

    resetPassword: async (body: ResetPasswordCommand) => {
      const row = await deps.resets.findOpenByHash(hashRefresh(body.token));
      if (!row || row.expiresAt < now())
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired token');
      const user = await deps.users.findById(row.userId);
      if (!user) throw new AppError('UNAUTHENTICATED');
      user.passwordHash = await hashPassword(body.password);
      await deps.users.save(user);
      await deps.resets.markUsed(row.id, now());
      await deps.sessions.revokeAllForUser(user.id, now());
      await deps.audit.record({
        actorId: user.id,
        action: 'auth.reset',
        resourceType: 'user',
        resourceId: user.id,
      });
      return { accepted: true as const };
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
