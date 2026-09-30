# 變更紀錄

Language: [English](history.md) · 中文

本檔按日期記錄 kit 已發布的內容。現行行為以 [architecture.zh.md](architecture.zh.md) 與指南為準。Agent 寫功能時不必讀本檔。

版本以 Phase 1 … Phase 51 標示。

**Phase 1:** pnpm + Turborepo + Biome、`@ysk/contracts`（Zod 4 + ts-rest）、envelope `{ok,data}/{ok,error}`、domain-kernel、Express 5 adapter 與 composition root、Prisma MySQL、Vite web/admin、Expo mobile 骨架、`@ysk/sdk` + `@ysk/web-sdk`、`@ysk/ui-logic`、`ysk add module`、`create-ysk-app --flavor saas`、CI、Docker Compose、dependency-cruiser、enum-drift 測試。

**Phase 2:** JWT + refresh session、電郵註冊／登入、`+852` OTP（開發用日誌 sender）、RBAC `ROLE_PERMISSIONS`、審計日誌、`/ready` + `/metrics`、本地檔案預簽署、`@ysk/i18n`、web/admin 登入。Users API 需要 session。

**Phase 3:** BullMQ 工作（`@ysk/jobs`，測試用記憶體）、郵件 port（日誌 + SMTP）、歡迎與重設密碼郵件、站內通知、設齊 `S3_*` 時的 S3 相容儲存、`pnpm worker`。

**Phase 4:** `@ysk/llm` OpenAI 相容客戶端（SpaceXAI / `https://api.x.ai/v1`，模型 `grok-4.7`）+ `LlmUsage` 表；`POST /v1/llm/complete` envelope；`POST /v1/llm/stream` SSE；Socket.IO 即時通訊 + `notification.created`。

**Phase 5:** `@ysk/push`（日誌 + Expo Push API）、`Device` + `/v1/me/devices`、`notification.create` 之後入列 `push.send`、SDK `DevicePort`/`FilePickerPort`、流動應用登入／主頁／收件箱 + EAS。

**Phase 6:** Organization + Membership + 電郵邀請（`OrgRole` OWNER/ADMIN/MEMBER；平台 `User.role` 維持全域）。`POST /v1/users/:id/suspend`。邀請權杖經雜湊。

**Phase 7:** `ysk add` 成為冪等合併（Prisma fragment、User 欄位、`.env.example`、API workspace 依賴）。`ysk add module` 接上 `appContract` 與路由註冊。PM2 `ecosystem.config.cjs` 運行 API（`RUN_WORKERS=0`）與 worker。

**Phase 8:** 設了 `REDIS_URL` 時，API 使用 Socket.IO Redis adapter（鍵 `ysk-socket.io`）；獨立 worker 經 `@socket.io/redis-emitter` 發送。

**Phase 9:** `apps/desktop` Electron + Vite（`platform: desktop`、`safeStorage` TokenStore）。`create-ysk-app --flavor desktop` 保留 api+desktop。Prisma 留在 API。

**Phase 10:** `@ysk/api-http` 提供與框架無關的 `HttpHandler` map。`@ysk/api-fastify` 服務同一套合約（`HTTP_ADAPTER=fastify`）。預設仍是 Express 5。

**Phase 11:** `@ysk/crypto` AES-256-GCM；`@ysk/apikey` 雜湊 `ysk_live_` 權杖。`POST/GET/DELETE /v1/me/api-keys`。機器 Bearer 不能再產生金鑰。

**Phase 12:** 公開 `@ysk/*` 程式庫輸出 `dist/`，並為 GitHub Packages 設定 `publishConfig`。Changesets 忽略 apps。

**Phase 13:** `create-ysk-app --flavor gateway` 複製 api + admin，略過 web/mobile/desktop。

**Phase 14:** `create-ysk-app --flavor php-bridge` 寫出 OpenAPI 與明白 envelope 的 TypeScript／PHP 客戶端（沒有 Node 應用）。

**Phase 15:** `create-ysk-app --flavor trading` 複製 api + web，略過 admin/mobile/desktop。Worker 是既有 BullMQ 行程。

**Phase 16:** `create-ysk-app --flavor static-web3` 只複製 web（沒有 API）。可選遠端 `API_PUBLIC_URL`。

