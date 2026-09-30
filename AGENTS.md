# YSK Kit — agent law

Language: [中文](AGENTS.zh.md) · English

Read this file before changing code. Architecture: `docs/architecture.md`. How-to: `docs/recipes/`. Commands: `docs/cli/`. Procedures: `docs/skills/`. Changelog: `docs/history.md`. Roadmap: `docs/product-plan.md`.

## What this repo is

A contract-first SaaS platform (pnpm 12 + Turborepo + Node 24). Product domains stay out of the kit. This tree is the living `saas` flavor: identity, files, notifications, jobs, mail, API keys, crypto, and realtime are already wired.

## Before you invent a folder

New product:

```bash
pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
pnpm ysk add module <kebab-name> --prisma --web
```

`--preset full` copies the living demonstration (llm, billing, orgs, push already mounted). Restore a stripped capability with `pnpm ysk add llm|team|billing|push` (`billing` needs `team` first). After migrate: `pnpm db:seed` then sign in as `admin@ysk.hk` / `ysk-admin-dev` (passwords live in `.env.example`).

New HTTP feature in this repo or a generated product:

```bash
pnpm ysk add module <kebab-name> --prisma --web
```

That command writes the hexagonal slice, ts-rest contract, SDK resource, web-sdk hooks, Express + Fastify mount, composition wiring, and a memory-repo test. Fill business rules in `application/` and the Prisma model. Do not invent a parallel tree.

## Hard rules

1. `@ysk-kit/contracts` is the only source of enums, DTOs, error codes, and ts-rest paths. Add DTO + `OkSchema` / `ErrSchema` first.
2. No TypeScript `enum`. Use `as const` + Zod in contracts.
3. Prisma stays in `apps/api/src/modules/*/infra`. Clients never import `@prisma/client` or `apps/api/src/generated`.
4. Web / admin / mobile / desktop talk to the API only through `@ysk-kit/sdk` (React Query via `@ysk-kit/web-sdk`). No raw `fetch` to kit paths.
5. Domain and application layers do not import Express, Fastify, Prisma, React, or BullMQ.
6. Envelope is `{ ok: true, data }` / `{ ok: false, error }` on every JSON route.
7. Envelope exceptions only: LLM SSE (`POST /v1/llm/stream`), invoice PDF HTTP 302, `GET /docs`, `GET /openapi.json`.
8. `exactOptionalPropertyTypes` is on: omit optional keys; do not pass `undefined`.
9. Tests use in-memory ports. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana in CI.
10. Discover paths from `GET /openapi.json` or `docs/openapi.yaml`. Still call them through `@ysk-kit/sdk`.

## After every feature

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk check agent
```

`pnpm layers` must stay green (clients off Express / Prisma / jobs / mail / push / AWS SDK). `pnpm ysk check agent` must stay green (no TypeScript `enum`, no Prisma in clients, no raw `fetch` in web/admin/mobile/desktop).

## Do not

- Put salon, trading, map, or other industry domain in this kit. Worked tutorials live in `examples/` and apply onto a new destination (`pnpm --filter @ysk-kit/examples start apply <slug> --yes`).
- Import `@ysk-kit/observability` from web/admin/mobile/desktop.
- Add Hono / Drizzle / Nest / Next as a default.
- Log secrets, OTP codes, Stripe `sk_`, or webhook secrets.
