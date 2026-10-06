---
name: add-module
description: >
  Add a hexagonal HTTP module with ysk-kit add module (contract, DTO, Express+Fastify, SDK, web page).
  Use when the user wants a new resource, new API route, ysk-kit add module, or /add-module.
  中文：加模組、HTTP 切片、org 範圍、Express 與 Fastify 測試。
  Do not use to mkdir apps/api/src/modules by hand or to restore llm/team/billing/push (add-capability).
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
6. When the schema changed, follow [db-migration](db-migration.md) (review SQL; do not `migrate reset` without consent). Then `pnpm gen:openapi`.
7. If the resource is org-scoped, check membership in `application/` (template: `requireBiller`) and add a cross-tenant memory-port case. See [security-review](security-review.md).
8. [verify-change](verify-change.md).

## Verification

```bash
pnpm --filter @ysk-kit/api exec vitest run src/modules/<name>
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

- [ ] Slice files came from the generator (no parallel tree)
- [ ] No TypeScript `enum`
- [ ] Clients have no Prisma and no raw `fetch`
- [ ] Schema change followed [db-migration](db-migration.md)
- [ ] Org-scoped: membership in `application/` + other-org negative test
- [ ] HTTP tests exist for **Express and Fastify** (`*.app.test.ts` on both adapters)

## Output format

```md
## Add module — <kebab>
Generator: ysk-kit add module --prisma --web
Org-scoped: yes (requireBiller/requireMember + negative test) | no
Prisma: additive | expand/contract | none
HTTP tests: Express + Fastify
OpenAPI: path listed
```

## Done criteria

List + create (or the requested verbs) run through the envelope, the memory-repo test covers the new rules, **both** HTTP adapters have app tests, OpenAPI shows the path, and the five commands above are green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Hand-made `modules/<name>` | Delete; run the generator |
| Authz in the register function | `requireBiller` in `application/` |
| Only Express SuperTest | Fastify `createFastifyApp` case |
| Prisma repo updated, memory repo not | Update both |

## Escalate / ask

Ask before an org-scoped resource that cannot use `requireMember` / `requireBiller`, or before skipping Fastify tests.
