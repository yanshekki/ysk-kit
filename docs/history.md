# Changelog

Language: [中文](history.zh.md) · English

Dated record of what this kit shipped. Current behaviour is defined by [architecture.md](architecture.md) and the guides. Agents do not need this file to write a feature.

Releases are labelled Phase 1 … Phase 51.

**Phase 1:** pnpm + Turborepo + Biome, `@ysk-kit/contracts` (Zod 4 + ts-rest), envelope `{ok,data}/{ok,error}`, domain-kernel, Express 5 adapter and composition root, Prisma MySQL, Vite web/admin, Expo mobile skeleton, `@ysk-kit/sdk` + `@ysk-kit/web-sdk`, `@ysk-kit/ui-logic`, `ysk add module`, `create-ysk-app --flavor saas`, CI, Docker Compose, dependency-cruiser, enum-drift tests.

**Phase 2:** JWT + refresh sessions, email register/login, `+852` OTP (dev log sender), RBAC `ROLE_PERMISSIONS`, audit log, `/ready` + `/metrics`, local file presign, `@ysk-kit/i18n`, web/admin login. Users API requires a session.

**Phase 3:** BullMQ jobs (`@ysk-kit/jobs`, memory in tests), mail port (log + SMTP), welcome + password-reset mail, in-app notifications, S3-compatible storage when `S3_*` is set, `pnpm worker`.

**Phase 4:** `@ysk-kit/llm` OpenAI-compatible client (SpaceXAI / `https://api.x.ai/v1`, model `grok-4.7`) + `LlmUsage` table; `POST /v1/llm/complete` envelope; `POST /v1/llm/stream` SSE; Socket.IO realtime + `notification.created`.

**Phase 5:** `@ysk-kit/push` (log + Expo Push API), `Device` + `/v1/me/devices`, `push.send` after `notification.create`, SDK `DevicePort`/`FilePickerPort`, mobile login/home/inbox + EAS.

**Phase 6:** Organization + Membership + email invite (`OrgRole` OWNER/ADMIN/MEMBER; platform `User.role` stays global). `POST /v1/users/:id/suspend`. Invite tokens hashed.

**Phase 7:** `ysk add` is an idempotent merge (Prisma fragment, User fields, `.env.example`, API workspace deps). `ysk add module` wires `appContract` + route registration. PM2 `ecosystem.config.cjs` runs API (`RUN_WORKERS=0`) and worker.

**Phase 8:** Socket.IO Redis adapter (key `ysk-socket.io`) on the API when `REDIS_URL` is set; standalone worker emits via `@socket.io/redis-emitter`.

**Phase 9:** `apps/desktop` Electron + Vite (`platform: desktop`, `safeStorage` TokenStore). `create-ysk-app --flavor desktop` keeps api+desktop. Prisma stays in the API.

**Phase 10:** Framework-free `HttpHandler` maps in `@ysk-kit/api-http`. `@ysk-kit/api-fastify` serves the same contracts (`HTTP_ADAPTER=fastify`). Express 5 remains default.

**Phase 11:** `@ysk-kit/crypto` AES-256-GCM; `@ysk-kit/apikey` hashed `ysk_live_` tokens. `POST/GET/DELETE /v1/me/api-keys`. Machine Bearer cannot mint keys.

**Phase 12:** Public `@ysk-kit/*` libraries emit `dist/` and set `publishConfig` for GitHub Packages. Changesets ignore apps.

**Phase 13:** `create-ysk-app --flavor gateway` copies api + admin, skips web/mobile/desktop.

**Phase 14:** `create-ysk-app --flavor php-bridge` writes OpenAPI + envelope-aware TypeScript/PHP clients (no Node apps).

**Phase 15:** `create-ysk-app --flavor trading` copies api + web, skips admin/mobile/desktop. Worker is the existing BullMQ process.

**Phase 16:** `create-ysk-app --flavor static-web3` copies web only (no API). Optional remote `API_PUBLIC_URL`.

**Phase 17:** Web/admin on Vite 8. Mobile on Expo 57 / RN 0.86 / React 19.2. Desktop Vite 7.

