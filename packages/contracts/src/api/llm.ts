import { initContract } from '@ts-rest/core';
import { LlmCompleteCommandSchema, LlmCompleteDtoSchema, LlmModelsDtoSchema } from '../dto/llm';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const llmContract = c.router({
  complete: {
    method: 'POST',
    path: '/v1/llm/complete',
    body: LlmCompleteCommandSchema,
    responses: {
      200: OkSchema(LlmCompleteDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      503: ErrSchema,
    },
    summary: 'One-shot chat completion',
  },
  models: {
    method: 'GET',
    path: '/v1/llm/models',
    responses: { 200: OkSchema(LlmModelsDtoSchema), 401: ErrSchema, 403: ErrSchema },
    summary: 'Configured models',
  },
});
