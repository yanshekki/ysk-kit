# YSK Kit — agent guide

Language: [中文](AGENTS.zh.md) · English

This file is the **only** source of agent law. Do not copy it into tool wrappers.

**Read [docs/agent/NOW.md](docs/agent/NOW.md) first.** Procedures: [docs/skills/index.md](docs/skills/index.md). Architecture: [docs/architecture.md](docs/architecture.md). Commands: [docs/cli/](docs/cli/).

This checkout is the living `saas` flavor. Product domains stay out of the kit. New HTTP resources: `pnpm ysk-kit add module <kebab-name> --prisma --web`.

## Hard rules

1. **`@ysk-kit/contracts` is the only source** of enums, DTOs, error codes, and ts-rest paths. Add the DTO plus `OkSchema` / `ErrSchema` before handlers, SDK methods, or UI.
2. **No TypeScript `enum`.** Use `as const` + Zod in contracts.
3. **Prisma stays in `apps/api/src/modules/*/infra`** (and shared `apps/api/src/infra`). Clients never import `@prisma/client`, `@ysk-kit/db-prisma`, `apps/api/src/generated`, or `generated/prisma`.
4. **Web / admin / mobile / desktop talk to the API only through `@ysk-kit/sdk`** (React Query via `@ysk-kit/web-sdk`). No raw `fetch` to kit paths.
5. **Domain and application import neither Express, Fastify, Prisma, React, nor BullMQ.** `pnpm layers` enforces the graph.
6. **Every JSON route uses `{ ok: true, data }` / `{ ok: false, error }`.**
7. **Envelope exceptions are only:** LLM SSE (`POST /v1/llm/stream`), invoice PDF HTTP 302, `GET /docs`, `GET /openapi.json`. A new exception needs an explicit user decision and a docs update next to those four, off ts-rest.
8. **`exactOptionalPropertyTypes` is on.** Omit optional keys; do not pass `undefined`.
9. **Tests use in-memory ports.** Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana in CI.
10. **Discover paths from `GET /openapi.json` or `docs/openapi.yaml`.** Still call them through `@ysk-kit/sdk`.
11. **Plan tests with `test-plan`, then write them with `write-tests`.** Rank data loss, auth, money, concurrency, and tenancy first.
12. **Client UI follows `ui-design` and is not done until `ui-review` is green.** Complex structure goes through `layout-system` first. Reuse `@ysk-kit/ui` and the zinc theme.

## When to plan

Default is **lean**: `pnpm ysk-kit plan <slug>` writes `docs/plans/<yyyy-mm-dd>-<slug>.md` (`plan: lean`). Six sections: Decision, Files, Tests, Risks, Done, Open questions. Decision is at most 15 lines. After `/compact`, re-read only Decision. `--zh` writes the Chinese pair; the default does not.

Use **`--full`** (19-section template, `plan: full`) only for HTTP routes, Prisma models, authz, secrets, webhooks, or a new envelope exception.

Skip a plan (unless asked) for typo-only, comment-only, or one-file mechanical renames. Do not implement first and backfill when a plan is required.

## Verify

`pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors && pnpm ysk-kit check docs-budget`

Single package: `pnpm --filter <pkg> test`. Run the full chain only for cross-package work.

## Do not

- Put salon, trading, map, or other industry domain in this kit. Tutorials live in `examples/`.
- Import `@ysk-kit/observability` from web / admin / mobile / desktop.
- Add Hono / Drizzle / Nest / Next as a default.
- Copy this file into `.cursor/`, `.claude/`, `.github/`, or `GEMINI.md`.
- Log secrets, OTP codes, Stripe `sk_`, or webhook secrets.
- Search `docs/qa/**/*.png`, or `docs/plans/` older than 14 days, unless the user names them.
- Invent a `fund-protocol` file in this kit. Follow the product’s doc if that product has one.
