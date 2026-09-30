import type { CreateUserCommand, PageQuery, PaginatedUsers } from '@ysk-kit/contracts';
import type { UserRecord } from './user';

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  list(query: PageQuery): Promise<PaginatedUsers>;
  create(input: {
    email?: string | null;
    phone?: string | null;
    displayName: string;
    role: CreateUserCommand['role'];
    status?: UserRecord['status'];
    passwordHash?: string | null;
  }): Promise<UserRecord>;
  save(user: UserRecord): Promise<UserRecord>;
}
