# YSK Kit — 實作史

Living saas kit 由 Phase 1 去到而家。現行法律喺 [architecture.md](./architecture.md)；產品方向喺 [product-plan.md](./product-plan.md)。呢份檔只記已經落地嘅波，唔再當 agent 必讀。

**Phase 1:** pnpm + turbo + Biome, `@ysk/contracts` (Zod 4 + ts-rest), envelope `{ok,data}/{ok,error}`, domain-kernel, Express 5 adapter + composition root, Prisma MySQL, Vite web/admin, Expo mobile skeleton, `@ysk/sdk` + `@ysk/web-sdk`, `@ysk/ui-logic`, `ysk add module`, `create-ysk-app --flavor saas`, CI, Docker Compose, dependency-cruiser, enum-drift.

**Phase 2:** JWT + refresh sessions, email register/login, `+852` OTP (dev logger sender), RBAC `ROLE_PERMISSIONS`, audit log, `/ready` + `/metrics`, local file presign, `@ysk/i18n`, web/admin login. Users API requires a session.

**Phase 3:** BullMQ jobs (`@ysk/jobs`, memory in tests), mail port (log + SMTP), welcome + password-reset mail, in-app notifications, S3-compatible storage when `S3_*` is set, `pnpm worker`.

**Phase 4:** `@ysk/llm` OpenAI-compatible client (SpaceXAI / `https://api.x.ai/v1`, model `grok-4.7`) + `LlmUsage` table; `POST /v1/llm/complete` envelope; `POST /v1/llm/stream` SSE (the first non-envelope response); Socket.IO realtime + `notification.created`.

**Phase 5:** `@ysk/push` (log + Expo Push API), `Device` + `/v1/me/devices`, `push.send` after `notification.create`, SDK `DevicePort`/`FilePickerPort`, mobile login/home/inbox template + EAS. Expo Go tokens work; raw FCM needs a dev build.

**Phase 6:** Organization + Membership + email invite (`OrgRole` OWNER/ADMIN/MEMBER, platform `User.role` stays global). `POST /v1/users/:id/suspend`. No `organizationId` on files/notifications/devices. Invite tokens hashed; `/invite` strips `?token=` like reset.

**Phase 7:** `ysk add` is idempotent merge (Prisma fragment, User fields, `.env.example`, `apps/api` workspace deps, team composition/app patches). `ysk add module` wires `appContract` + `registerXRoutes`. Living saas detects already-applied. PM2 `ecosystem.config.cjs` runs API (`RUN_WORKERS=0`, 1 instance) and worker.

**Phase 8:** Socket.IO Redis adapter (`@socket.io/redis-adapter`, key `ysk-socket.io`) on the API when `REDIS_URL` is set; standalone worker emits via `@socket.io/redis-emitter`. Live inbox works across API forks and `pnpm worker`. Without Redis, in-process workers still use the in-memory adapter. PM2 API default remains 1 instance; raise only with Redis.

**Phase 9:** `apps/desktop` Electron + Vite template (`platform: desktop`, `safeStorage` TokenStore, login/home/inbox pull). `create-ysk-app --flavor desktop` keeps api+desktop, skips web/admin/mobile. Prisma stays in the API (sqlite localhost counts as local). No Electron-side Prisma.

**Phase 10:** Framework-free `HttpHandler` maps in `@ysk/api-http`. `@ysk/api-fastify` serves the same contracts (`HTTP_ADAPTER=fastify`). Express 5 remains default. LLM SSE and local PUT exist on both adapters.

**Phase 11:** `@ysk/crypto` AES-256-GCM; `@ysk/apikey` hashed `ysk_live_` tokens with per-key `Permission` lists. `POST/GET/DELETE /v1/me/api-keys`. Machine Bearer cannot mint keys. JWT sessions unchanged.

**Phase 12:** Public `@ysk/*` libraries emit `dist/` and set `publishConfig` for GitHub Packages. Changesets ignore apps. Release workflow on `main` (does not publish from local verify). Workspace still resolves TypeScript source.

**Phase 13:** `create-ysk-app --flavor gateway` copies api + admin (queue + apikey already in saas), skips web/mobile/desktop. Living kit unchanged.

**Phase 14:** `create-ysk-app --flavor php-bridge` writes OpenAPI + envelope-aware TS/PHP clients (no Node apps). Remaining routes via generic `request()`.

**Phase 15:** `create-ysk-app --flavor trading` copies api + web, skips admin/mobile/desktop. Worker is the existing BullMQ process. No exchange connectors.

**Phase 16:** `create-ysk-app --flavor static-web3` copies web only (no API). Optional remote `API_PUBLIC_URL`. No viem/wagmi in the kit.

**Phase 17:** Web/admin on Vite 8 (Rolldown). Mobile on Expo 57 / RN 0.86 / React 19.2. Desktop Vite 7 (electron-vite peers at the time).

**Phase 18:** Admin email OTP (`POST /v1/auth/admin/otp/request|verify`) for existing ACTIVE ADMIN only. Password login remains. Phone OTP unchanged. Twilio out.

**Phase 19:** Twilio `IOtpSender` via Messages REST API. `TWILIO_*` required in production; dev keeps the log sender. Adapter does not log the OTP code.

**Phase 20:** FCM HTTP v1 for non-Expo device tokens when `FCM_*` is set. Expo Push API unchanged. `UNREGISTERED` / `NOT_FOUND` → `invalid-token`. No firebase-admin.

**Phase 21:** Billing stub — `BILLING_PLANS` free/pro, `Subscription` table, log `IBillingPort`, `GET/POST /v1/billing/*`. No Stripe. `ysk add billing`.

