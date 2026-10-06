import { z } from 'zod';

export const LlmRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type LlmRole = (typeof LlmRole)[keyof typeof LlmRole];
export const LLM_ROLE_VALUES = Object.values(LlmRole) as [LlmRole, ...LlmRole[]];
export const LlmRoleSchema = z.enum(LLM_ROLE_VALUES);

export const LlmClientRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type LlmClientRole = (typeof LlmClientRole)[keyof typeof LlmClientRole];
export const LLM_CLIENT_ROLE_VALUES = Object.values(LlmClientRole) as [
  LlmClientRole,
  ...LlmClientRole[],
];
export const LlmClientRoleSchema = z.enum(LLM_CLIENT_ROLE_VALUES);
