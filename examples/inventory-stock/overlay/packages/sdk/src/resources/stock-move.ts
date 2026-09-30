import type { CreateStockMoveCommand, PaginatedStockMove, StockMoveDto } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const stockMoveResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedStockMove>(`/v1/stock-move${toQuery(query)}`),
  create: (body: CreateStockMoveCommand) =>
    http.request<StockMoveDto>('/v1/stock-move', { method: 'POST', body: JSON.stringify(body) }),
});
