# Getting started

Language: [中文](getting-started.zh.md) · English

Two paths: run this repository, or scaffold a new product. Both need **Node 24** and **pnpm 12**.

## Path A — this repository (living `saas`)

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
| API | http://localhost:3001 |
| Web | http://localhost:5173 |
| Admin | http://localhost:5174 |
| Scalar | http://localhost:3001/docs |

Sign in as `admin@ysk.hk` / `ysk-admin-dev`. A second account `user@ysk.hk` / `ysk-user-dev` is also upserted. Passwords are in `.env.example`.

Fastify: set `HTTP_ADAPTER=fastify` in `.env` and restart the API.

## Path B — a new product (thin, fifteen minutes)

On a TTY you may omit the flags; the command prompts for flavor, preset, and database. Flags and `--yes` skip prompts.

From npm (`@ysk-kit/create-app` 1.0.0):

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

Thin has identity, files, notifications, jobs, mail, API keys, crypto, and realtime. It does not ship llm, billing, organizations, or push devices. Add them later with `pnpm ysk-kit add …`. Full copy: `--preset full`.

The product root contains `.ysk-kit.json` (kit version, flavor, preset, database). Refresh kit guardrails later with `pnpm ysk-kit upgrade` from a kit checkout — see [Refreshing a generated product](upgrade.md).

## Path C — a worked system

Follow a finished product instead of an empty `title` / `body` module. Ten systems are in the [examples catalogue](../../examples/README.md). The applicator scaffolds a thin destination, adds the listed modules and capabilities, copies the overlay, seeds, and verifies. Clinic booking is the shortest walk:

```bash
pnpm --filter @ysk-kit/examples start apply clinic-booking --dest ~/Projects/my-clinic --yes
cd ~/Projects/my-clinic
pnpm dev
```

Sign in as `user@ysk.hk` / `ysk-user-dev`, then open `/appointment`. Tutorial, screenshots, and expected envelopes: [Clinic booking](../../examples/clinic-booking/tutorial.md). Catalogue of ten systems: [examples/README.md](../../examples/README.md).

## Ports already in use

Default ports are API **3001**, web **5173**, admin **5174**. If another process holds them:

1. Change `API_PORT` in `.env`.
2. Keep `API_PUBLIC_URL`, `WEB_PUBLIC_URL`, and `ADMIN_PUBLIC_URL` in sync with the ports you actually listen on.
3. Restart `pnpm dev`.

Playwright (`pnpm e2e`) expects 3001 and 5173. Point `WEB_PUBLIC_URL` at the web origin if you change it.

## Optional Compose services

```bash
docker compose up -d redis          # BullMQ + Socket.IO adapter
docker compose up -d jaeger         # traces UI http://localhost:16686
docker compose up -d prometheus grafana
```

Jaeger does nothing until `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`. Grafana: http://localhost:3000 (`admin` / `admin`). Prometheus: http://localhost:9090.

## Next reading

- [Hexagonal layers](hexagonal.md) — where to put code
- [Add a module](../recipes/add-module.md)
- [Worked examples](../../examples/README.md)
- [CLI](../cli/index.md)
- [Refreshing a generated product](upgrade.md)
- [Deploy](deploy.md)
