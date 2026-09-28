import type { CreateUserCommand, UserDto } from '@ysk/contracts';
import type { HttpClient } from '../http';

export const usersResource = (http: HttpClient) => ({
  list: () => http.request<UserDto[]>('/v1/users'),
  create: (body: CreateUserCommand) =>
    http.request<UserDto>('/v1/users', { method: 'POST', body: JSON.stringify(body) }),
});
