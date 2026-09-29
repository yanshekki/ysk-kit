# YSK Kit

YSK Limited 共用全端開發架構：合約先行、四端可選（API / Web / Admin / Mobile）。

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 0.1.0 |
| **License** | MIT |
| **Company** | [YSK Limited](https://ysk.hk/) |
| **Contact** | email@ysk.hk |

## What this is

A pnpm + Turborepo platform so a new product does not reinvent enums, DTOs, error codes, a typed HTTP client, UI rules without sharing DOM, Express + Prisma API, Vite web/admin, or Expo React Native.

Product domains stay out of this repo. This tree is the living `saas` flavor.

Requires **Node 24** (Active LTS) and **pnpm 12**. Agent law: [AGENTS.md](./AGENTS.md). Product plan: [docs/product-plan.md](./docs/product-plan.md).

## Quick start

```bash
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- API http://localhost:3001 (`HTTP_ADAPTER=fastify` optional)
- Web http://localhost:5173
- Admin http://localhost:5174
- OpenAPI UI http://localhost:3001/docs (`GET /openapi.json`)
- Optional traces: `docker compose up -d jaeger` (`jaegertracing/jaeger:2.21.0`), set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`, UI http://localhost:16686
- Optional metrics UI: `docker compose up -d prometheus grafana` — Prometheus http://localhost:9090, Grafana http://localhost:3000 (`admin` / `admin`)

PostgreSQL or SQLite: change `datasource.provider` in `apps/api/prisma/schema.prisma` and `DATABASE_URL`. `create-ysk-app --db postgresql` does this for a new product.

## DX

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm layers
pnpm db:migrate
pnpm db:studio
pnpm gen:openapi
pnpm gen:module booking
pnpm changeset
pnpm build:packages
```

Publishable libraries use GitHub Packages (`@ysk` scope, restricted). On `main`, the Release workflow versions with changesets and publishes. Consuming a published package from another repo:

```
@ysk:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

The GitHub owner/org should match `@ysk`. This workspace keeps `main` on TypeScript source; `publishConfig` points at `dist`.

```bash
pnpm ysk add module booking --prisma --web
pnpm db:migrate
pnpm gen:openapi
pnpm --filter @ysk/create-app start my-product --db mysql
```

`ysk add module` writes a complete slice (contract, DTO, repos, Express + Fastify, SDK, web page). See [docs/recipes/add-module.md](./docs/recipes/add-module.md). `create-ysk-app` copies this living saas tree; `--preset thin` is later (product-plan wave 2).

`ysk add <capability>` merges Prisma fragments, `.env.example` keys, and `apps/api` workspace deps when missing. A second run is a no-op. `ysk add module` also puts the contract on `appContract` and registers routes when `app.ts` / `composition.ts` exist. Then `pnpm db:migrate`.

Production process manager:

```bash
pnpm --filter @ysk/api build
pm2 start ecosystem.config.cjs
```

API default is one PM2 instance (`RUN_WORKERS=0`). Raise instances only when `REDIS_URL` is set so the Socket.IO Redis adapter is on. The worker is a second app.

Machine API keys: `POST /v1/me/api-keys` then `Authorization: Bearer ysk_live_…`. The secret is returned once. AES-256-GCM is `@ysk/crypto` (`CRYPTO_MASTER_KEY`).

`create-ysk-app` supports `--flavor saas`, `--flavor desktop`, `--flavor gateway`, `--flavor php-bridge`, `--flavor trading`, and `--flavor static-web3` (Vite web only, no API). Auth is on by default (register / login / OTP / refresh). Desktop talks to the API via `@ysk/sdk` (`pnpm --filter @ysk/desktop start`). Tokens use Electron `safeStorage` when available.

```bash
pnpm worker          # BullMQ worker (needs REDIS_URL)
pnpm ysk add jobs
pnpm ysk add mail
pnpm ysk add notifications
```

Forgot password: `POST /v1/auth/forgot` always returns 200. Reset tokens travel in the mail body, not in server logs. Web `/reset` strips `?token=` from the URL after reading it.

LLM (SpaceXAI-compatible): set `XAI_API_KEY` or `LLM_API_KEY`. Without a key, the API uses a fake model (`pong`) outside production. Stream is `POST /v1/llm/stream` (SSE). Live inbox: `RUN_WORKERS=1` (in-process) **or** `REDIS_URL` plus `pnpm worker` / PM2 worker so `notification.created` reaches Socket.IO rooms.

```bash
pnpm ysk add auth
pnpm ysk add rbac
pnpm ysk add push
pnpm ysk add mobile
pnpm ysk add team
```

Push tokens are Expo `ExponentPushToken[...]` in the mobile template. Invite links use `WEB_PUBLIC_URL/invite?token=`.

## Rules

- `@ysk/contracts` is the only source of enums, DTOs, error codes, and ts-rest routes.
- Do not use TypeScript `enum`.
- web / admin / mobile talk to the API only through `@ysk/sdk` (React Query hooks in `@ysk/web-sdk`).
- `@ysk/ui-logic` and `@ysk/sdk` stay DOM-free / React-free.
- Prisma stays in API infra.
- Prisma enum literals must match contracts string unions (`pnpm --filter @ysk/db-prisma test`).

See [docs/architecture.md](docs/architecture.md).
