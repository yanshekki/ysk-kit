# `ysk`

Language: [中文](ysk.zh.md) · English

Generator binary at `tooling/ysk-cli`. Invoke with `pnpm ysk …` from the product root (or `pnpm --filter @ysk/cli start …`).

```text
pnpm ysk add module <kebab-name> [--prisma] [--web] [--no-web]
pnpm ysk add <capability>
pnpm ysk generate openapi
pnpm ysk upgrade [--dry-run]
pnpm ysk check agent
```

Environment: `YSK_ROOT` — product root to patch. Defaults to this kit when unset.

## `ysk add module`

Writes one hexagonal HTTP slice. Name must match `^[a-z][a-z0-9-]*$` (example: `booking`, `inventory-item`). The URL is `/v1/<name>`. The Prisma model is PascalCase of that name.

| Flag | Default | Effect |
|---|---|---|
| `--prisma` | off | Merge a `title` / `body` / `authorId` model into `apps/api/prisma/schema.prisma` and write `modules/<name>/prisma/<name>.prisma` |
| `--web` | on | Write `apps/web/src/features/<name>/<name>-page.tsx` |
| `--no-web` | — | Skip the Vite page |

Files created (skipped if they already exist):

| Path | Role |
|---|---|
| `packages/contracts/src/dto/<name>.ts` | DTO + create command |
| `packages/contracts/src/api/<name>.ts` | ts-rest list + create, `OkSchema` / `ErrSchema` |
| `apps/api/src/modules/<name>/domain/` | Repository port |
| `apps/api/src/modules/<name>/application/` | Service |
| `apps/api/src/modules/<name>/infra/` | Memory + Prisma repos, `HttpHandler` map, Express register, service test |
| `packages/sdk/src/resources/<name>.ts` | `client.<name>.list/create` |
| `packages/web-sdk/src/<name>-hooks.ts` | `useList` / `useCreate` |

When the files exist, the command also patches `appContract`, `apps/api/src/app.ts`, `app-fastify.ts`, `composition.ts`, `main.ts`, and `create-memory-input.ts`. Express routers are mounted before `errorHandler`. A second run on the same name is a no-op for existing files.

After generate: edit the Prisma model if you need more fields, put rules in `application/`, then:

```bash
pnpm db:migrate
pnpm gen:openapi
pnpm layers && pnpm typecheck && pnpm test
```

Recipe: [add-module](../recipes/add-module.md).

## `ysk add <capability>`

Merges a catalogued platform capability. Unknown names throw `unknown capability`. Alias: `org` → `team`.

| Capability | What it adds |
|---|---|
| `auth` | Session / OTP Prisma, `JWT_*`, `OTP_TTL_SECONDS`, `TWILIO_*`, `@ysk/auth` |
| `rbac` | Permissions already live in `ROLE_PERMISSIONS`; no files copied |
| `audit-log` | Audit Prisma fragment |
| `storage` | FileObject fragment, `S3_*`, `@ysk/storage` |
| `i18n` | `@ysk/i18n` (default locale zh-HK) |
| `jobs` | `REDIS_URL`, `@ysk/jobs` |
| `mail` | `SMTP_URL`, `MAIL_FROM`, `@ysk/mail` |
| `notifications` | In-app notification routes |
| `llm` | `LlmUsage`, source tree + Express/Fastify/composition/SDK/web patches, `LLM_*` / `XAI_API_KEY` |
| `websocket` | `@ysk/realtime`, patches `composition.ts` with `createRealtimeFromEnv` |
| `push` | Device fragment, source tree + worker patch, `EXPO_ACCESS_TOKEN`, `FCM_*` |
| `mobile` | Points at `apps/mobile` Expo template |
| `team` | Organization + Membership fragment, source tree + web and Expo org screens |
| `apikey` | ApiKey fragment |
| `crypto` | `CRYPTO_MASTER_KEY`, `@ysk/crypto` |
| `billing` | Subscription fragment on Organization; **requires `team` first** |

For `llm`, `team`, `billing`, and `push`, the command copies `tooling/ysk-cli/templates/capabilities/<name>/` when the product does not already contain the skip token (`createLlmService`, `createOrganizationService`, `createBillingService`, `createDeviceService`) in `app.ts` or `composition.ts`. This repository already wires those services, so a second add is a no-op.

`ysk add billing` throws if `schema.prisma` has no `model Organization`. Run `pnpm ysk add team` first.

Every add merges missing Prisma fragments, `.env.example` keys, and `apps/api` workspace dependencies. It does not run `prisma migrate`.

Recipe: [add-capability](../recipes/add-capability.md).

## `ysk generate openapi`

Reads the ts-rest `appContract` and writes `docs/openapi.yaml`. Equivalent: `pnpm gen:openapi`.

## `ysk upgrade`

Copies **allowlisted guardrail files** from the kit checkout that contains this CLI into the product root (`YSK_ROOT`, default this repository).

```text
pnpm ysk upgrade
pnpm ysk upgrade --dry-run
```

| Flag | Effect |
|---|---|
| `--dry-run` | Print `will copy` / `skip` / `will write agent stubs` / `will write .ysk-kit.json` without writing files |

Overwritten paths: `AGENTS.md`, `AGENTS.zh.md`, `CLAUDE.md`, `.dependency-cruiser.cjs`, `packages/typescript-config/`, `packages/biome-config/`, `docs/skills/`. Directory copies skip `node_modules` and `dist`. Missing kit paths are skipped. Workspace products also receive Cursor/Grok skill wrappers generated from `tooling/ysk-cli/templates/agent/` (gitignored `.cursor/` and `.grok/`).

Left alone: `apps/**`, `modules/**`, product DTOs, product `README.md`, `.env`, Prisma migrations, `docs/openapi.yaml`.

After a successful run, `.ysk-kit.json` `version` is set to the current kit version; `flavor`, `preset`, and `db` are kept. If the marker is missing, the command still runs when `pnpm-workspace.yaml` or `AGENTS.md` exists, then writes a marker (`unknown` for unset flavor/preset/db). Otherwise it throws and asks for a product root or `YSK_ROOT`.

Apply a newer kit by running **that kit’s** CLI:

```bash
YSK_ROOT=/path/to/your-product pnpm ysk upgrade
```

Guide: [Refreshing a generated product](../guides/upgrade.md).

## `ysk check agent`

Scans the product root (`YSK_ROOT`, default this repository) for typical broken patches. Text scan only: no database, no typecheck.

```text
pnpm ysk check agent
```

Exit 0 prints `ysk check agent: ok`. Exit 1 prints one line per finding: `rule  file:line`.

| Rule | Where | What it flags |
|---|---|---|
| `no-ts-enum` | `apps/**`, `packages/**`, `modules/**` (`.ts` / `.tsx`) | TypeScript `enum` / `const enum` |
| `clients-no-prisma` | `apps/web`, `apps/admin`, `apps/mobile`, `apps/desktop` | Import of `@prisma/client`, `@ysk/db-prisma`, `apps/api/src/generated`, or `generated/prisma` |
| `clients-no-raw-fetch` | Same four client apps | `fetch(` |

Skipped: `*.test.ts` / `*.test.tsx`, comment lines, `node_modules`, `dist`, `generated`, `coverage`. Prisma schema `enum UserStatus` in `.prisma` files is not TypeScript and is not scanned.

Allowlisted raw `fetch`: `apps/admin/src/features/queues/queues-page.tsx` (Bull Board HTML probe). `@ysk/sdk` HTTP lives under `packages/sdk` and is not a client app.

Testing: [testing guide](../guides/testing.md).
