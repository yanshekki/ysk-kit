---
name: security-review
description: >
  Review YSK Kit authz, tenant isolation, secrets, logging redaction, token
  storage, webhook signatures, and LLM input against hexagonal modules and
  the {ok,data}/{ok,error} envelope. Optional lightweight threat-model mode.
  Use when the user asks for a security review or audit; the diff touches
  auth, apikey, organizations, billing, files, crypto, webhooks, env/secrets,
  or a new capability; or the plan's security section is not "none".
  中文：安全審查、權限、跨租戶、密鑰、日誌遮罩、webhook 簽名。
  Do not use for pure UI styling, docs typos, or generic dependency bumps.
---

# Skill: security review

Language: [中文](security-review.zh.md) · English

Review authz, secrets, and trust boundaries in this kit. Law: [AGENTS.md](../../AGENTS.md). Related: [webhook-handling](webhook-handling.md), [desktop-electron](desktop-electron.md), [plan-feature](plan-feature.md). Long checklists: [tenancy](security-review/references/tenancy.md), [secrets and logging](security-review/references/secrets-logging.md), [client token storage](security-review/references/client-token-storage.md).

## Trigger

- The user asks for a security review, audit, or threat model.
- The diff touches `auth`, `apikey`, `organizations`, `billing`, `files`, `crypto`, a `/v1/*/webhook` route, env/secret handling, or a new capability.
- The dated plan’s **Security and privacy** section is not “none”.

Do not trigger for pure UI styling, docs typos, or a dependency bump with no new trust boundary.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Base ref | yes | `git diff <base>...HEAD`. Default `origin/main` |
| Mode | no | `review` (default) or `threat-model` (only if the user asked, or a new capability / trust boundary lands) |
| Scope paths | no | Restrict the table to named modules |

## Scope and confidence

Borrowed from getsentry `security-review`: **report scope = the diff**; **research scope = the repo**. Existing code is context, not a finding, unless the change newly relies on it.

| Confidence | When | Action |
|---|---|---|
| HIGH | Exploit path is concrete in this tree | Report |
| MEDIUM | Needs a runtime check you could not run | Label “needs verification” |
| LOW | Pattern match only | Do not report |

Do not flag: server-controlled values as attacker input; documented envelope exceptions; in-memory test fakes; `.env.example` placeholders.

## Steps

