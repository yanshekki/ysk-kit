# Architecture

Language: [中文](architecture.zh.md) · English

YSK Kit is a contract-first platform so a new product writes business rules instead of rebuilding frontend, backend, database, and mobile skeletons. This repository is the living `saas` flavor: a runnable reference with identity, files, notifications, jobs, mail, API keys, crypto, and realtime already wired. Product domains stay out of the kit.

Agent law: [AGENTS.md](../AGENTS.md). Guides expand the topics summarised here. Version changelog: [CHANGELOG.md](../CHANGELOG.md). Phase diary: [history.md](history.md).

## Principles

1. **Contracts are the only source of truth** for enums, DTOs, error codes, and API paths (`@ysk-kit/contracts`).
2. **The business core does not know Express, Prisma, or React.** Domain and application depend on ports.
3. **No downward imports.** Domain does not import infra. Contracts do not import apps.
4. **REST + OpenAPI by default**, so browsers, phones, partners, and agents share one HTTP surface.
5. **Capabilities are optional.** Auth, jobs, and billing are not required in every product.
6. **Copy business code is forbidden; copy skeleton with generators.** Use `ysk-kit add module` and `create-ysk-app`.

## Current stack

| Layer | Default | Alternative |
|---|---|---|
| Monorepo | pnpm 12.9.0 workspaces + Turborepo 2.11.7 | — |
| Language | TypeScript 6.0.3 `strict` + `exactOptionalPropertyTypes` | TypeScript 7 when dependency-cruiser supports that compiler API |
| Web / admin | Vite 8.3 + React 19.2 + TanStack Router + TanStack Query + Tailwind CSS 4 | Next.js only if a product needs SSR |
| Desktop | Electron 44 + electron-vite 5 + Vite 7 | Vite 8 when stable electron-vite peers it (6 is still beta) |
| Mobile | Expo 57 / React Native 0.86 / React 19.2 | — |
| HTTP API | Express 5 adapter (default) | Fastify 5 via `HTTP_ADAPTER=fastify` |
| Contract | ts-rest + Zod 4 | — |
| Database | Prisma 7.10 (`prisma-client` generator, MariaDB adapter, client at `apps/api/src/generated/prisma`) | PostgreSQL or SQLite adapters via `--db` |
| Queue / cache | Redis 8.10 + BullMQ; in-memory queue when `REDIS_URL` is unset | — |
| Auth | JWT + refresh behind `IAuthPort`; email/password and `+852` OTP | Twilio Messages REST when `TWILIO_*` are set |
| UI | `@ysk-kit/ui` (AppShell, PageHeader, EmptyState, ErrorBanner, FormField, Spinner, Can) | — |
| Logger | Pino (JSON in production) | — |
| Lint | Biome 2.5 | — |
| Test | Vitest 5.0, Testing Library, one Playwright Chromium smoke | — |
| Docs | ts-rest → OpenAPI → Scalar at `GET /docs` | — |
| Runtime | Node 24 LTS | — |
| Observability | Prometheus `GET /metrics`; optional OTLP traces/metrics; optional Jaeger / Grafana in Compose | — |

Prisma is the default ORM because of migrations, Studio, nested writes, and hiring. Domain still talks to an `IRepository` port — never `import { prisma }` from application code. Drizzle is not shipped. tRPC is not the default; public HTTP, webhooks, and non-TypeScript clients need REST.

## Repository layout

```
ysk-kit/
├── AGENTS.md
├── .agents/skills/   shared agent skill wrappers
├── docs/plans/       durable feature plans
├── apps/
│   ├── api/          Express 5 default; HTTP_ADAPTER=fastify
│   ├── web/          Vite 8
│   ├── admin/        Vite 8
│   ├── mobile/       Expo 57
│   └── desktop/      Electron 44 + Vite 7
├── packages/         @ysk-kit/* libraries (contracts, sdk, ui, jobs, …)
├── modules/          Prisma fragments and the notes-shaped generator example
├── tooling/
│   ├── create-ysk-app/
│   └── ysk-cli/
└── docs/
```

A generated product adds its own bounded context under `apps/api/src/modules/<name>/` and `apps/web/src/features/<name>/`. Kit Prisma tables are unprefixed.

### Packages

| Package | Role |
|---|---|
| `@ysk-kit/contracts` | Enums, DTOs, error codes, ts-rest routers, mail templates |
| `@ysk-kit/domain-kernel` | Shared domain primitives |
| `@ysk-kit/application` | Pagination helpers (`parsePageQuery`, `slicePage`) |
| `@ysk-kit/api-http` | Framework-free `HttpHandler`, envelope helpers, OpenAPI flatten, rate limit, security headers |
| `@ysk-kit/api-express` / `@ysk-kit/api-fastify` | HTTP adapters |
| `@ysk-kit/sdk` / `@ysk-kit/web-sdk` | Typed client and React Query hooks |
| `@ysk-kit/ui` / `@ysk-kit/ui-logic` | DOM components; DOM-free view rules |
| `@ysk-kit/auth` / `@ysk-kit/apikey` / `@ysk-kit/crypto` | Passwords, JWT, hashed API keys, AES-256-GCM |
| `@ysk-kit/jobs` / `@ysk-kit/mail` / `@ysk-kit/storage` / `@ysk-kit/i18n` | Queue, mail port, presign, dictionaries |
| `@ysk-kit/llm` / `@ysk-kit/push` / `@ysk-kit/realtime` | Chat Completions, device push, Socket.IO |
| `@ysk-kit/logger` / `@ysk-kit/observability` / `@ysk-kit/config` | Pino, OTel, env |
| `@ysk-kit/db-prisma` | Enum-drift tests against Prisma schema |

