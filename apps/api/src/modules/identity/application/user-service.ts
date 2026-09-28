import { CreateUserCommandSchema } from '@ysk/contracts';
import type { IUserRepository } from '../domain/user-repository';

export const createUserService = (users: IUserRepository) => ({
  list: () => users.list(),
  create: (raw: unknown) => {
    const body = CreateUserCommandSchema.parse(raw);
    return users.create(body);
  },
});
