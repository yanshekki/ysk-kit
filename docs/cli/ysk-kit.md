# `ysk-kit`

Language: [中文](ysk-kit.zh.md) · English

Generator binary at `tooling/ysk-cli`. Commands: `ysk-kit` and alias `yskk`. Invoke with `pnpm ysk-kit …` from the product root (or `pnpm --filter @ysk-kit/cli start …`).

```text
pnpm ysk-kit add module <kebab-name> [--prisma] [--web] [--no-web]
pnpm ysk-kit add <capability>
pnpm ysk-kit generate openapi
pnpm ysk-kit upgrade [--dry-run]
pnpm ysk-kit check agent
pnpm ysk-kit doctor [--json]
pnpm ysk-kit plan <kebab-slug> [--date YYYY-MM-DD] [--force]
pnpm ysk-kit plan --check <file>
```

Environment: `YSK_ROOT` — product root to patch. Defaults to this kit when unset.

## `ysk-kit add module`

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

## `ysk-kit add <capability>`

Merges a catalogued platform capability. Unknown names throw `unknown capability`. Alias: `org` → `team`.

| Capability | What it adds |
|---|---|
| `auth` | Session / OTP Prisma, `JWT_*`, `OTP_TTL_SECONDS`, `TWILIO_*`, `@ysk-kit/auth` |
| `rbac` | Permissions already live in `ROLE_PERMISSIONS`; no files copied |
| `audit-log` | Audit Prisma fragment |
| `storage` | FileObject fragment, `S3_*`, `@ysk-kit/storage` |
| `i18n` | `@ysk-kit/i18n` (default locale zh-HK) |
| `jobs` | `REDIS_URL`, `@ysk-kit/jobs` |
| `mail` | `SMTP_URL`, `MAIL_FROM`, `@ysk-kit/mail` |
| `notifications` | In-app notification routes |
| `llm` | `LlmUsage`, source tree + Express/Fastify/composition/SDK/web patches, `LLM_*` / `XAI_API_KEY` |
| `websocket` | `@ysk-kit/realtime`, patches `composition.ts` with `createRealtimeFromEnv` |
| `push` | Device fragment, source tree + worker patch, `EXPO_ACCESS_TOKEN`, `FCM_*` |
| `mobile` | Points at `apps/mobile` Expo template |
| `team` | Organization + Membership fragment, source tree + web and Expo org screens |
| `apikey` | ApiKey fragment |
| `crypto` | `CRYPTO_MASTER_KEY`, `@ysk-kit/crypto` |
| `billing` | Subscription fragment on Organization; **requires `team` first** |

For `llm`, `team`, `billing`, and `push`, the command copies `tooling/ysk-cli/templates/capabilities/<name>/` when the product does not already contain the skip token (`createLlmService`, `createOrganizationService`, `createBillingService`, `createDeviceService`) in `app.ts` or `composition.ts`. This repository already wires those services, so a second add is a no-op.

`ysk-kit add billing` throws if `schema.prisma` has no `model Organization`. Run `pnpm ysk-kit add team` first.

Every add merges missing Prisma fragments, `.env.example` keys, and `apps/api` workspace dependencies. It does not run `prisma migrate`.

Recipe: [add-capability](../recipes/add-capability.md).

## `ysk-kit generate openapi`

Reads the ts-rest `appContract` and writes `docs/openapi.yaml`. Equivalent: `pnpm gen:openapi`.

## `ysk-kit upgrade`

Copies **allowlisted guardrail files** from the kit checkout that contains this CLI into the product root (`YSK_ROOT`, default this repository).

```text
pnpm ysk-kit upgrade
pnpm ysk-kit upgrade --dry-run
```

| Flag | Effect |
|---|---|
| `--dry-run` | Print `will copy` / `skip` / `will write agent stubs` / `will write .ysk-kit.json` without writing files |

