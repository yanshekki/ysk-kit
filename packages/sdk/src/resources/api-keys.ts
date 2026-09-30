import type { ApiKeyDto, CreateApiKeyCommand, CreatedApiKeyDto } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

export const apiKeysResource = (http: HttpClient) => ({
  list: () => http.request<ApiKeyDto[]>('/v1/me/api-keys'),
  create: (body: CreateApiKeyCommand) =>
    http.request<CreatedApiKeyDto>('/v1/me/api-keys', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  revoke: (id: string) =>
    http.request<{ revoked: true }>(`/v1/me/api-keys/${id}`, { method: 'DELETE' }),
});
