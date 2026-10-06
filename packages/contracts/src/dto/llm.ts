import { z } from 'zod';
import { LlmRoleSchema } from '../enums/llm-role.js';

export const LlmMessageSchema = z.object({
  role: LlmRoleSchema,
  content: z.string().min(1).max(32_000),
});
export type LlmMessage = z.infer<typeof LlmMessageSchema>;

export const LlmCompleteCommandSchema = z.object({
  messages: z.array(LlmMessageSchema).min(1).max(50),
  temperature: z.number().min(0).max(2).optional(),
});
export type LlmCompleteCommand = z.infer<typeof LlmCompleteCommandSchema>;

export const LlmUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});
export type LlmUsage = z.infer<typeof LlmUsageSchema>;

export const LlmCompleteDtoSchema = z.object({
  text: z.string(),
  model: z.string(),
  usage: LlmUsageSchema,
});
export type LlmCompleteDto = z.infer<typeof LlmCompleteDtoSchema>;

export const LlmModelsDtoSchema = z.object({
  items: z.array(z.object({ id: z.string() })),
});
export type LlmModelsDto = z.infer<typeof LlmModelsDtoSchema>;