Publishable libraries emit `dist/` and set `publishConfig` for npmjs (`@ysk-kit` scope). The workspace resolves TypeScript source.

## Layers

```
apps/web  ──►  @ysk-kit/web-sdk  ──►  @ysk-kit/contracts
                                      ▲
apps/api (HTTP adapter) ──────────────┤
      │                               │
      ▼                               │
 application / use-cases ─────────────┤
      │                               │
      ▼                               │
 domain (entities, ports) ────────────┘
      ▲
      │ implements
 infra (prisma, redis, s3, mail)
```

- `domain` may import `@ysk-kit/domain-kernel` and `@ysk-kit/contracts` only.
- `application` may import domain and contracts only.
- `infra` implements ports. HTTP handlers map transport to use-cases; they do not hold Prisma.
- `apps/web` must not import Prisma, Express, Fastify, `@ysk-kit/auth`, jobs, mail, push, or AWS SDK.
- `apps/api` must not import React or `@ysk-kit/ui`.
- `pnpm layers` (dependency-cruiser) enforces this. Walkthrough: [hexagonal guide](guides/hexagonal.md).

Identity is the reference module: `apps/api/src/modules/identity/{domain,application,infra}`.

## Enums, DTOs, commands

Do not use TypeScript `enum`. One set of literals in contracts, mirrored in Prisma:

```ts
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
```

Keep three shapes separate:

| Shape | Where | Example |
|---|---|---|
| Wire DTO | `@ysk-kit/contracts` | `UserDtoSchema` |
| Command | `@ysk-kit/contracts` | `CreateUserCommandSchema` |
| Domain entity | module `domain/` | `User` with behaviour |

`pnpm --filter @ysk-kit/db-prisma test` fails when Prisma enum literals drift from contracts.

## Envelope

Every JSON route returns `{ ok: true, data }` or `{ ok: false, error }`, including single resources. Pagination lives inside `data`. Helpers: `OkSchema` / `ErrSchema` in `@ysk-kit/contracts`.

Exceptions (and only these):

| Path | Transport | Why |
|---|---|---|
| `POST /v1/llm/stream` | SSE (`event: delta\|done`) | Token stream |
| `GET /v1/billing/invoices/:id/pdf` | HTTP 302 | Stripe hosted PDF |
| `GET /docs` | HTML | Scalar UI |
| `GET /openapi.json` | OpenAPI document | Machine discovery |

Details: [envelope guide](guides/envelope.md).

## HTTP adapters

Handlers are framework-free maps in `@ysk-kit/api-http`. Express 5 is the default. Fastify 5 serves the same contracts when `HTTP_ADAPTER=fastify`. LLM SSE and local file PUT exist on both. Composition (`apps/api/src/composition.ts`) is the only place that `new`s adapters.

## Clients

Web and admin use TanStack Router and `features/*`. Forms reuse command Zod schemas. Permissions use contracts `Permission` plus `@ysk-kit/ui` `<Can>`. AppShell is `{ brand, nav, trailing?, children }`.

Mobile is Expo (login, home, inbox, organisation list, invite, `DevicePort`, `FilePickerPort`). Desktop talks to the API through `@ysk-kit/sdk` with `platform: desktop`; tokens use Electron `safeStorage` when available. Prisma never runs inside Electron.

## Generators

| Command | Effect |
|---|---|
| `create-ysk-app` | Copy this tree (or php-bridge templates), apply flavor and `--preset`, write `.ysk-kit.json`. TTY prompts for omitted flags; `--yes` skips prompts |
| `ysk-kit add module` | One hexagonal HTTP slice |
| `ysk-kit add <capability>` | Merge Prisma, env, deps; copy source for llm / team / billing / push when missing |
| `ysk-kit generate openapi` | Write `docs/openapi.yaml` |
| `ysk-kit upgrade` | Copy allowlisted guardrails (law, skills, TypeScript/Biome config, `pnpm layers`) from this kit into a product |
| `ysk-kit check agent` | Flag TypeScript `enum`, Prisma in clients, and raw `fetch` in web/admin/mobile/desktop |
| `ysk-kit doctor` | Engines, required env, insecure defaults, database migrations, guardrail drift, and `check agent` |

`--preset thin` (default) copies then strips llm, billing, organizations, and devices. `--preset full` keeps the living demonstration. `php-bridge` and `static-web3` ignore preset. Products refresh kit guardrails with `ysk-kit upgrade`; they do not install `@ysk-kit/*` from a registry in the daily path. Manuals: [CLI](cli/index.md), [flavors](guides/flavors.md), [capabilities](guides/capabilities.md), [upgrade](guides/upgrade.md).

## Product scope

These are product decisions, not unfinished homework:

- Default HTTP is Express; Fastify is the second adapter. Hono, Nest, and Next are not defaults.
- Default ORM is Prisma. Drizzle is not shipped.
- Public API is ts-rest + OpenAPI. The pin and the v2 exit are recorded in [ADR 0001](adr/0001-ts-rest.md). tRPC and GraphQL are not defaults.
- Industry domains live in product repositories.
- CI uses in-memory ports. It does not start Redis, Stripe, Twilio, FCM, Jaeger, Grafana, or an OTLP collector.
- Kit tables have no `ysk_` prefix.
- Transactions, when a product needs them, wrap Prisma `$transaction` in API infra. `@ysk-kit/application` ships pagination helpers, not a unit-of-work port.
