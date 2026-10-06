---
name: add-capability
description: >
  Merge a catalogued YSK Kit capability (llm, team, billing, push, jobs, mail, …) with ysk-kit add.
  Use when the user wants ysk-kit add llm/team/billing/push, restore a thin capability, or /add-capability.
  中文：加能力、llm、billing、push、doctor。
  Do not use to invent a capability outside the catalogue or to add industry domain.
---

# Skill: add capability

Language: [中文](add-capability.zh.md) · English

Merge a catalogued platform feature. Follow [docs/recipes/add-capability.md](../recipes/add-capability.md). Law: [AGENTS.md](../../AGENTS.md). Catalogue: [capabilities](../guides/capabilities.md). If the protocol requires a plan, finish [plan-feature](plan-feature.md) first.

## Trigger

- Restore llm / team / billing / push on a thin product.
- Merge another catalogue name (`auth`, `jobs`, `mail`, …).
- The user says `ysk-kit add <name>` or “turn billing back on”.

Do not invent a capability folder outside the catalogue. Do not add an industry domain this way.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Catalogue name | yes | `auth`, `rbac`, `audit-log`, `storage`, `i18n`, `jobs`, `mail`, `notifications`, `llm`, `websocket`, `push`, `mobile`, `team`, `apikey`, `crypto`, `billing`. Alias `org` → `team` |
| `team` before `billing` | when name is `billing` | Throws if `schema.prisma` has no `model Organization` |

## Steps

1. Confirm the name is in the catalogue.
2. If the name is `billing`, run `pnpm ysk-kit add team` first.
3. `pnpm ysk-kit add <name>`.
4. When Prisma changed, follow [db-migration](db-migration.md), then `pnpm db:migrate`.
5. Fill env keys from `.env.example` (never commit secrets).
6. Before production, do the one-line item for that capability (table below), then `pnpm ysk-kit doctor`.
7. [verify-change](verify-change.md).

## Before production (one line each)

| Capability | Before production |
|---|---|
| `billing` | [webhook-handling](webhook-handling.md): webhook secret, raw-body signature, `ProcessedWebhookEvent` idempotency. Keep `requireBiller`. |
| `llm` | [llm-feature](llm-feature.md): server-owned `LLM_SYSTEM_PROMPT`, quota, `createFakeLlm` evals. |
| `push` | Real FCM / Expo credentials in env (not the example placeholders); devices stay user-scoped. |
| `apikey` | Scope every key; rotate by revoke + mint (`ysk_live_…`); never log the secret. |
| `team` | Membership checks in `application/` ([security-review](security-review.md)). |
| other catalogue names | `pnpm ysk-kit doctor` still required |

A second add of `llm` / `team` / `billing` / `push` is a no-op when the skip token is already in `app.ts` or `composition.ts`.

## Verification

```bash
pnpm ysk-kit doctor
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] The requested service is wired once (no duplicate `register*Routes`)
- [ ] Env keys exist in `.env.example`; secrets stay out of git
- [ ] Before-production line for that capability is done or listed for the human

## Output format

```md
## Add capability — <name>
Order: team before billing | n/a
Doctor: ok | FAIL
Before production: <one-liner status>
Adapters: Express + Fastify | n/a
```

## Done criteria

The capability is mounted on Express and Fastify (when the product has an API), Prisma fragments are merged, SDK/web-sdk patches are present when the template ships them, `doctor` is not red, and the five commands above are green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `ysk-kit add billing` without Organization | `add team` first |
| Invent `ysk-kit add salon` | Catalogue names only |
| Skip webhook skill because “Stripe later” | Do not ship billing without [webhook-handling](webhook-handling.md) |

## Escalate / ask

Ask before a catalogue name that is not in the table, or before production credentials.
