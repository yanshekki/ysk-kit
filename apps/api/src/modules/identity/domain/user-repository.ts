import type { UserDto } from '@ysk/contracts';

export interface IUserRepository {
  list(): Promise<UserDto[]>;
  create(input: { email: string; displayName: string; role: UserDto['role'] }): Promise<UserDto>;
}
