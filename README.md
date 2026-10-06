# YSK Kit

Contract-first full-stack platform for new products: shared contracts, hexagonal API, and optional web, admin, mobile, and desktop clients.

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 1.2.0 |
| **License** | MIT |
| **Company** | [YSK Limited](https://ysk.hk/) |
| **Contact** | email@ysk.hk |

Requires **Node 24** (Active LTS) and **pnpm 12**. Agent law: [AGENTS.md](./AGENTS.md). Documentation map: [docs/README.md](docs/README.md).

This repository is the living `saas` flavor. Identity, files, notifications, jobs, mail, API keys, crypto, and realtime are already wired. Product domains stay out of the kit.

## Fifteen minutes to a product

From npm:

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
| `pnpm create @ysk-kit/app <name>` | Scaffold a product from npm |
| `pnpm --filter @ysk-kit/create-app start <name>` | Scaffold a product from this checkout |
| `pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent` | Verify a change |

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

### v1.2.1

#### New features

- `pnpm ysk-kit plan --check <file>` verifies a plan has every required template heading and fails when a required section is still placeholder-only.

#### Improvements

- The planning protocol keeps the v1.2.0 kit-specific sections and adds: explore-before-planning (**Current state and reuse** before Contracts), **Assumptions** next to Scope / Non-goals, **Options considered** (two approaches when a real alternative exists), task steps that name files / interface / contract / data / risk / rollback / acceptance, verification commands with expected results and a manual-check list, and an approval / anti-shrinking gate.
- [docs/plans/README.md](docs/plans/README.md) maps native plan modes (Grok Build, Cursor, Claude Code, Codex, OpenCode, Copilot) to this template, with a copy-paste `/plan` prompt (EN + zh). The approved plan is still `docs/plans/<date>-<slug>.md` via `pnpm ysk-kit plan <slug>`.

#### Internal/CI

- `thin-smoke` and `flavor-smoke` assert the new template headings. Generated products receive the upgraded `_template.md` pair.
- The lockstep test requires any pending changeset set to list all 26 public `@ysk-kit` packages.

### v1.2.0

#### New features

- `pnpm ysk-kit plan <slug>` writes a bilingual feature plan to `docs/plans/<yyyy-mm-dd>-<slug>.md` (and the `.zh.md` pair) from the shared template, plus a gitignored root `plan.md` pointer.
- Thin and full workspace products receive the same agent pointer set: `.agents/skills/`, `.claude/skills/`, scoped `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `.gemini/settings.json`, `GEMINI.md`, and the plan template.

#### Improvements

- `AGENTS.md` / `AGENTS.zh.md` are a professional agent guide: orientation, repo map, the ten hard rules with reasons, a mandatory understand → plan → contracts → scaffold → implement → verify → docs workflow, definition of done, ask-vs-decide, pitfalls, and a coding-tool table. Procedures stay in `docs/skills/`.
- `pnpm ysk-kit check agent` also fails when a pointer file drops `AGENTS.md`, skill copies drift, or root + nested `AGENTS.md` exceed 24 KiB.
- Skills (`docs/skills/` and `.agents/skills/`) now include `plan-feature` and use trigger / inputs / steps / verification / done criteria.

#### Security

- pnpm override `source-map-js@1.2.2` closes [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) / CVE-2026-93749 (indexed source-map offset event-loop DoS). The copy is transitive through PostCSS / Expo Metro.

#### Dependency upgrades

| Package | From | To |
|---|---|---|
| source-map-js (workspace override) | 1.2.1 | 1.2.2 |

#### Internal/CI

- `thin-smoke` and `flavor-smoke` assert the generated pointer set. `php-bridge` still skips workspace agent stubs.

### v1.1.3

#### Improvements

- The root `README.md` and `README.zh.md` list only the latest three versions. Each version is grouped into the categories that apply: New features, Improvements, Fixes, Security, Dependency upgrades, and Internal/CI. The section ends with a link to the full changelog.

#### Internal/CI

- [CHANGELOG.md](CHANGELOG.md) and [CHANGELOG.zh.md](CHANGELOG.zh.md) keep every version, newest first, in those categories. Per-package `CHANGELOG.md` files that Changesets writes stay, and the full changelog links to them.
- [Contributing](docs/contributing.md) and the release section of [workspace scripts](docs/cli/workspace-scripts.md) require each release to add the new version at the top of the README section and move the oldest of the three into the full changelog.

Full changelog: [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/). [linktr.ee/yanshekki](https://linktr.ee/yanshekki)
