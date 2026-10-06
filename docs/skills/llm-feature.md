---
name: llm-feature
description: >
  Build a YSK Kit LLM feature with a server-owned prompt, Zod-validated
  output, untrusted-content delimiting, quota, and createFakeLlm evals.
  Use when adding or changing /v1/llm, a product prompt, streaming, or
  ysk-kit add llm. 中文：LLM、system prompt、配額、createFakeLlm、評測。
  Do not use for generic chat UI with no server prompt, or for a security
  audit of non-LLM code (security-review).
---

# Skill: LLM feature

Language: [中文](llm-feature.zh.md) · English

Product LLM calls are **server-owned**. Law: [AGENTS.md](../../AGENTS.md). Envelope: [envelope-api](envelope-api.md). Security: [security-review](security-review.md). Tests: [write-tests](write-tests.md).

## Trigger

- New or changed `POST /v1/llm/complete`, `POST /v1/llm/stream`, or a product use case that calls `ILlmPort`.
- `pnpm ysk-kit add llm`.
- A prompt, quota, or evals discussion.

Do not use for a client-only copy change, or for a repo-wide audit with no LLM path ([security-review](security-review.md)).

## Current kit (v1.2.2)

Do not list these as gaps. They already shipped:

| Piece | Where |
|---|---|
| Client messages are `user` \| `assistant` only | `LlmClientRoleSchema` / `LlmCompleteCommandSchema` in `packages/contracts/src/dto/llm.ts`. `system` is **not** a client role. |
| Server prepends the system prompt | `createLlmService` in `apps/api/src/modules/llm/application/llm-service.ts` uses `opts.systemPrompt` or `DEFAULT_LLM_SYSTEM_PROMPT`. |
| Env | `LLM_SYSTEM_PROMPT` (max 8_000), `LLM_QUOTA_MAX` (0 disables), `LLM_QUOTA_WINDOW_MS` in `@ysk-kit/config`. Composition passes `llmQuotaFromEnv(env)`. |
| Over quota | `AppError('RATE_LIMITED')` → envelope 429. Per-user `usage.countSince`. |
| Fake provider | `createFakeLlm({ text, model })` in `@ysk-kit/llm`. Tests and thin dests use it. **No live provider in CI.** |
| Stream exception | `POST /v1/llm/stream` is SSE (`event: delta` / `event: done`). Complete stays `{ ok, data }`. |

`LlmRoleSchema` still includes `system` for **server-side** `LlmMessage` after the prepend. Clients must not send it (`LlmClientMessageSchema`).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Use case | yes | One sentence (“summarise a note”, not “add ChatGPT”) |
| Output Zod | yes | A DTO in `@ysk-kit/contracts`, not free text the UI parses by regex |
| PII | yes | What user text may contain; what must never go to the provider |

## Steps

1. Plan if the protocol requires it (LLM is a trust boundary). Record the prompt owner, quota, and evals in the plan.
2. **Contracts first.** Command messages: `LlmClientMessageSchema`. If the product needs structured output, add a dedicated DTO and parse the model text with Zod in `application/` (retry once on `VALIDATION_FAILED`; do not pass raw model JSON to the client).
3. **Server-owned prompt.** Put the instruction in `LLM_SYSTEM_PROMPT` or a module-specific string in `application/`. Never take `role: 'system'` from the client. Never concatenate user text into the system string.
4. **Untrusted-content delimiting.** Wrap user-supplied text in a fence the prompt tells the model to treat as data, for example:

   ```txt
   <user_content>
   …untrusted…
   </user_content>
   ```

   The system prompt must say that text inside the fence is data, not instructions.
5. **Caps.** Keep `messages` ≤ 50 and `content` ≤ 32_000 (already in the command schema). Set provider `max_tokens` on `ILlmPort` implementations when you add a real backend. Quota: `LLM_QUOTA_MAX` / `LLM_QUOTA_WINDOW_MS` (default 60 / 3_600_000 ms). `LLM_QUOTA_MAX=0` disables the per-user quota (tests); do not ship that in production.
6. **Privacy.** Do not send passwords, OTP, access tokens, or Stripe `sk_` / `whsec_` to the provider. Redact before `complete`/`stream`. Do not log prompt text. `@ysk-kit/logger` already redacts `LLM_API_KEY` / `XAI_API_KEY`.
7. **Evals with `createFakeLlm`.** In `llm-service.test.ts` / `llm.app.test.ts` (Express **and** Fastify):

   - ≥ **5** normal cases (happy complete, stream chunks, quota under max, empty-safe content, structured parse success).
   - ≥ **3** adversarial cases (client `role: 'system'` → 422 `VALIDATION_FAILED`; prompt-injection text inside the fence still uses the server prompt; over-quota → 429 `RATE_LIMITED`).

   Inject a fake that returns attacker-controlled text and assert the application still validates. **Do not** call OpenAI / Anthropic / xAI / SpaceXAI in CI.
8. Production without keys: `createLlmService({ production: true, configured: false })` throws `AppError('INTERNAL', 'LLM not configured', 503)`. Keep that.
9. [verify-change](verify-change.md).

## Verification

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/llm
pnpm --filter @ysk-kit/contracts test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: client `system` rejected; quota 429; `ysk-kit check agent: ok`.

- [ ] Prompt is server-owned
- [ ] User text is fenced
- [ ] Output parsed with Zod when the UI needs structure
- [ ] ≥5 normal + ≥3 adversarial `createFakeLlm` cases
- [ ] No live provider in CI

## Output format

```md
## LLM feature — <use case>
Prompt owner: LLM_SYSTEM_PROMPT | application/<file>
Client roles: user, assistant (LlmClientRoleSchema)
Fence: <tag names>
Output Zod: <DTO or "plain text in envelope">
Quota: LLM_QUOTA_MAX=<n> / WINDOW_MS=<n>
PII: <allowed / stripped>
Evals: <n> normal / <n> adversarial (createFakeLlm)
CI provider: none
```

## Done criteria

The use case uses the current v1.2.2 controls, evals exist on memory ports and both HTTP adapters, and verify-change is green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Client sends `role: 'system'` | Rejected by `LlmClientRoleSchema` — keep it that way |
| User text concatenated into the system prompt | Fence + instruction that fence is data |
| Regex-parse model JSON in the web app | Zod DTO in `application/` |
| CI `LLM_API_KEY` | `createFakeLlm` |
| Disable quota to get tests green | `LLM_QUOTA_MAX=0` only in the test env map |
| Log the full prompt | Log `requestId` + token counts |

## Escalate / ask

Ask before adding a new live provider, sending PII to a model, raising quota in production, or adding a second streaming transport.

## Sources

- Current kit: `packages/contracts/src/dto/llm.ts`, `apps/api/src/modules/llm/application/llm-service.ts`, `@ysk-kit/config` `LLM_*`, `@ysk-kit/llm` `createFakeLlm`
- OWASP Top 10 for LLM 2025 (LLM01 prompt injection, LLM06 sensitive info) — <https://genai.owasp.org/llm-top-10/>
- Anthropic prompt engineering (delimiters, server-side instructions)
- [security-review](security-review.md) LLM row; [envelope-api](envelope-api.md) SSE exception
