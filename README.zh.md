# YSK Kit

YSK Limited 共用全端開發架構：合約先行，可選四端（API / Web / Admin / Mobile）。

Language: [English](README.md) · 中文

呢個 repo 係 living `saas` flavor。業務 domain 唔寫入 kit。

需要 **Node 24**（Active LTS）同 **pnpm 12**。Agent 法律：[AGENTS.md](./AGENTS.md)。產品計劃：[docs/product-plan.md](./docs/product-plan.md)。

```bash
pnpm install
cp .env.example .env
docker compose up -d mysql
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- API http://localhost:3001
- Web http://localhost:5173
- Admin http://localhost:5174
- OpenAPI UI http://localhost:3001/docs
- 可選 traces：`docker compose up -d jaeger`（`jaegertracing/jaeger:2.21.0`），設 `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`，UI http://localhost:16686
- 可選 metrics：`docker compose up -d prometheus grafana` — Prometheus http://localhost:9090，Grafana http://localhost:3000（`admin` / `admin`）

```bash
pnpm ysk add module booking --prisma --web
pnpm db:migrate
pnpm gen:openapi
pnpm --filter @ysk/create-app start my-product --db mysql
```

`ysk add module` 會寫完整切片（合約、DTO、repo、Express + Fastify、SDK、web 頁）。見 [docs/recipes/add-module.md](./docs/recipes/add-module.md)。`create-ysk-app --preset thin`（預設）複製呢棵樹再剝 llm / billing / orgs / push。`--preset full` 保留 living 示範。加返能力：`pnpm ysk add llm|team|billing|push`。

`ysk add` 會 idempotent merge Prisma / `.env.example` / API workspace deps。PM2：`pnpm --filter @ysk/api build` 之後 `pm2 start ecosystem.config.cjs`。

Desktop：`pnpm --filter @ysk/create-app start my-app --flavor desktop`。

Gateway：`pnpm --filter @ysk/create-app start my-gw --flavor gateway`（只得 API + Admin；machine token 用 `POST /v1/me/api-keys`）。

PHP bridge：`pnpm --filter @ysk/create-app start my-php --flavor php-bridge`（OpenAPI + TS/PHP client，無 Node app）。

Trading：`pnpm --filter @ysk/create-app start my-aq --flavor trading`（API + Web + worker，無 admin）。

static-web3：`pnpm --filter @ysk/create-app start my-mint --flavor static-web3`（只有 Vite web，無 API）。

詳情見 [docs/architecture.md](docs/architecture.md)。
