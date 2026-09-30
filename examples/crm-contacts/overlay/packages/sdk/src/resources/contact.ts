import type {
  ContactDto,
  CreateContactCommand,
  PaginatedContact,
  UpdateContactStatusCommand,
} from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const contactResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedContact>(`/v1/contact${toQuery(query)}`),
  create: (body: CreateContactCommand) =>
    http.request<ContactDto>('/v1/contact', { method: 'POST', body: JSON.stringify(body) }),
  status: (id: string, body: UpdateContactStatusCommand) =>
    http.request<ContactDto>(`/v1/contact/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
