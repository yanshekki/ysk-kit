import { z } from 'zod';

export const LlmRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type LlmRole = (typeof LlmRole)[keyof typeof LlmRole];
export const LLM_ROLE_VALUES = Object.values(LlmRole) as [LlmRole, ...LlmRole[]];
export const LlmRoleSchema = z.enum(LLM_ROLE_VALUES);
