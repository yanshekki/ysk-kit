# YSK Kit

Contract-first full-stack platform for new products: shared contracts, hexagonal API, and optional web, admin, mobile, and desktop clients.

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 1.2.1 |
| **License** | MIT |
| **Company** | [YSK Limited](https://ysk.hk/) |
| **Contact** | email@ysk.hk |

Requires **Node 24** (Active LTS) and **pnpm 12**. Agent law: [AGENTS.md](./AGENTS.md). Documentation map: [docs/README.md](docs/README.md).

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
| `pnpm create @ysk-kit/app <name>` / `npm create @ysk-kit/app <name>` | Scaffold a product from npm |
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

### v1.2.2

#### New features

- Agent skills `security-review`, `db-migration`, `webhook-handling`, and `desktop-electron` (English + Hong Kong Traditional Chinese), with `.agents` / `.claude` wrappers, scoped Cursor / Copilot pointers, and create-app / upgrade templates.

#### Improvements

- `add-module`, `add-capability`, `verify-change`, and `envelope-api` point at the new procedures. The plan template's data-model and security sections name Prisma expand/contract, security review, webhooks, and Electron.

#### Fixes

- Published `@ysk-kit/*` libraries emit valid Node ESM: relative imports in `dist/` include `.js` extensions, so `node` can load the tarball. Public packages inherit `module` / `moduleResolution` `NodeNext` from `tsconfig.base.json`.
- `@ysk-kit/create-app` and `@ysk-kit/cli` bins start with `#!/usr/bin/env node` and are executable, so `create-ysk-app` / `ysk-kit` / `yskk` run after install.
- Scaffold from npm is `npm create @ysk-kit/app` or `pnpm create @ysk-kit/app`. There is no unscoped `create-ysk-app` package on npm; the published package is `@ysk-kit/create-app`.
- `@ysk-kit/observability` pins OpenTelemetry SDK and exporter packages to versions that exist on npm. Caret ranges floated onto `sdk-metrics@2.12.0`, which depends on missing `resources@2.12.0`.

#### Security

- Electron no longer writes access or refresh tokens to disk in plaintext when `safeStorage` is unavailable. Tokens stay in memory for the session and the main process logs a warning that does not include the secret.
- Desktop sets a Content-Security-Policy, `sandbox: true`, and `webSecurity: true`, denies unexpected navigation and `window.open`, and rejects IPC whose sender frame is not the loaded renderer.
- `@ysk-kit/logger` redacts authorization headers, cookies, tokens, passwords, API keys, and similar fields (pino `redact`).
- `/v1/llm/complete` and `/v1/llm/stream` accept only `user` and `assistant` messages. The system prompt comes from `LLM_SYSTEM_PROMPT` (server-owned). Per-user quota is `LLM_QUOTA_MAX` / `LLM_QUOTA_WINDOW_MS` and returns envelope `RATE_LIMITED` (429).
- `POST /v1/billing/webhook` still verifies `Stripe-Signature` on the raw body, persists Stripe `event.id` on `ProcessedWebhookEvent`, acks duplicates, and ignores older events for the same organization.

#### Internal/CI

- CI job `pack-and-run` packs all 26 public packages, installs the tarballs in a clean directory, imports each, runs the CLI bins, and scaffolds a non-interactive php-bridge dest from the in-tree CLI.
- Release skips the tag step when Changesets opened or updated a version PR. After a successful publish it creates the annotated `vX.Y.Z` tag at `GITHUB_SHA`, opens a GitHub Release with that version's changelog notes, and verifies by installing the published tarballs and running the CLI bins. Publish stays OIDC Trusted Publishing only.
- `thin-smoke`, `flavor-smoke`, create-app, and upgrade tests assert the new skill files and Cursor rules.

### v1.2.1

#### New features

- `pnpm ysk-kit plan --check <file>` verifies a plan has every required template heading and fails when a required section is still placeholder-only.
- Agent skills `test-plan`, `write-tests`, `ui-design`, and `ui-review` (English + Hong Kong Traditional Chinese), with `.agents` / `.claude` wrappers and scoped Cursor / Copilot pointers so generated products get them via `create-ysk-app` and `ysk-kit upgrade`.

#### Improvements

- The planning protocol keeps the v1.2.0 kit-specific sections and adds: explore-before-planning (**Current state and reuse** before Contracts), **Assumptions** next to Scope / Non-goals, **Options considered** (two approaches when a real alternative exists), task steps that name files / interface / contract / data / risk / rollback / acceptance, verification commands with expected results and a manual-check list, and an approval / anti-shrinking gate.
- [docs/plans/README.md](docs/plans/README.md) maps native plan modes (Grok Build, Cursor, Claude Code, Codex, OpenCode, Copilot) to this template, with a copy-paste `/plan` prompt (EN + zh). The approved plan is still `docs/plans/<date>-<slug>.md` via `pnpm ysk-kit plan <slug>`.
- The plan template's Test plan section points at `test-plan` (risk-ranked given/when/then, fixtures, out of scope, layer map).
- Nested `AGENTS.md` files point API/contracts at testing skills and client apps at UI skills.
- The lockstep test requires any pending changeset set to list all 26 public `@ysk-kit` packages at one bump type.

#### Internal/CI

- `thin-smoke` and `flavor-smoke` assert the new template headings plus the testing/UI skill files and Cursor rules. Generated products receive the upgraded `_template.md` pair. create-app and upgrade tests assert the same skill files.

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

Full changelog: [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/). [linktr.ee/yanshekki](https://linktr.ee/yanshekki)
