# Testing

Language: [中文](testing.zh.md) · English

Procedures for agents: [test-plan](../skills/test-plan.md) (rank cases), then [write-tests](../skills/write-tests.md) (how to write them here). UI screens also need [ui-review](../skills/ui-review.md).

## Vitest (default)

API tests inject memory ports. They do not start MySQL, Redis, Stripe, Twilio, FCM, Jaeger, or Grafana. `create-memory-input.ts` builds the same services composition uses in production.

```bash
pnpm test
pnpm test:coverage
```

Coverage is Vitest v8 over `apps/*/src`, `packages/*/src`, and the two CLI `src` trees. It excludes generated Prisma, templates, e2e, `infra/prisma-*.ts`, and process entrypoints (`main.ts`, `worker.ts`, Vite `main.tsx`). The configured gate is 95% lines, functions, statements, and branches. `pnpm test:coverage` is the report; CI `check` stays on `pnpm test` until the remaining client pages and live adapters close the gap. Unit tests stay on memory ports.

Enum literals: `pnpm --filter @ysk-kit/db-prisma test` compares Prisma schema to `@ysk-kit/contracts`.

## Testing Library

Web login has a component test for invalid email. Run with the web package Vitest task (`pnpm test` includes it). Prefer the create-command Zod schema for form fields.

## Playwright

One Chromium smoke in `apps/web/e2e`. It starts the API with `tsx` (workspace packages export TypeScript) and a Vite preview on 5173.

```bash
pnpm --filter @ysk-kit/web exec playwright install chromium
pnpm --filter @ysk-kit/web build
pnpm e2e
```

Needs free ports 3001 and 5173, a migrated database, and seed (CI does this). Locally, `reuseExistingServer` is on when `CI` is unset.

## Layers

```bash
pnpm layers
```

Must stay green. See [hexagonal](hexagonal.md).

## Agent scan

```bash
pnpm ysk-kit check agent
```

Text scan of the product root. Exit 1 on any finding.

| Rule | Meaning |
|---|---|
| `no-ts-enum` | TypeScript `enum` / `const enum` in `apps`, `packages`, or `modules` |
| `clients-no-prisma` | web / admin / mobile / desktop imported Prisma or the generated client |
| `clients-no-raw-fetch` | those apps called `fetch(` |

`*.test.ts` files, comment lines, and generated folders are skipped. The Admin Bull Board probe at `apps/admin/src/features/queues/queues-page.tsx` may use `fetch`. CLI reference: [`ysk-kit check agent`](../cli/ysk-kit.md#ysk-kit-check-agent).

Biome `style.noEnum` is `error` in `@ysk-kit/biome`, so `pnpm lint` also rejects TypeScript enums.

## CI

| Job | What it runs |
|---|---|
| `check` | `pnpm lint && pnpm layers && pnpm ysk-kit check agent && pnpm typecheck && pnpm test` |
| `pack-and-run` | `pnpm build:packages` then `.github/pack-and-run.mjs`: pack all 26 public packages, install tarballs in a clean dir, `import('@ysk-kit/<pkg>')`, CLI `--help`, in-tree php-bridge create |
| `thin-smoke` | `create-ysk-app --preset thin --flavor saas --no-admin --no-mobile --db sqlite`, then generate / layers / `ysk-kit check agent` / typecheck / test / OpenAPI |
| `flavor-smoke` | Matrix of every flavor × `thin` and `full`. sqlite. install, typecheck, test, build. pnpm store and Electron download are cached |
| `example-smoke` | Apply each worked example onto a sqlite dest |
| `e2e` | MySQL 8.4 service, migrate deploy, seed, Chromium Playwright. API via `tsx`. No Redis, Stripe, Twilio, FCM, Jaeger, Grafana |
| `Release` | Provenance via `pnpm publish --provenance`, `NPM_CONFIG_PROVENANCE=true`, and `id-token: write`. npm Trusted Publishing (OIDC) is the only credential. The job fails if that OIDC token is unavailable. After a successful publish it creates annotated `vX.Y.Z` and a GitHub Release, then verifies the published tarballs and CLI bins |

After a feature, the local bar is:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```
