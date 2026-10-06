---
name: add-module
description: >
  Add a hexagonal HTTP module with ysk-kit add module (contract, DTO, Express+Fastify, SDK, web page).
  Use when the user wants a new resource, new API route, ysk-kit add module, or /add-module.
---

# Skill: add module

Language: [中文](add-module.zh.md) · English

Add a business HTTP resource. Follow [docs/recipes/add-module.md](../recipes/add-module.md). Law: [AGENTS.md](../../AGENTS.md). CLI: [ysk-kit](../cli/ysk-kit.md). If the protocol requires a plan, finish [plan-feature](plan-feature.md) first.

## Trigger

- New business resource or `/v1/<name>` route.
- The user says `ysk-kit add module`, “new entity”, or “new HTTP slice”.

Do not mkdir `apps/api/src/modules/<name>` by hand.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Kebab name | yes | `booking`, `inventory-item`. Must match `^[a-z][a-z0-9-]*$` |
| `--prisma` | usually | Merge a `title` / `body` / `authorId` model; extend afterwards |
| `--web` / `--no-web` | no | `--web` is the default. Use `--no-web` when there is no Vite app |

## Steps

1. Pick the kebab-case name. Do not create folders by hand.
2. `pnpm ysk-kit add module <name> --prisma --web` (or `--no-web`).
3. Extend DTO, command, and Prisma fields in `@ysk-kit/contracts` and the Prisma model. Keep `OkSchema` / `ErrSchema`.
4. Put rules in `application/<name>-service.ts`.
5. Keep Prisma in `infra/`. Clients use `@ysk-kit/sdk` / `@ysk-kit/web-sdk` only.
6. `pnpm db:migrate && pnpm gen:openapi` when the schema or paths changed.
7. [verify-change](verify-change.md).

## Verification

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] Slice files came from the generator (no parallel tree)
- [ ] No TypeScript `enum`
- [ ] Clients have no Prisma and no raw `fetch`

## Done criteria

List + create (or the requested verbs) run through the envelope, the memory-repo test covers the new rules, OpenAPI shows the path, and the five commands above are green.