**Phase 18:** Admin email OTP (`POST /v1/auth/admin/otp/request|verify`) for existing ACTIVE ADMIN. Password login remains.

**Phase 19:** Twilio `IOtpSender` via Messages REST. `TWILIO_*` required in production; development keeps the log sender. Adapter does not log the OTP code.

**Phase 20:** FCM HTTP v1 for non-Expo device tokens when `FCM_*` is set. Expo Push API unchanged. `UNREGISTERED` / `NOT_FOUND` → `invalid-token`.

**Phase 21:** Billing stub — `BILLING_PLANS` free/pro, `Subscription` table, log `IBillingPort`, `GET/POST /v1/billing/*`. `ysk add billing`.

**Phase 22:** Bull Board at `/admin/queues` when BullMQ is on (ADMIN JWT). Express.

**Phase 23:** Optional OpenTelemetry traces via `OTEL_EXPORTER_OTLP_ENDPOINT`. HTTP auto-instrumentation when enabled. pino + Prometheus `/metrics` unchanged.

**Phase 24:** Stripe Checkout adapter when `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO` are set (pending until `POST /v1/billing/webhook`). Log adapter still activates immediately.

**Phase 25:** `POST /v1/billing/portal`. Stores `Subscription.stripeCustomerId` from Checkout webhook.

**Phase 26:** `GET /v1/billing/invoices` from Stripe when a customer id exists; otherwise `[]`.

**Phase 27:** `GET /v1/billing/invoices/:id/pdf` HTTP 302 to Stripe `invoice_pdf` after customer ownership check.

**Phase 28:** `ysk add llm|push|websocket` match team: Prisma fragments, skip when already wired, string-patch `app.ts` / `composition.ts`.

**Phase 29:** Fastify Bull Board at `/admin/queues` when BullMQ is on (ADMIN JWT). Same path and 401/403 envelope as Express.

**Phase 30:** pino mixin copies active span `trace_id` / `span_id`. Logger stays OTel-free.

**Phase 31:** Standalone worker calls `startOtelFromEnv` (`instrumentHttp: false`, default service name `ysk-worker`).

**Phase 32:** Optional Jaeger in Compose (`jaegertracing/jaeger:2.21.0`). Opt-in `docker compose up -d jaeger`.

**Phase 33:** Optional OTLP metrics via `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` (separate from traces).

**Phase 34:** Job handlers run inside `withJobSpan` (`job.name` attribute). `@ysk-kit/jobs` stays OTel-free.

**Phase 35:** Fastify `onResponse` writes access logs through the composition pino logger. Built-in Fastify logger stays off.

**Phase 36:** Organisation billing + seats + Stripe Tax. `Subscription` is per organisation; `stripeCustomerId` lives on `Organization`.

**Phase 37:** HTTP security headers + in-memory IP rate limit. Public Scalar UI at `GET /docs` and `GET /openapi.json`. Optional Prometheus + Grafana in Compose. Web organisation billing page. Admin audit, API keys, queues probe.

**Phase 38:** Version wave to current stable: Node 24, pnpm 12.8.1, TypeScript 6.0.3, Vitest 5, Prisma 7.10.0 with `@prisma/adapter-mariadb`. Electron 44 + electron-vite 5 + desktop Vite 7. Web/admin Vite 8. Compose Redis 8.10, Postgres 18, Jaeger 2.21.0, Prometheus v3.15.0, Grafana 13.2.3. MySQL 8.4 LTS, Expo 57, `@ts-rest/core` 3.53.0-rc.1.

**Phase 39:** Agent law (`AGENTS.md`) + architecture/history split. `ysk add module` clones a complete hexagonal slice. This repository does not mount a demo `notes` HTTP route; `modules/notes` documents the generator shape.

**Phase 40:** `create-ysk-app --preset thin|full` (default thin) copies the living tree then strips llm / billing / organizations / devices. `ysk add llm|team|billing|push` copies source trees and patches Express, Fastify, composition, main, SDK, web-sdk, and the web router. CI job `thin-smoke` uses sqlite + `--no-admin --no-mobile`.

