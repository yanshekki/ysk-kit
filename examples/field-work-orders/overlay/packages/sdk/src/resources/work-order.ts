import type { CreateWorkOrderCommand, PaginatedWorkOrder, WorkOrderDto } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const workOrderResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedWorkOrder>(`/v1/work-order${toQuery(query)}`),
  create: (body: CreateWorkOrderCommand) =>
    http.request<WorkOrderDto>('/v1/work-order', { method: 'POST', body: JSON.stringify(body) }),
  assign: (id: string) =>
    http.request<WorkOrderDto>(`/v1/work-order/${id}/assign`, { method: 'POST', body: '{}' }),
  complete: (id: string) =>
    http.request<WorkOrderDto>(`/v1/work-order/${id}/complete`, { method: 'POST', body: '{}' }),
});
