---
name: llm-feature
description: >
  Build a YSK Kit LLM feature with a server-owned prompt, Zod-validated
  output, untrusted-content delimiting, quota, and createFakeLlm evals.
  Use when adding or changing /v1/llm, a product prompt, streaming, or ysk-kit add llm.
  中文：LLM、system prompt、配額、createFakeLlm、評測。
  Do not use for generic chat UI with no server prompt, or for a security
  audit of non-LLM code (security-review).
---

Read `docs/skills/llm-feature.md`. Law: `AGENTS.md`.

1. Client roles are user/assistant only (`LlmClientRoleSchema`). Server prepends `LLM_SYSTEM_PROMPT`.
2. Fence untrusted user text. Parse structured output with Zod in application/.
3. Quota `LLM_QUOTA_*` → RATE_LIMITED. Evals: ≥5 normal + ≥3 adversarial `createFakeLlm`. No live provider in CI.
Gotcha: v1.2.2 already removed client `system` and added quota — describe current code, do not list those as gaps.
Verify: `pnpm --filter @ysk-kit/api exec vitest run src/modules/llm`
Full steps: `docs/skills/llm-feature.md`.
