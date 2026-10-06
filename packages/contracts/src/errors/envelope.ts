import { z } from 'zod';
import { ERROR_CODE_VALUES } from './codes.js';

export const ApiErrorBodySchema = z.object({
  code: z.enum(ERROR_CODE_VALUES),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export const OkSchema = <T extends z.ZodType>(data: T) => z.object({ ok: z.literal(true), data });

export const ErrSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorBodySchema,
});

export type ErrEnvelope = z.infer<typeof ErrSchema>;
export type OkEnvelope<T> = { ok: true; data: T };
