import { CreateUserCommandSchema, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IJobQueue } from '@ysk-kit/jobs';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';
import type { ISessionRepository } from '../domain/session-repository';
import type { IUserRepository } from '../domain/user-repository';
import { toUserDto } from '../infra/user-mapper';

export const createUserService = (
  users: IUserRepository,
  audit?: IAuditLogger,
  jobs?: IJobQueue,
  sessions?: ISessionRepository,
) => ({
  list: (query: PageQuery) => users.list(query),
  create: async (raw: unknown, actorId?: string) => {
    const body = CreateUserCommandSchema.parse(raw);
    const user = await users.create({
      email: body.email,
      displayName: body.displayName,
      role: body.role,
    });
    await audit?.record({
      actorId: actorId ?? null,
      action: 'user.create',
      resourceType: 'user',
      resourceId: user.id,
    });
    await jobs?.enqueue('notification.create', {
      userId: user.id,
      type: 'user.created',
      title: '帳號已建立',
      body: '管理員已為你建立帳號。',
    });
    return toUserDto(user);
  },
  suspend: async (actorId: string, targetId: string) => {
    if (actorId === targetId) throw new AppError('FORBIDDEN', 'Cannot suspend yourself');
    const user = await users.findById(targetId);
    if (!user) throw new AppError('NOT_FOUND');
    if (user.status === 'SUSPENDED') return toUserDto(user);
    user.status = 'SUSPENDED';
    await users.save(user);
    await sessions?.revokeAllForUser(user.id, new Date());
    await audit?.record({
      actorId,
      action: 'user.suspend',
      resourceType: 'user',
      resourceId: user.id,
    });
    return toUserDto(user);
  },
});

export type UserService = ReturnType<typeof createUserService>;
