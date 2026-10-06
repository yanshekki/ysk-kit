---
name: add-capability
description: >
  Merge a catalogued YSK Kit capability (llm, team, billing, push, jobs, mail, …) with ysk-kit add.
  Use when the user wants ysk-kit add llm/team/billing/push, restore a thin capability, or /add-capability.
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
4. `pnpm db:migrate` when Prisma changed.
5. Fill env keys from `.env.example` (never commit secrets).
6. [verify-change](verify-change.md).

A second add of `llm` / `team` / `billing` / `push` is a no-op when the skip token is already in `app.ts` or `composition.ts`.

## Verification

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] The requested service is wired once (no duplicate `register*Routes`)
- [ ] Env keys exist in `.env.example`; secrets stay out of git

## Done criteria

The capability is mounted on Express and Fastify (when the product has an API), Prisma fragments are merged, SDK/web-sdk patches are present when the template ships them, and the five commands above are green.
