import type {
  CreateMemberProfileCommand,
  MemberProfileDto,
  PaginatedMemberProfile,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const memberProfileResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedMemberProfile>(`/v1/member-profile${toQuery(query)}`),
  create: (body: CreateMemberProfileCommand) =>
    http.request<MemberProfileDto>('/v1/member-profile', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