Overwritten paths: `AGENTS.md`, `AGENTS.zh.md`, `CLAUDE.md`, `GEMINI.md`, `.dependency-cruiser.cjs`, `packages/typescript-config/`, `packages/biome-config/`, `docs/skills/`, `docs/plans/` (template + README), `.agents/`, `.gemini/`, `.github/copilot-instructions.md`, `.github/instructions/`. Directory copies skip `node_modules` and `dist`. Missing kit paths are skipped. Workspace products also receive skill wrappers generated from `tooling/ysk-cli/templates/agent/` into `.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `.grok/skills/`, plus scoped `.cursor/rules/*.mdc` files.

Left alone: `apps/**`, `modules/**`, product DTOs, product `README.md`, `.env`, Prisma migrations, `docs/openapi.yaml`.

After a successful run, `.ysk-kit.json` `version` is set to the current kit version; `flavor`, `preset`, and `db` are kept. If the marker is missing, the command still runs when `pnpm-workspace.yaml` or `AGENTS.md` exists, then writes a marker (`unknown` for unset flavor/preset/db). Otherwise it throws and asks for a product root or `YSK_ROOT`.

Apply a newer kit by running **that kit’s** CLI:

```bash
YSK_ROOT=/path/to/your-product pnpm ysk-kit upgrade
```

Guide: [Refreshing a generated product](../guides/upgrade.md).

## `ysk-kit check agent`

Scans the product root (`YSK_ROOT`, default this repository) for typical broken patches. Text scan only: no database, no typecheck.

```text
pnpm ysk-kit check agent
```

Exit 0 prints `ysk-kit check agent: ok`. Exit 1 prints one line per finding: `rule  file:line`.

| Rule | Where | What it flags |
|---|---|---|
| `no-ts-enum` | `apps/**`, `packages/**`, `modules/**` (`.ts` / `.tsx`) | TypeScript `enum` / `const enum` |
| `clients-no-prisma` | `apps/web`, `apps/admin`, `apps/mobile`, `apps/desktop` | Import of `@prisma/client`, `@ysk-kit/db-prisma`, `apps/api/src/generated`, or `generated/prisma` |
| `clients-no-raw-fetch` | Same four client apps | `fetch(` |
| `pointer-agents-md` | `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.gemini/settings.json`, `.cursor/rules/*.mdc`, `.github/instructions/*.instructions.md`, skill `SKILL.md` copies | File exists and does not contain `AGENTS.md` |
| `skill-drift` | `.agents/skills`, `.claude/skills`, `.cursor/skills`, `.grok/skills`, and kit templates when present | A copy is missing or differs |
| `agents-md-budget` | Every `AGENTS.md` under the product root | Combined UTF-8 size exceeds 24 KiB |

Skipped: `*.test.ts` / `*.test.tsx`, comment lines, `node_modules`, `dist`, `generated`, `coverage`. Prisma schema `enum UserStatus` in `.prisma` files is not TypeScript and is not scanned.

Allowlisted raw `fetch`: `apps/admin/src/features/queues/queues-page.tsx` (Bull Board HTML probe). `@ysk-kit/sdk` HTTP lives under `packages/sdk` and is not a client app.

Testing: [testing guide](../guides/testing.md).

## `ysk-kit plan`

Writes a bilingual feature plan from [docs/plans/_template.md](../plans/_template.md).

```text
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

| Flag | Effect |
|---|---|
| `--date YYYY-MM-DD` | Calendar day in the filename. Default: today (local) |
| `--force` | Overwrite an existing dated pair |
| `--check <file>` | Exit 1 if a required heading is missing or still placeholder-only |

Creates `docs/plans/<date>-<slug>.md`, `docs/plans/<date>-<slug>.zh.md`, and a root `plan.md` pointer (gitignored). Slug must match `^[a-z][a-z0-9-]*$`. Procedure: [plan-feature](../skills/plan-feature.md). Template sections and tool plan modes: [docs/plans/README.md](../plans/README.md).

## `ysk-kit doctor`

Checks a generated product and prints a fix for each problem. `YSK_ROOT` selects the product (default: this repository). Guardrails are compared with the kit checkout that contains this CLI, the same source `upgrade` copies from.

```text
pnpm ysk-kit doctor
pnpm ysk-kit doctor --json
```

Exit 0 when every check is `ok` or `warn`. Exit 1 when any check is `error`. `--json` prints `{ ok, errors, warnings, checks }` and does not include secret values.

| Check | Error | Warning | What to do |
|---|---|---|---|
| `engines` | Node or pnpm misses `package.json` `engines`, or `pnpm` is not on `PATH` | `packageManager` pin differs from `pnpm --version`, or `engines` is absent | Install Node 24 and run `corepack enable && corepack prepare pnpm@12.9.0 --activate` |
| `env` | An API product is missing `DATABASE_URL` or `JWT_SECRET` | `static-web3` is missing `API_PUBLIC_URL` or `WEB_PUBLIC_URL`; `php-bridge` is missing `API_PUBLIC_URL` | `cp .env.example .env` and set the keys. Public URLs and the PHP bridge have localhost defaults, so those are warnings |
| `secrets` | `NODE_ENV=production` with a placeholder `JWT_SECRET`, a secret shorter than 8 characters, example seed passwords in production, or `CRYPTO_MASTER_KEY` that is not 64 hex characters | Example `JWT_SECRET` in development, a secret shorter than 32 characters, or an empty `CRYPTO_MASTER_KEY` in production | `openssl rand -base64 32` for `JWT_SECRET`. `openssl rand -hex 32` for `CRYPTO_MASTER_KEY` |
| `database` | The server is unreachable, the SQLite file is missing, or Prisma migrations are not applied | — | `pnpm db:migrate` in development, or `pnpm --filter @ysk-kit/api prisma:migrate:deploy` in production. Skipped when `apps/api/prisma/schema.prisma` is absent (`static-web3`, `php-bridge`) |
| `rules` | Allowlisted guardrail files differ from this kit | Files match and `.ysk-kit.json` is missing or its `version` is behind this kit | `pnpm ysk-kit upgrade` |
| `agent` | `check agent` reported a finding | — | Same rules as [`ysk-kit check agent`](#ysk-kit-check-agent) |

SQLite is opened with Node's `node:sqlite` (`_prisma_migrations` where `finished_at` is set and `rolled_back_at` is null). MySQL and PostgreSQL run `prisma migrate status` in `apps/api`. Connection strings are redacted in the report.

`rules` uses the same paths as `upgrade`. Workspace products also compare `.cursor/rules/*.mdc` and skill wrappers (`.agents/skills` always; other skill trees when they exist). A non-workspace product (`php-bridge`) skips this check.
