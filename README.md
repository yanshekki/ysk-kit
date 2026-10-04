# YSK Kit

Contract-first full-stack platform for new products: shared contracts, hexagonal API, and optional web, admin, mobile, and desktop clients.

Language: [中文](README.zh.md) · English

| | |
|---|---|
| **Version** | 1.1.3 |
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
| `pnpm ysk-kit check agent` | Flag TypeScript enum, client Prisma, raw fetch |
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

### v1.1.3

#### Improvements

- The root `README.md` and `README.zh.md` list only the latest three versions. Each version is grouped into the categories that apply: New features, Improvements, Fixes, Security, Dependency upgrades, and Internal/CI. The section ends with a link to the full changelog.

#### Internal/CI

- [CHANGELOG.md](CHANGELOG.md) and [CHANGELOG.zh.md](CHANGELOG.zh.md) keep every version, newest first, in those categories. Per-package `CHANGELOG.md` files that Changesets writes stay, and the full changelog links to them.
- [Contributing](docs/contributing.md) and the release section of [workspace scripts](docs/cli/workspace-scripts.md) require each release to add the new version at the top of the README section and move the oldest of the three into the full changelog.

### v1.1.2

#### Security

- npm publish uses Trusted Publishing only. The release workflow keeps `id-token: write` and provenance, and does not pass a static npm credential.
- `actions/setup-node` does not receive `registry-url` or `scope`, so it does not write a registry auth line that would override OIDC.
- `.github/publish-packages.mjs` exits when the GitHub OIDC token is unavailable.

#### Internal/CI

- Post-publish `npm view` verification stays.
- The product release remains one annotated tag `vX.Y.Z`.

### v1.1.1

#### Improvements

- `ysk-kit doctor` quotes the product's `packageManager` pin in the engines fix.
- `pnpm version:packages` copies `@ysk-kit/create-app`'s version into the root `package.json` and into the version cells in `README.md` and `README.zh.md`.

#### Security

- Overrides stay on `deepmerge-ts` 8.0.2, `mariadb` 3.4.7 (the Prisma adapter declares 3.4.5), and `mysql2` 3.24.5.
- Accepted, with no patched npm release: uuid 7 via Expo `xcode` (GHSA-w5hq-g745-h8pq), node-forge 1.4.0 via Expo CLI code signing (GHSA-86w9-cpqp-85rv), and braces 3.0.3 via Metro's file map (GHSA-vfj7-8cjw-p6xm).

#### Dependency upgrades

- pnpm 12.9.0 (the 12.9.0 `pnpm login` redirect no longer forwards credentials; 12.9.1 was still inside the 24-hour release-age window), Turborepo 2.11.7, pino 10.4.0, `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` 3.1146.0, `@tanstack/react-query` 5.104.1, supertest 7.3.1, and `@types/node` 24.19.1.
- Held: TypeScript 7.0.2, `@types/node` 26 (engines are Node 24), Prisma 8.0.0-rc.19, desktop Vite 7.3.6 with `@vitejs/plugin-react` 5 (electron-vite 5 peers Vite 5–7), Expo 57.0.26 / React Native 0.86.3 / React 19.2.8 (Expo SDK 58 targets React Native 0.88, which is still a release candidate), and `@ts-rest/core` 3.53.0-rc.1.
- `prom-client` 15.1.3 stays until `@prometheus-io/client` replaces the `/metrics` registry. Compose images stay MySQL 8.4, Redis 8.10.2, Jaeger 2.21.0, Prometheus v3.15.0, and Grafana 13.2.3. Actions stay on their commit SHAs.

#### Internal/CI

- The release job fails unless `npm view` sees each published version. `pnpm release:publish` runs `pnpm publish --provenance` (commit `817e0f0`, after the v1.1.0 tag and before v1.1.1).

Full changelog: [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Ki (yanshekki)** — [YSK Limited](https://ysk.hk/). [linktr.ee/yanshekki](https://linktr.ee/yanshekki)