**Phase 22:** Bull Board at `/admin/queues` when BullMQ is on (ADMIN JWT). Memory queue has no board. Express only.

**Phase 23:** Optional OpenTelemetry traces via `OTEL_EXPORTER_OTLP_ENDPOINT` (OTLP HTTP, `service.name` default `ysk-api`). HTTP auto-instrumentation when enabled. pino + Prometheus `/metrics` unchanged.

**Phase 24:** Stripe Checkout adapter when `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO` are set (pending until `POST /v1/billing/webhook`). Log adapter still activates immediately. No stripe SDK.

**Phase 25:** `POST /v1/billing/portal`. Stores `Subscription.stripeCustomerId` from Checkout webhook. Stripe adapter requires a customer (409 otherwise). Log adapter returns a stub URL.

**Phase 26:** `GET /v1/billing/invoices` from Stripe when a customer id exists; otherwise `[]`. No PDF download.

**Phase 27:** `GET /v1/billing/invoices/:id/pdf` 302 to Stripe `invoice_pdf` after customer ownership check. Envelope exception (with LLM SSE).

**Phase 28:** `ysk add llm|push|websocket` match team: Prisma fragments (`LlmUsage`, `Device`), `skipSourceIf` on living saas, string-patch `app.ts` / `composition.ts` (`// --- ysk-add:<name> ---`). No ts-morph. Websocket has no HTTP routes (composition only). `main.ts` / `workers.ts` / Fastify stay hand-wired.

**Phase 29:** Fastify Bull Board at `/admin/queues` when BullMQ is on (ADMIN JWT). Same path and 401/403 envelope as Express. Memory queue has no board. `@bull-board/fastify` 9.10.1.

**Phase 30:** pino mixin copies active span `trace_id` / `span_id` (`pinoOtelMixin` in `@ysk/observability`). Omit both when no valid span. Logger stays OTel-free. Fastify access logs stay off. No Jaeger / OTel metrics / Worker OTel.

**Phase 31:** Standalone worker calls `startOtelFromEnv` (`instrumentHttp: false`, default `service.name` `ysk-worker`). `OTEL_SERVICE_NAME` still overrides. No job spans, no Jaeger, no OTel metrics.

**Phase 32:** Optional Jaeger all-in-one in Compose (later upgraded to `jaegertracing/jaeger:2.21.0` in Phase 38). Opt-in `docker compose up -d jaeger`. Empty `OTEL_EXPORTER_OTLP_ENDPOINT` still means OTel off. CI does not start Jaeger.

**Phase 33:** Optional OTLP metrics via `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` (separate from traces; Jaeger is traces-only). Prometheus `GET /metrics` unchanged. Metrics-only or traces-only both work. No host-metrics package. No live collector in CI.

**Phase 34:** Job handlers run inside `withJobSpan` (`job.name` attribute). Wrap is in `registerWorkers`; `@ysk/jobs` stays OTel-free. No BullMQ instrumentation package. No trace context in job payloads. Prometheus `/metrics` unchanged.

**Phase 35:** Fastify `onResponse` writes access logs through the composition pino logger (`reqId`, `method`, `url`, `statusCode`, `responseTime`, msg `request`). Built-in Fastify logger stays off. Express `pino-http` unchanged.

**Phase 36:** Org billing + seats + Stripe Tax. `Subscription` is per organization (`organizationId`, `seatCount`); `stripeCustomerId` lives on `Organization`. Checkout/portal/invoices/pdf need org OWNER/ADMIN (`org.billing`) plus `billing.checkout`. Stripe Checkout sends `automatic_tax[enabled]=true` and `line_items[0][quantity]`. Desktop briefly used `electron-vite@6.0.0-beta.3` for Vite 8; Phase 38 returned desktop to electron-vite 5 + Vite 7 (stable).

**Phase 37:** HTTP hardening (security headers + in-memory IP rate limit, `RATE_LIMIT_MAX=0` off). Public Scalar UI at `GET /docs` and `GET /openapi.json`. Optional Prometheus + Grafana in Compose scraping host `:3001/metrics`. Web `/orgs/$id/billing`. Admin audit, API keys, queues probe. CI does not start Grafana/Prometheus.

**Phase 38:** Version wave to latest stable. Node 24 Active LTS, pnpm 12.8.1, TypeScript 6.0 (7 has no public compiler API yet; `dependency-cruiser` cannot parse the TS graph on 7), Vitest 5, Prisma 7.10.0 (driver adapter `@prisma/adapter-mariadb`, generated client at `apps/api/src/generated/prisma`). Electron 44 + electron-vite 5 + desktop Vite 7. Web/admin stay Vite 8. Compose: Redis 8.10-alpine, Postgres 18-alpine, Jaeger `jaegertracing/jaeger:2.21.0`, Prometheus v3.15.0, Grafana 13.2.3. MySQL 8.4 LTS, Expo 57, and `@ts-rest/core` 3.53.0-rc.1 stay. CI is Node 24 / pnpm 12. CI does not start Redis / Stripe / Twilio / FCM / collector / Grafana. `create-ysk-app --db postgresql|sqlite` swaps the Prisma adapter and `create-prisma.ts`.

**Phase 39:** Agent law (`AGENTS.md`) + architecture/history split + `ysk add module` clones a complete hexagonal slice (contract, DTO, memory+prisma repos, Express and Fastify handlers, SDK, web-sdk hooks, web page, service test). Living saas still does not ship a demo `notes` route; the slice is a generator template.
