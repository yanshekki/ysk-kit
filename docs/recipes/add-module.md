# Add a module

Language: [中文](add-module.zh.md) · English

For humans and agents. Law: [AGENTS.md](../../AGENTS.md). CLI flags: [ysk-kit](../cli/ysk-kit.md).

## Command

```bash
pnpm ysk-kit add module appointment --prisma --web
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

Use a kebab-case name (`appointment`, `note`, `inventory-item`). The URL is `/v1/<name>`. The Prisma model is PascalCase of that name.

`--web` is on by default. `--no-web` skips the Vite page. `--prisma` merges a `title` / `body` / `authorId` model.

## What the generator writes

| Path | Role |
|---|---|
| `packages/contracts/src/dto/<name>.ts` | DTO + create command |
| `packages/contracts/src/api/<name>.ts` | ts-rest list + create, `OkSchema` / `ErrSchema` |
| `apps/api/src/modules/<name>/domain/` | Repository port |
| `apps/api/src/modules/<name>/application/` | Service — **put business rules here** |
| `apps/api/src/modules/<name>/infra/` | Memory + Prisma repos, `HttpHandler` map, Express register, service test |
| `modules/<name>/prisma/<name>.prisma` | Fragment merged into `apps/api/prisma/schema.prisma` |
| `packages/sdk/src/resources/<name>.ts` | `client.<name>.list/create` |
| `packages/web-sdk/src/<name>-hooks.ts` | `useList` / `useCreate` |
| `apps/web/src/features/<name>/<name>-page.tsx` | List + create form using the create command schema |

It also patches `appContract`, `apps/api/src/app.ts`, `app-fastify.ts`, `composition.ts`, `main.ts`, and `create-memory-input.ts` when those files exist. Existing files are left in place (idempotent). Express routers are mounted **before** `errorHandler`, so `{ ok: false }` envelopes reach the client. The web router gains a nav `Link` in `AppShell` (and in the older `ml-auto` shell).

## After generate

1. Edit the Prisma model if you need more fields; keep DTO and command in sync.
2. Put rules in `application/<name>-service.ts` only.
3. Keep Prisma inside `infra/`.
4. Do not add a TypeScript `enum`. Extra literals go in `@ysk-kit/contracts`.
5. Do not `fetch` from the web page; use `@ysk-kit/web-sdk` hooks.

The notes-shaped tree under `modules/notes` documents the template. This repository’s API does not mount a notes route, so platform code stays free of demo business data.

## Prompt for an agent

```text
Follow AGENTS.md.
Add a <name> module with fields <...>.
Use: pnpm ysk-kit add module <name> --prisma --web
Then fill business rules in application/ and the Prisma model.
Do not invent folders. Do not add TypeScript enums.
Run pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi.
```
