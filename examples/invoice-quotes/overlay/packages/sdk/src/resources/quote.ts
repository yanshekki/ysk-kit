import type { CreateQuoteCommand, PaginatedQuote, QuoteDto } from '@ysk-kit/contracts';
import type { HttpClient } from '../http.js';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const quoteResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedQuote>(`/v1/quote${toQuery(query)}`),
  create: (body: CreateQuoteCommand) =>
    http.request<QuoteDto>('/v1/quote', { method: 'POST', body: JSON.stringify(body) }),
  send: (id: string) =>
    http.request<QuoteDto>(`/v1/quote/${id}/send`, {
      method: 'POST',
      body: '{}',
    }),
  accept: (id: string) =>
    http.request<QuoteDto>(`/v1/quote/${id}/accept`, {
      method: 'POST',
      body: '{}',
    }),
});
