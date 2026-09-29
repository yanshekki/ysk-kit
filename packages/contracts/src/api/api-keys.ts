import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ApiKeyDtoSchema, CreateApiKeyCommandSchema, CreatedApiKeyDtoSchema } from '../dto/api-key';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const apiKeysContract = c.router({
  list: {
    method: 'GET',
    path: '/v1/me/api-keys',
    responses: { 200: OkSchema(z.array(ApiKeyDtoSchema)), 401: ErrSchema, 403: ErrSchema },
    summary: 'List my API keys',
  },
  create: {
    method: 'POST',
    path: '/v1/me/api-keys',
    body: CreateApiKeyCommandSchema,
    responses: {
      201: OkSchema(CreatedApiKeyDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Create an API key (token shown once)',
  },
  revoke: {
    method: 'DELETE',
    path: '/v1/me/api-keys/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: OkSchema(z.object({ revoked: z.literal(true) })),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Revoke an API key',
  },
});