**Phase 17:** Web/admin 使用 Vite 8。流動應用使用 Expo 57 / RN 0.86 / React 19.2。桌面 Vite 7。

**Phase 18:** Admin 電郵 OTP（`POST /v1/auth/admin/otp/request|verify`），只限現有 ACTIVE ADMIN。密碼登入保留。

**Phase 19:** Twilio `IOtpSender` 經 Messages REST。生產環境必須設 `TWILIO_*`；開發環境沿用日誌 sender。Adapter 不把 OTP 代碼寫進日誌。

**Phase 20:** 設齊 `FCM_*` 時，非 Expo 裝置權杖走 FCM HTTP v1。Expo Push API 不變。`UNREGISTERED` / `NOT_FOUND` → `invalid-token`。

**Phase 21:** Billing 雛型 — `BILLING_PLANS` free/pro、`Subscription` 表、日誌 `IBillingPort`、`GET/POST /v1/billing/*`。`ysk add billing`。

**Phase 22:** BullMQ 開啟時，Bull Board 位於 `/admin/queues`（ADMIN JWT）。Express。

**Phase 23:** 可選 OpenTelemetry traces（`OTEL_EXPORTER_OTLP_ENDPOINT`）。啟用時自動儀器 HTTP。pino 與 Prometheus `/metrics` 不變。

**Phase 24:** 設齊 `STRIPE_SECRET_KEY` + `STRIPE_PRICE_PRO` 時使用 Stripe Checkout adapter（待 `POST /v1/billing/webhook` 才生效）。日誌 adapter 仍然立即啟用。

**Phase 25:** `POST /v1/billing/portal`。從 Checkout webhook 寫入 `Subscription.stripeCustomerId`。

**Phase 26:** 有 customer id 時 `GET /v1/billing/invoices` 向 Stripe 取列表；否則 `[]`。

**Phase 27:** `GET /v1/billing/invoices/:id/pdf` 在核對顧客擁有權後 HTTP 302 到 Stripe `invoice_pdf`。

**Phase 28:** `ysk add llm|push|websocket` 與 team 對齊：Prisma fragments、已接線則略過、字串修補 `app.ts` / `composition.ts`。

**Phase 29:** BullMQ 開啟時，Fastify Bull Board 位於 `/admin/queues`（ADMIN JWT）。路徑與 401/403 envelope 與 Express 相同。

**Phase 30:** pino mixin 複製作用中 span 的 `trace_id` / `span_id`。Logger 本身不含 OTel。

**Phase 31:** 獨立 worker 呼叫 `startOtelFromEnv`（`instrumentHttp: false`，預設服務名 `ysk-worker`）。

**Phase 32:** Compose 可選 Jaeger（`jaegertracing/jaeger:2.21.0`）。選擇性執行 `docker compose up -d jaeger`。

**Phase 33:** 可選 OTLP metrics（`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`，與 traces 分開）。

**Phase 34:** Job handler 在 `withJobSpan` 內運行（屬性 `job.name`）。`@ysk/jobs` 不含 OTel。

**Phase 35:** Fastify `onResponse` 經 composition 的 pino logger 寫 access log。內建 Fastify logger 維持關閉。

**Phase 36:** 組織帳單、座位與 Stripe Tax。`Subscription` 以組織為單位；`stripeCustomerId` 在 `Organization`。

**Phase 37:** HTTP 安全標頭 + 記憶體 IP 速率限制。公開 Scalar 介面 `GET /docs` 與 `GET /openapi.json`。Compose 可選 Prometheus + Grafana。Web 組織帳單頁。Admin 審計、API 金鑰、佇列探測。

**Phase 38:** 版本對齊當時穩定版：Node 24、pnpm 12.8.1、TypeScript 6.0.3、Vitest 5、Prisma 7.10.0 配 `@prisma/adapter-mariadb`。Electron 44 + electron-vite 5 + 桌面 Vite 7。Web/admin Vite 8。Compose Redis 8.10、Postgres 18、Jaeger 2.21.0、Prometheus v3.15.0、Grafana 13.2.3。MySQL 8.4 LTS、Expo 57、`@ts-rest/core` 3.53.0-rc.1。

**Phase 39:** Agent 法律（`AGENTS.md`）+ 架構／歷史分檔。`ysk add module` 複製完整 hexagonal 切片。本倉不掛載示範 `notes` HTTP 路由；`modules/notes` 說明產生器形狀。

