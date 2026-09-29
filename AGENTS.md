# YSK Kit — agent law

Read this file before changing code. History lives in `docs/history.md`. Product roadmap: `docs/product-plan.md`. Architecture law: `docs/architecture.md`. Add-module recipe: `docs/recipes/add-module.md`.

## What this repo is

A contract-first SaaS platform (pnpm 12 + Turborepo + Node 24). Product domains stay out of the kit. The living tree is the `saas` flavor.

## Before you invent a folder

New product:

```bash
pnpm --filter @ysk/create-app start my-product --preset thin --db mysql --flavor saas
pnpm ysk add module <kebab-name> --prisma --web
```

`--preset full` copies the living demo (llm, billing, orgs, push already mounted). Restore a stripped capability with `pnpm ysk add llm|team|billing|push` (`billing` needs `team` first). After migrate: `pnpm db:seed` then sign in as `admin@ysk.hk` / `ysk-admin-dev` (passwords live in `.env.example`). Local browser smoke (ports 3001/5173 free): `pnpm --filter @ysk/web exec playwright install chromium && pnpm --filter @ysk/api build && pnpm --filter @ysk/web build && pnpm e2e`.

New HTTP feature in this repo or a generated product:

```bash
pnpm ysk add module <kebab-name> --prisma --web
```

That command writes the hexagonal slice, ts-rest contract, SDK resource, web-sdk hooks, Express + Fastify mount, composition wiring, and a memory-repo test. Fill business rules in `application/` and the Prisma model. Do not invent a parallel tree.

## Hard rules

1. `@ysk/contracts` is the only source of enums, DTOs, error codes, and ts-rest paths. Add DTO + `OkSchema` / `ErrSchema` first.
2. No TypeScript `enum`. Use `as const` + Zod in contracts.
3. Prisma stays in `apps/api/src/modules/*/infra`. Clients never import `@prisma/client` or `apps/api/src/generated`.
4. Web / admin / mobile / desktop talk to the API only through `@ysk/sdk` (React Query via `@ysk/web-sdk`). No raw `fetch` to kit paths.
5. Domain and application layers do not import Express, Fastify, Prisma, React, or BullMQ.
6. Envelope is `{ ok: true, data }` / `{ ok: false, error }` on every JSON route.
7. Envelope exceptions only: LLM SSE (`POST /v1/llm/stream`), invoice PDF HTTP 302, `GET /docs`, `GET /openapi.json`.
8. `exactOptionalPropertyTypes` is on: omit optional keys; do not pass `undefined`.
9. Tests use in-memory ports. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana in CI.
10. Discover paths from `GET /openapi.json` or `docs/openapi.yaml`. Still call them through `@ysk/sdk`.

## After every feature

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi
```

`pnpm layers` must stay green (clients off Express / Prisma / jobs / mail / push / AWS SDK).

## Do not

- Put salon, trading, map, or other industry domain in this kit.
- Import `@ysk/observability` from web/admin/mobile/desktop.
- Add Hono / Drizzle / Nest / Next as a default.
- Log secrets, OTP codes, Stripe `sk_`, or webhook secrets.
