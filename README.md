# YSK Kit

Contract-first full-stack platform for new products: shared contracts, hexagonal API, and optional web, admin, mobile, and desktop clients.

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 1.6.3 |
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
| `pnpm ysk-kit plan <slug>` | Write `docs/plans/<yyyy-mm-dd>-<slug>.md` from the template |
| `pnpm ysk-kit plan --check <file>` | Fail if a plan is missing headings or still placeholders |
| `pnpm ysk-kit check agent` | Flag TypeScript enum, client Prisma, raw fetch, pointer drift |
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

### v1.6.4

#### Security

- `ysk-kit check supply` inventories Node, PHP, kernel, lockfile IOCs, GitHub Actions SHAs, and compose tags against a vendored catalog (Oct 2026 php2shell + Node Brotli floors). Skill [supply-scan](docs/skills/supply-scan.md). No Trivy.
- `engines.node` is `>=26.12.1`. php-bridge `require.php` is `>=8.2.35`. Override `launch-editor` 2.14.2.

#### Internal/CI

- CI `check` runs `pnpm ysk-kit check supply --repo-only --online` instead of raw `pnpm audit`. Doctor check id `supply`.

### v1.6.3

#### New features

- Skill [i18n-localize](docs/skills/i18n-localize.md): `@ysk-kit/i18n` (`zh-HK` | `en`), envelope codes stay English-stable, `Intl` formats. App wiring is out of this release.

#### Improvements

- `AGENTS.md` coding-tools table: OpenCode Claude fallback, Gemini Agent Skills, Copilot/Grok skill paths.

#### Dependency upgrades

- pnpm **12.14.0**, turbo **2.11.9**, React **19.3.1**, Prisma **7.10.1** (not 8 RC), BullMQ **6.3.16**, Electron **44.9.0**, Expo **58.0.14**. Held: TypeScript 6, Prisma 8 RC, Electron 45 beta.

#### Internal/CI

- `.nvmrc` **26**. Compose/CI MySQL **8.4.11**.

### v1.6.2

#### New features

- HTTP adapters log INTERNAL / 5xx as structured Pino ERROR (`requestId` + `error.code`). Bounded `ysk_http_errors_total`. `ysk-kit check errors` / `check logs`. Skill [error-log-review](docs/skills/error-log-review.md).

#### Fixes

- Error middleware no longer skips `logger.error`. The SDK copies envelope `requestId` onto `AppError`.

Full changelog: [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/). [linktr.ee/yanshekki](https://linktr.ee/yanshekki)