**Phase 40:** `create-ysk-app --preset thin|full`（預設 thin）複製可運行樹後剝走 llm / billing / organizations / devices。`ysk add llm|team|billing|push` 複製源碼樹並修補 Express、Fastify、composition、main、SDK、web-sdk 與 web router。CI job `thin-smoke` 使用 sqlite + `--no-admin --no-mobile`。

**Phase 41:** `@ysk/ui` AppShell / PageHeader / EmptyState / ErrorBanner / FormField / Spinner。`pnpm db:seed` 位於 `apps/api/src/infra/seed.ts`。Web 登入 Testing Library。CI job `e2e` 對 MySQL 8.4 跑一條 Chromium Playwright smoke。

**Phase 42:** 公開雙語文件（英文 `.md` + 香港書面語 `.zh.md`）、agent skills，以及完整 CLI 手冊。`ysk` 與 `create-ysk-app` 列印命令說明。產生出來的產品獲得 `README.md` 與 `README.zh.md`。

**Phase 43:** 每個 `create-ysk-app` flavor 寫入 `.ysk-kit.json` 來源標記。`ysk upgrade [--dry-run]` 把允許清單上的護欄（agent 法律、skills、TypeScript 與 Biome 設定、dependency-cruiser）從 kit 工作副本複製到產品。日常路徑是複製加 upgrade。

**Phase 44:** `ysk check agent` 標記 TypeScript `enum`、web/admin/mobile/desktop 的 Prisma import，以及那些 app 的 raw `fetch`。夾具證明掃描器會對那些補丁失敗。Biome `style.noEnum` 為 error。CI `check` 與 `thin-smoke` 會跑此掃描。

**Phase 45:** `create-ysk-app` 在 TTY 下對未傳的名稱、flavor、preset、資料庫、admin、mobile 提問。`--yes` / `-y` 與非 TTY（CI）永不提問。已傳的旗標不會再問。

**Phase 46:** Expo 組織列表、詳情（成員／邀請／離開）與接受邀請畫面接上 `@ysk/sdk` 的 `organizations` 與 `orgRoleCan`。`--preset thin` 會剝走它們；產品有 `apps/mobile` 時，`ysk add team` 會還原。

**Phase 47:** 已完成實例套用器 `@ysk/examples` 與金牌教程 `clinic-booking`（overlay、雙語步驟、預期 envelope、Playwright 截圖）。living kit 仍然不掛行業路由。`ysk add module` 與 capability 的 Express 修補把路由掛在 `errorHandler` 之前。

**Phase 48:** 已完成實例 `crm-contacts`（客戶與跟進）與 `inventory-stock`（SKU 與庫存異動）。雙模組記憶體 harness 透過 `patches.json` 共用父 repository。

**Phase 49:** 已完成實例 `helpdesk-tickets`（`ysk add team`，工單屬於組織）與 `membership-club`（先 team 再 billing；記錄 checkout URL，擷取時不按 Checkout）。Team 的 Organization fragment 含 `stripeCustomerId`，沒有 billing 的 dest 仍然能通過型別檢查。

**Phase 50:** 已完成實例 `course-enrollment`（名額與電郵唯一）與 `invoice-quotes`（金額以港元仙計，DRAFT → SENT → ACCEPTED）。

**Phase 51:** 已完成實例 `event-rsvp`、`job-board`（未發布職位報名回 CONFLICT）與 `field-work-orders`（`ysk add push`，指派會把 `work.assigned` 寫入 Inbox）。十個系統的目錄現已提供。CI `example-smoke` 為 10 slug 矩陣（`fail-fast: false`）。擷取按 `capture.json` 在埠 13001／15173 逐步操作。sqlite dest 上的 `ysk add` 會去掉 `@db` native types（Device.token）。thin + mobile 的 Expo 應用在沒有組織畫面時仍能通過型別檢查。`ysk add push` 會把 `push` 放回 memory harness 的回傳值。

Cursor／Grok skill 包裝放在 `tooling/ysk-cli/templates/agent/`，由 `create-ysk-app` 與 `ysk upgrade` 寫入已 gitignore 的 `.cursor/` 與 `.grok/`。`.gitignore` 同時覆蓋 `.env.*`（保留 `.env.example`）、編輯器目錄，以及 `*.pem`／`*.key`。
