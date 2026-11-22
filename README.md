# YSK Kit

Contract-first full-stack platform for new products: shared contracts, hexagonal API, and optional web, admin, mobile, and desktop clients.

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 1.6.13 |
| **License** | MIT |
| **Company** | [YSK Limited](https://ysk.hk/) |
| **Contact** | email@ysk.hk |

Requires **Node 26** (Current) and **pnpm 12**. Agent law: [AGENTS.md](./AGENTS.md). Documentation map: [docs/README.md](docs/README.md).

This repository is the living `saas` flavor. Identity, files, notifications, jobs, mail, API keys, crypto, and realtime are already wired. Product domains stay out of the kit.

## Fifteen minutes to a product

From npm (`npm create @ysk-kit/app` or `pnpm create @ysk-kit/app`; there is no unscoped `create-ysk-app` package):

```bash
pnpm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
```

From this checkout:

```bash
pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
```

Then:

```bash
cd my-product
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm ysk-kit add module appointment --prisma --web
pnpm gen:openapi
pnpm dev
```

Default preset is **thin**: a copy of this tree with llm, billing, organizations, and push devices removed. `--preset full` keeps the living demonstration. Restore a capability with `pnpm ysk-kit add llm|team|billing|push`.

Ten finished product systems (fields, rules, screenshots) live in [examples/](examples/README.md). Apply one with `pnpm --filter @ysk-kit/examples start apply <slug> --yes`.

## Run this repository

```bash
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Surface | URL |
|---|---|
| API | http://localhost:3001 (`HTTP_ADAPTER=fastify` optional) |
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| OpenAPI UI | http://localhost:3001/docs (`GET /openapi.json`) |

After seed, sign in as `admin@ysk.hk` / `ysk-admin-dev` (see `.env.example`). If ports 3001, 5173, or 5174 are already in use, change `API_PORT` and the matching `*_PUBLIC_URL` values in `.env`.

Optional traces: `docker compose up -d jaeger`, set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`, UI http://localhost:16686. Optional metrics UI: `docker compose up -d prometheus grafana` — Prometheus http://localhost:9090, Grafana http://localhost:3000 (`admin` / `admin`).

PostgreSQL or SQLite: `create-ysk-app --db postgresql|sqlite` rewrites the Prisma provider for a new product. In this repo, change `datasource.provider` and `DATABASE_URL` yourself.

## Commands

| Command | Purpose |
|---|---|
| `pnpm ysk-kit add module <name> --prisma --web` | Hexagonal HTTP slice |
| `pnpm ysk-kit add <capability>` | Merge a catalogued capability |
| `pnpm ysk-kit upgrade` | Refresh allowlisted kit guardrails |
| `pnpm ysk-kit plan <slug>` | Write a lean English plan (`--full` / `--zh` optional) |
| `pnpm ysk-kit plan --check <file>` | Fail if a required heading is missing |
| `pnpm ysk-kit check agent` | Flag TypeScript enum, client Prisma, raw fetch, pointer drift, docs-budget |
| `pnpm ysk-kit check docs-budget` | Flag long Unreleased cells, forbidden CHANGELOG phrases, oversized lean plans, git-added QA PNGs |
| `pnpm ysk-kit check errors` | Flag plain `Error` in `application/`, API `console.log`, `process.env` logs |
| `pnpm ysk-kit check logs --file <jsonl>` | Validate captured Pino JSON (secrets, ERROR `requestId`) |
| `pnpm ysk-kit check supply [--json] [--repo-only] [--online]` | Inventory Node, PHP, lockfile, and Actions pins vs a vendored catalog |
| `pnpm create @ysk-kit/app <name>` / `npm create @ysk-kit/app <name>` | Scaffold a product from npm |
| `pnpm --filter @ysk-kit/create-app start <name>` | Scaffold a product from this checkout |
| `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors` | Verify a change |

Full tables: [CLI](docs/cli/index.md), [workspace scripts](docs/cli/workspace-scripts.md), [environment](docs/cli/env.md).

## Flavors

| Flavor | What you get |
|---|---|
| `saas` | API + web + admin + optional mobile |
| `desktop` | API + Electron |
| `gateway` | API + admin (machine API keys) |
| `php-bridge` | OpenAPI + TypeScript/PHP clients, no Node apps |
| `trading` | API + web + worker |
| `static-web3` | Vite web only |

Details: [flavors](docs/guides/flavors.md).

## Rules (short)

- `@ysk-kit/contracts` is the only source of enums, DTOs, error codes, and ts-rest routes.
- Do not use TypeScript `enum`.
- Clients talk to the API only through `@ysk-kit/sdk`.
- Prisma stays in API infra.
- JSON responses use `{ ok, data }` / `{ ok, error }` except the four documented envelope exceptions.

See [architecture](docs/architecture.md) and [AGENTS.md](./AGENTS.md).

## Changelog

The latest three versions. Older versions are in the full changelog.

### v1.6.14

#### Dependency upgrades

- turbo **2.11.13**. Expo **58.0.26**. Vitest **5.1.1**. jose **6.2.18**. nodemailer **10.6.1**. BullMQ **6.7.8**. `@bull-board/*` **9.14.0**. AWS SDK S3 **3.1175.0**. TanStack Query **5.108.2**. dependency-cruiser **18.8.0**. `source-map-js` **1.2.4**.

#### Security

- Supply catalog PHP floors **8.2.36 / 8.3.37 / 8.4.28 / 8.5.13** plus catalog-only **8.6.0** (`updated` 2026-11-22). php-bridge stays on 8.2 (`>=8.2.36`).

#### Internal/CI

- Coding-tools table: Grok Build no longer claims `GEMINI.md`. Copilot and Gemini CLI load `.agents/skills/`. Held: TypeScript 7, Prisma 8 RC, pnpm 12.22.0 (`next-12`).

### v1.6.13

#### Improvements

- CI `thin-smoke` checks the four skill routers (`plan`, `implement`, `verify`, `review`). `docs/agent/NOW.md` in-progress is empty.

#### Dependency upgrades

- Electron **45.4.1**. Biome **2.6.8**. `@testing-library/user-event` **14.6.13**. OpenTelemetry `api` **1.10.0**, `resources` / `sdk-metrics` / `sdk-trace` **3.1.1**, experimental **0.301.2**.

### v1.6.12

#### Improvements

- Lean plans by default (`pnpm ysk-kit plan <slug>`), four skill routers (`plan`, `implement`, `verify`, `review`), `ysk-kit check docs-budget`, and `docs/agent/NOW.md`. Root `AGENTS.md` is about 5 KB.

Full changelog: [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/). [linktr.ee/yanshekki](https://linktr.ee/yanshekki)
