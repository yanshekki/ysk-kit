import type { CreateSkuCommand, PaginatedSku, SkuDto } from '@ysk-kit/contracts';
import type { HttpClient } from '../http.js';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const skuResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedSku>(`/v1/sku${toQuery(query)}`),
  create: (body: CreateSkuCommand) =>
    http.request<SkuDto>('/v1/sku', { method: 'POST', body: JSON.stringify(body) }),
});
