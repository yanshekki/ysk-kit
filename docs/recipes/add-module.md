# Recipe: add a module

For humans and agents. Law: [AGENTS.md](../../AGENTS.md).

## Command

```bash
pnpm ysk add module appointment --prisma --web
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

Use a kebab-case name (`appointment`, `note`, `inventory-item`). The URL is `/v1/<name>`. The Prisma model is PascalCase of that name.

`--web` is on by default. `--no-web` skips the Vite page. `--prisma` merges a `title` / `body` / `authorId` model; uncomment-and-edit is no longer the path.

## What the generator writes

| Path | Role |
|---|---|
| `packages/contracts/src/dto/<name>.ts` | DTO + create command |
| `packages/contracts/src/api/<name>.ts` | ts-rest list + create, `OkSchema` / `ErrSchema` |
| `apps/api/src/modules/<name>/domain/` | repository port |
| `apps/api/src/modules/<name>/application/` | service |
| `apps/api/src/modules/<name>/infra/` | memory + prisma repos, `HttpHandler` map, Express register, service test |
| `modules/<name>/prisma/<name>.prisma` | fragment merged into `apps/api/prisma/schema.prisma` |
| `packages/sdk/src/resources/<name>.ts` | `client.<name>.list/create` |
| `packages/web-sdk/src/<name>-hooks.ts` | `useList` / `useCreate` |
| `apps/web/src/features/<name>/<name>-page.tsx` | list + create form using the create command schema |

It also patches `appContract`, `apps/api/src/app.ts`, `app-fastify.ts`, `composition.ts`, `main.ts`, `create-memory-input.ts` when those files exist.

## After generate

1. Edit the Prisma model if you need more fields; keep DTO and command in sync.
2. Put rules in `application/<name>-service.ts` only.
3. Keep Prisma inside `infra/`.
4. Do not add a TypeScript `enum`. Extra literals go in `@ysk/contracts`.

## Prompt

```text
Follow AGENTS.md.
Add a <name> module with fields <...>.
Use: pnpm ysk add module <name> --prisma --web
Then fill business rules in application/ and the Prisma model.
Do not invent folders. Do not add TypeScript enums.
Run pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi.
```
