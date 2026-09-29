import type { CreateUserCommand, PaginatedUsers, UserDto } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const usersResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedUsers>(`/v1/users${toQuery(query)}`),
  create: (body: CreateUserCommand) =>
    http.request<UserDto>('/v1/users', { method: 'POST', body: JSON.stringify(body) }),
  suspend: (id: string) =>
    http.request<UserDto>(`/v1/users/${id}/suspend`, { method: 'POST', body: '{}' }),
});