**Phase 41:** `@ysk-kit/ui` AppShell / PageHeader / EmptyState / ErrorBanner / FormField / Spinner. `pnpm db:seed` at `apps/api/src/infra/seed.ts`. Web login Testing Library. CI job `e2e` runs one Chromium Playwright smoke against MySQL 8.4.

**Phase 42:** Public bilingual documentation (English `.md` + Hong Kong written Chinese `.zh.md`), agent skills, and full CLI manuals. `ysk` and `create-ysk-app` print command help. Generated products receive `README.md` and `README.zh.md`.

**Phase 43:** `.ysk-kit.json` origin marker on every `create-ysk-app` flavor. `ysk upgrade [--dry-run]` copies allowlisted guardrails (agent law, skills, TypeScript and Biome config, dependency-cruiser) from the kit checkout into the product. Daily path is copy-tree plus upgrade.

**Phase 44:** `ysk check agent` flags TypeScript `enum`, Prisma imports in web/admin/mobile/desktop, and raw `fetch` in those apps. Fixtures prove the scanner fails on those patches. Biome `style.noEnum` is error. CI `check` and `thin-smoke` run the scan.

**Phase 45:** `create-ysk-app` prompts on a TTY for omitted name, flavor, preset, database, admin, and mobile. `--yes` / `-y` and non-TTY (CI) never prompt. Flags already passed are not asked again.

**Phase 46:** Expo organisation list, detail (members / invite / leave), and accept-invite screens on `apps/mobile`, wired through `@ysk-kit/sdk` `organizations` and `orgRoleCan`. `--preset thin` strips them; `ysk add team` restores them when `apps/mobile` exists.

**Phase 47:** Worked-example applicator `@ysk-kit/examples` plus gold tutorial `clinic-booking` (overlay, bilingual steps, expected envelopes, Playwright screenshots). Living kit still does not mount industry routes. `ysk add module` and capability Express patches mount routers before `errorHandler`.

**Phase 48:** Worked examples `crm-contacts` (contact + follow-up) and `inventory-stock` (sku + stock-move). Dual-module memory harness shares the parent repository through `patches.json`.

**Phase 49:** Worked examples `helpdesk-tickets` (`ysk add team`, tickets scoped to an organisation) and `membership-club` (team then billing; log checkout URL, capture does not click Checkout). Team Organization fragment includes `stripeCustomerId` so a dest without billing still typechecks.

**Phase 50:** Worked examples `course-enrollment` (quota + unique email) and `invoice-quotes` (amounts in HKD cents, DRAFT → SENT → ACCEPTED).

**Phase 51:** Worked examples `event-rsvp`, `job-board` (unpublished apply is CONFLICT), and `field-work-orders` (`ysk add push`, assign enqueues `work.assigned` into Inbox). Catalogue of ten systems is available. CI `example-smoke` is a 10-slug matrix (`fail-fast: false`). Capture walks `capture.json` on ports 13001 / 15173. `ysk add` on a sqlite dest strips `@db` native types (Device.token). Thin + mobile Expo app typechecks without organisation screens. `ysk add push` returns `push` from the memory harness.

Cursor/Grok skill wrappers live in `tooling/ysk-cli/templates/agent/` and are written to gitignored `.cursor/` and `.grok/` by `create-ysk-app` and `ysk upgrade`. `.gitignore` also covers `.env.*` (keeps `.env.example`), editor trees, and `*.pem` / `*.key`.

**Phase 52:** CI green on sqlite dests (all three Prisma adapters in the lockfile), create-app Vitest 30s timeout, Release gated to GitHub owner `ysk`, e2e API via `tsx`. `pnpm test:coverage` reports Vitest v8 coverage (95% configured). Shared web-storage token store and Prisma id-cursor helper. Thin dest SDK tests cover remaining resources; optional llm/billing/orgs/devices tests stay on the living kit.

**v1.0.0:** Workspace scope `@ysk-kit/*`. Public packages publish to npmjs org `ysk-kit`. GitHub Releases stay on `yanshekki/ysk-kit`. `create-ysk-app` from the registry downloads the matching GitHub tag tarball. GitHub Packages is unused.