1. Confirm the base ref and that the diff is non-empty: `git diff <base>...HEAD --stat`.
2. Trace data flow: untrusted input (HTTP body/query, webhook raw body, LLM user content, file metadata) → contract Zod → `application/` → ports. Authorization belongs in `application/`, not the Express/Fastify register.
3. Walk the [tenancy](security-review/references/tenancy.md), [secrets](security-review/references/secrets-logging.md), and [token storage](security-review/references/client-token-storage.md) checklists. For inbound webhooks follow [webhook-handling](webhook-handling.md). For `apps/desktop/src/main` follow [desktop-electron](desktop-electron.md).
4. AuthN: after `optionalAuth` / `registerOptionalJwt` (`apps/api/src/app.ts`, `app-fastify.ts`), handlers that need a user must reject missing `req.user` with `UNAUTHENTICATED`. API keys go through `resolveApiKey` and stay scoped.
5. Input: Zod in `@ysk-kit/contracts` needs length/count caps (files already cap `byteSize` at 20 MiB in `packages/contracts/src/dto/file.ts`). Do not trust MIME from the client as authorization.
6. Rate limits: `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` via `createRateLimit` in `@ysk-kit/api-http`. Auth OTP already returns `RATE_LIMITED`. Do not disable the limiter to make a test pass (`RATE_LIMIT_MAX=0` is a test/CI escape hatch, not production).
7. CORS: `corsOrigins` in `packages/config` is the web + admin public URLs. Do not use `*` with credentials. Adding helmet / CSP headers is a plan decision (the API does not ship them today).
8. LLM: product features own the prompt in `application/` (`LLM_SYSTEM_PROMPT`). Clients send only `user` / `assistant` (`LlmClientRoleSchema`). Treat user content as untrusted. Follow [llm-feature](llm-feature.md).
9. Supply chain: a new runtime dependency is an **ask first** (AGENTS.md).
10. If mode is `threat-model`, run [Threat-model sub-mode](#threat-model-sub-mode) **before** writing findings. Confirm assumptions with the user.
11. Emit the [output format](#output-format). Then [verify-change](verify-change.md) if you changed code.

## Kit starter hotspots

These are review locations, not confirmed exploits. Describe the right pattern; do not “fix” them in a docs-only change.

| Area | Today (v1.2.2) | Keep doing |
|---|---|---|
| Logger | `packages/logger` pino `redact` paths | Never log OTP, JWT, `sk_`, `whsec_` |
| Billing webhook | Signature + `ProcessedWebhookEvent` | [webhook-handling](webhook-handling.md); still queue fulfilment |
| Web tokens | `createWebStorageTokenStore` (localStorage) | XSS steals tokens; document the surface |
| Electron tokens | `safeStorage` only; memory if unavailable | [desktop-electron](desktop-electron.md) |
| Tenancy | `requireBiller` / `requireMember` | Every org-scoped use case copies that pattern |
| LLM | Server `LLM_SYSTEM_PROMPT`; client has no `system` role; quota `RATE_LIMITED` | [llm-feature](llm-feature.md) |

## Threat-model sub-mode

Use only when the user explicitly asks, or when the change adds a capability or a new trust boundary. Flow from openai `security-threat-model`:

1. Assets (tokens, org data, Stripe customer ids, files, crypto keys).
2. Trust boundaries (browser, Electron renderer vs main, Expo, API, Stripe, LLM provider).
3. Attacker capability **and** non-capability (what they cannot do).
4. Abuse paths with likelihood × impact.
5. **Stop and confirm assumptions with the user.**
6. Write `docs/plans/<yyyy-mm-dd>-<slug>-threat-model.md` (and `.zh.md`) or fill the plan’s Security section.

Do not produce a threat-model report from guessed production topology.

## Verification

```bash
pnpm test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: tests green; `pnpm ysk-kit check agent` prints `ysk-kit check agent: ok`.

Spot-check (expect no hits on new code you wrote):

```bash
rg -n "logger\\.(info|debug|error)\\([^)]*(token|secret|password|otp|whsec_|sk_live)" apps packages
```

- [ ] Each org-scoped use case has a “other org → `FORBIDDEN` or `NOT_FOUND`” memory-port test
- [ ] No secret, OTP, or Stripe `sk_` in logs or commits
- [ ] HIGH findings are fixed or explicitly accepted by the user

## Output format

```md
## Security review — <scope> (<base>...HEAD)

| # | Severity | Confidence | Category (ASVS) | Location | Exploit path | Fix |
|---|---|---|---|---|---|---|
| 1 | high | HIGH | V8.4.1 | apps/api/src/modules/… | … | … |

Verified clean: <checklist items>
Could not verify: <item + why>
Threat-model assumptions (if any): <confirmed / skipped>
```

Severity: `high` (cross-tenant, secret leak, unsigned webhook) / `medium` / `low`. Omit LOW confidence rows.

## Done criteria

Every HIGH finding has a fix or written user acceptance. Org-scoped use cases have a cross-tenant negative test. The five verify commands are green when code changed. Threat-model mode recorded confirmed assumptions.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Grep-only findings | Trace a data flow, then report |
| Authz in the router | Check membership in `application/` |
| “User must be logged in” | That is AuthN, not tenant isolation |
| Disable rate limit for green CI | Keep memory limiter; raise fixture budget |
| Treat `.env.example` as a leak | It is a placeholder; production must not boot on `change-me-in-dev-only` |

## Escalate / ask

Stop and ask before weakening authz, rate limits, or secret-logging rules; before adding an envelope exception; before a new runtime dependency.

## Sources

- getsentry `security-review` and `secret-serialization` — <https://github.com/getsentry/skills>
- openai `security-threat-model` / `security-best-practices` — <https://github.com/openai/skills>
- OWASP ASVS 5.0 V8 Authorization (V8.4.1 cross-tenant) — <https://asvs.dev/v5.0.0/V8-Authorization/>
- OWASP Authorization Cheat Sheet — <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Pino redaction — <https://getpino.io/#/docs/redaction>
- OWASP Top 10 for LLM 2025 (LLM01 / LLM06) — <https://genai.owasp.org/llm-top-10/>
