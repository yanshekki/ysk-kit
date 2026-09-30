import type {
  CreateTicketCommand,
  PaginatedTicket,
  TicketDto,
  UpdateTicketStatusCommand,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query: { organizationId: string; cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  params.set('organizationId', query.organizationId);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  return `?${params.toString()}`;
};

export const ticketResource = (http: HttpClient) => ({
  list: (query: { organizationId: string; cursor?: string; limit?: number }) =>
    http.request<PaginatedTicket>(`/v1/ticket${toQuery(query)}`),
  create: (body: CreateTicketCommand) =>
    http.request<TicketDto>('/v1/ticket', { method: 'POST', body: JSON.stringify(body) }),
  status: (id: string, body: UpdateTicketStatusCommand) =>
    http.request<TicketDto>(`/v1/ticket/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
