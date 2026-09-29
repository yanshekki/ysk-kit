# YSK Kit — 共用全端開發架構

版本：0.2（2026-09-28）
目標：每個新 project 只寫業務，唔再重做 frontend / backend / database / mobile 骨架。
依據：yanshekki GitHub 19 個 repo 實況 + SlashMap 四端架構。

## Implemented in this repo

**Phase 1:** pnpm + turbo + Biome, `@ysk/contracts` (Zod 4 + ts-rest), envelope `{ok,data}/{ok,error}`, domain-kernel, Express 5 adapter + composition root, Prisma MySQL, Vite web/admin, Expo mobile skeleton, `@ysk/sdk` + `@ysk/web-sdk`, `@ysk/ui-logic`, `ysk add module`, `create-ysk-app --flavor saas`, CI, Docker Compose, dependency-cruiser, enum-drift.

**Phase 2:** JWT + refresh sessions, email register/login, `+852` OTP (dev logger sender), RBAC `ROLE_PERMISSIONS`, audit log, `/ready` + `/metrics`, local file presign, `@ysk/i18n`, web/admin login. Users API requires a session.

**Phase 3:** BullMQ jobs (`@ysk/jobs`, memory in tests), mail port (log + SMTP), welcome + password-reset mail, in-app notifications, S3-compatible storage when `S3_*` is set, `pnpm worker`.

**Phase 4:** `@ysk/llm` OpenAI-compatible client (SpaceXAI / `https://api.x.ai/v1`, model `grok-4.7`) + `LlmUsage` table; `POST /v1/llm/complete` envelope; `POST /v1/llm/stream` SSE (the only non-envelope response); Socket.IO realtime + `notification.created`.

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

**Phase 17:** Web/admin on Vite 8 (Rolldown). Mobile on Expo 57 / RN 0.86 / React 19.2. Desktop stays Vite 7 + electron-vite 4 (peer has no Vite 8 yet).

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

**Phase 32:** Optional Jaeger all-in-one in Compose (`jaegertracing/all-in-one:1.76.0`, UI 16686, OTLP HTTP 4318). Start with `docker compose up -d jaeger`. Empty `OTEL_EXPORTER_OTLP_ENDPOINT` still means OTel off. CI does not start Jaeger. Prometheus `/metrics` unchanged.

**Phase 33:** Optional OTLP metrics via `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` (separate from traces; Jaeger is traces-only). Prometheus `GET /metrics` unchanged. Metrics-only or traces-only both work. No host-metrics package. No live collector in CI.

**Phase 34:** Job handlers run inside `withJobSpan` (`job.name` attribute). Wrap is in `registerWorkers`; `@ysk/jobs` stays OTel-free. No BullMQ instrumentation package. No trace context in job payloads. Prometheus `/metrics` unchanged.

**Phase 35:** Fastify `onResponse` writes access logs through the composition pino logger (`reqId`, `method`, `url`, `statusCode`, `responseTime`, msg `request`). Built-in Fastify logger stays off. Express `pino-http` unchanged.

**Phase 36:** Org billing + seats + Stripe Tax. `Subscription` is per organization (`organizationId`, `seatCount`); `stripeCustomerId` lives on `Organization`. Checkout/portal/invoices/pdf need org OWNER/ADMIN (`org.billing`) plus `billing.checkout`. Stripe Checkout sends `automatic_tax[enabled]=true` and `line_items[0][quantity]`. Desktop Vite 8 via `electron-vite@6.0.0-beta.3`.

**Phase 37:** HTTP hardening (security headers + in-memory IP rate limit, `RATE_LIMIT_MAX=0` off). Public Scalar UI at `GET /docs` and `GET /openapi.json`. Optional Prometheus (`prom/prometheus:v3.13.3` :9090) + Grafana (`grafana/grafana:13.2.2` :3000) in Compose scraping host `:3001/metrics`. Web `/orgs/$id/billing`. Admin audit, API keys, queues probe. CI does not start Grafana/Prometheus.

Later: (empty)

Envelope exceptions: LLM stream is SSE (`event: delta|done`); invoice PDF is HTTP 302; OpenAPI JSON is `GET /openapi.json`; Scalar HTML is `GET /docs`. All other routes stay `{ ok, data }` / `{ ok, error }`.

Envelope: every response uses `{ ok, data }` / `{ ok, error }` (including single resources). HTTP adapter is Express 5. Web/admin use Vite 8. Mobile uses Expo 57. Desktop uses Vite 8 via electron-vite 6 beta.

---

## 1. 問題同設計原則

依家每個新 project 都要重新砌：

- React 目錄、router、query、UI、i18n
- Express 分層、error、auth、validation、logging
- Prisma schema、migration、repository
- enum / DTO / interface 兩邊各寫一次，最後漂移

`typescript-express-starter` 解決嘅係「一個 backend 專案 2 分鐘生成」。
佢**唔解決**：

- frontend + backend 共用型別
- 多個產品共用模組（auth、jobs、storage、LLM）
- hexagonal 邊界（換 ORM / 換 HTTP framework 唔改業務）
- 一鍵加能力而唔係一鍵複製成個專案

所以 YSK Kit 唔係再做一個 Express boilerplate，而係：

**一套 pnpm + Turborepo 平台 + 可插拔模組 + 合約先行（contract-first）。**

原則：

1. **合約係唯一真相來源**（enum、DTO、error code、API path）。
2. **業務核心唔識 Express / Prisma / React**。
3. **向下依賴禁止**（domain 唔 import infra；contracts 唔 import app）。
4. **預設 REST + OpenAPI**（對外、手機、partner、AI agent 都用得）。
5. **模組可加可唔加**（auth / jobs / billing 唔係所有 project 都要）。
6. **複製業務禁止，複製骨架用 generator**。

---

## 2. 建議技術棧（預設 + 備選）

| 層 | 預設（建議採用） | 備選 | 點解咁揀 |
|---|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | Nx（公司 >15 個 app 先考慮） | 輕、快、夠用 |
| Language | TypeScript 5.9+ `strict` + `exactOptionalPropertyTypes` | — | 生產級 |
| Frontend | Vite 8 + React 19 + TanStack Router + TanStack Query | Next.js 模組（SEO / SSR 產品先加） | 你要獨立 FE/BE；Router/Query 型別最好 |
| UI | Tailwind CSS 4 + shadcn/ui | MUI（內部 admin 先考慮） | 可複製、可主題化 |
| HTTP API | Express 5 **作為 adapter** | Fastify / Hono adapter | 對齊 typescript-express-starter，但業務唔綁死 Express |
| API 合約 | **ts-rest + Zod 4** | 內部高速通道可加 tRPC；唔用 Zodios | REST + OpenAPI + 前後端共用；對外 API 重要 |
| Validation | Zod（合約層） | — | runtime + type 同源 |
| DB 預設 | **Prisma**（schema-first） | Drizzle adapter（edge / 高效能） | 你現有專案已用；Studio、nested write、hiring pool |
| Cache / Queue | Redis + BullMQ | 無 Redis 時用 in-memory（dev only） | 同 AQTMS 棧一致 |
| Auth | `@ysk/auth`（Better Auth 或自研 JWT+refresh）包一層 port | Clerk / Auth0 adapter | 核心只認 `IAuthPort` |
| Logger | Pino | — | prod JSON / dev pretty |
| Lint/Format | Biome | ESLint + Prettier | 一個工具搞完 |
| Test | Vitest + Testing Library + Supertest | Playwright e2e | 快 |
| Docs | ts-rest → OpenAPI → Scalar/Swagger | — | 一鍵出文件 |
| Runtime | Node 22 LTS | Bun（可選） | 生產穩 |
| Deploy | Docker Compose + GitHub Actions + PM2/K8s | — | 對齊現有習慣 |

Prisma vs Drizzle（寫清楚）：

- **預設 Prisma**：DX、migration、Studio、複雜 relation、團隊上手快。
- **Kit 必須有 `IRepository` port**：domain 唔直接 `import { prisma }`。
- **需要 edge / 細 bundle / 極高 QPS** 先開 Drizzle adapter，schema 用 mapper 對齊 contracts。
- 唔建議同一 product 同時用兩個 ORM。Kit 支援「換 adapter」，唔係「雙寫」。

tRPC vs ts-rest：

- 產品會有公開 API、webhook、非 TS client、mobile → **ts-rest**。
- 純內部 TS 工具（例如只俾自己 admin 用）可以加 `@ysk/trpc` 模組。
- 預設唔用 GraphQL；數據圖極複雜先考慮。

---

## 3. Repo 形態：Kit ≠ 所有產品塞入同一個 monorepo

建議兩層：

```
ysk-kit/                    ← 平台（模板 + 共用 packages + CLI）
  apps/web-template
  apps/api-template
  packages/*
  tooling/create-ysk-app

salonease/                  ← 產品 repo（由 kit generate）
aqtms/
datasetforge/
```

唔建議一開始把 SalonEase + AQTMS + DatasetForge 全部放同一個 monorepo。
產品生命週期、權限、release 節奏唔同，合倉會拖死。

共用程式點分發：

1. 初期：kit 用 `pnpm pack` / GitHub Packages `@ysk/*`
2. 或者產品 repo 用 kit 當 template（`degit` / `create-ysk-app`）
3. 合約變更用 changeset 發版，產品升 minor

---

## 4. 目錄結構（目標形態）

```
ysk-kit/
├── apps/
│   ├── api/                      # Express adapter 模板
│   └── web/                      # Vite React 模板
├── packages/
│   ├── typescript-config/        # @ysk/tsconfig
│   ├── biome-config/             # @ysk/biome
│   ├── contracts/                # ★ 唯一真相：enum / dto / error / api
│   ├── domain-kernel/            # Entity, VO, Result, AppError
│   ├── application/              # 通用 use-case 工具、pagination、unit of work
│   ├── api-express/              # Express adapter：error filter, auth guard
│   ├── db-prisma/                # Prisma client + base repos
│   ├── auth/                     # 可選模組
│   ├── cache/                    # Redis
│   ├── jobs/                     # BullMQ
│   ├── storage/                  # S3 / R2 / local
│   ├── mail/                     # SMTP / Resend
│   ├── i18n/                     # zh-HK / en
│   ├── ui/                       # shadcn 包裝
│   ├── web-sdk/                  # ts-rest client + Query hooks
│   ├── config/                   # typed env (zod)
│   ├── logger/
│   ├── observability/            # requestId, metrics, otel
│   └── llm/                      # 可選：OpenAI-compatible gateway
├── modules/                      # 一鍵加入嘅「功能切片」（schema + use-case + UI）
│   ├── identity/
│   ├── rbac/
│   ├── billing/
│   ├── files/
│   ├── audit-log/
│   └── notifications/
├── tooling/
│   ├── create-ysk-app/           # pnpm create @ysk/app
│   └── ysk-cli/                  # ysk add auth
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

單一產品 generate 之後：

```
my-product/
├── apps/api/src/
│   ├── modules/booking/          # 只得呢個產品先有
│   │   ├── domain/
│   │   ├── application/
│   │   └── infra/
│   └── main.ts                   # composition root
├── apps/web/src/
│   ├── routes/
│   ├── features/booking/
│   └── shared/
└── packages/contracts/           # 可以 extend kit contracts
```

---

## 5. 分層同依賴方向

```
apps/web  ──►  @ysk/web-sdk  ──►  @ysk/contracts
                                      ▲
apps/api (HTTP adapter) ──────────────┤
      │                               │
      ▼                               │
 application / use-cases ─────────────┤
      │                               │
      ▼                               │
 domain (entities, ports) ────────────┘
      ▲
      │ implements
 infra (prisma, redis, s3, mail)
```

硬規則：

- `domain` 只准 import `@ysk/domain-kernel` + `@ysk/contracts`（或本模組 domain types）
- `application` 只准 import domain + contracts
- `infra` 可以 import 所有，但對外只 export adapter
- `apps/web` **唔准** import `@ysk/db-prisma` / Express
- `apps/api` **唔准** import React / `@ysk/ui`
- 禁止 `any` 穿過邊界；用 `Result<T, E>` 或 typed `AppError`

用 ArchUnitTS / dependency-cruiser 寫測試鎖死呢啲方向。

---

## 6. Enum / Interface 架構（重點）

### 6.1 禁止同建議

| 唔好 | 要 |
|---|---|
| TypeScript numeric `enum` | `as const` object + union type |
| FE 寫一份 status、BE 再寫一份 | 只放 `@ysk/contracts` |
| Prisma enum 同 API enum 名唔同 | 同一組 literal |
| interface 塞晒所有欄位 | DTO ≠ Domain Entity ≠ Persistence Model |
| `export interface User { ... }` 當萬能 | 分清 Command / Query / View / Entity |

### 6.2 Enum 標準寫法

```ts
// packages/contracts/src/enums/user-status.ts
import { z } from 'zod';

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserStatusSchema = z.enum(
  Object.values(UserStatus) as [UserStatus, ...UserStatus[]],
);

export const USER_STATUS_LABELS: Record<UserStatus, { 'zh-HK': string; en: string }> = {
  ACTIVE: { 'zh-HK': '啟用', en: 'Active' },
  INVITED: { 'zh-HK': '已邀請', en: 'Invited' },
  SUSPENDED: { 'zh-HK': '停用', en: 'Suspended' },
  DELETED: { 'zh-HK': '已刪除', en: 'Deleted' },
};
```

Prisma：

```prisma
enum UserStatus {
  ACTIVE
  INVITED
  SUSPENDED
  DELETED
}
```

用 generator（例如 `zod-prisma-types` 或自寫 script）檢查 contracts enum 同 Prisma enum **set 相等**，CI fail-on-drift。

### 6.3 三套型別，唔好混

```ts
// 1) Wire DTO（API 進出，放 contracts）
export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  status: UserStatusSchema,
  createdAt: z.string().datetime(),
});
export type UserDto = z.infer<typeof UserDtoSchema>;

// 2) Command（寫入意圖）
export const CreateUserCommandSchema = z.object({
  email: z.string().email(),
  role: RoleSchema,
});
export type CreateUserCommand = z.infer<typeof CreateUserCommandSchema>;

// 3) Domain entity（有行為，放 domain）
export class User {
  private constructor(
    readonly id: UserId,
    readonly email: Email,
    private status: UserStatus,
  ) {}

  suspend(): Result<User, DomainError> {
    if (this.status === UserStatus.DELETED) {
      return err(new DomainError('USER_ALREADY_DELETED'));
    }
    return ok(new User(this.id, this.email, UserStatus.SUSPENDED));
  }
}
```

### 6.4 Interface 分四類

```
@ysk/contracts          → 資料形狀（DTO、Query params）
domain/*/ports.ts       → 業務需要嘅能力（IUserRepository, IClock）
infra/*                 → 實作 port
apps/web/ports          → UI 需要嘅 gateway（ISessionStore）
```

Repository port 例子：

```ts
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface IUnitOfWork {
  withTransaction<T>(fn: (repos: Repos) => Promise<T>): Promise<T>;
}
```

Controller **唔**持有 Prisma。Use case 只 depend port。

### 6.5 Error code 都當 enum

```ts
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export const ApiErrorSchema = z.object({
  code: z.enum(Object.values(ErrorCode) as [string, ...string[]]),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
});
```

前後端、log、監控全部用同一個 `code`。

---

## 7. API 合約（ts-rest）

```ts
// packages/contracts/src/api/users.ts
import { initContract } from '@ts-rest/core';

const c = initContract();

export const usersContract = c.router({
  list: {
    method: 'GET',
    path: '/users',
    query: PaginationQuerySchema,
    responses: { 200: PaginatedSchema(UserDtoSchema) },
  },
  create: {
    method: 'POST',
    path: '/users',
    body: CreateUserCommandSchema,
    responses: { 201: UserDtoSchema, 409: ApiErrorSchema },
  },
});
```

- Express：`@ts-rest/express` 接 contract
- Web：`@ysk/web-sdk` 包好 client + TanStack Query hooks
- `ysk generate openapi` 出 `openapi.yaml`

統一 response envelope 只用於 list metadata；單一 resource 直接返 DTO，避免套兩層。

---

## 8. Backend 模板（對齊又升級 typescript-express-starter）

starter 嘅 `controllers / services / repositories / dtos / middlewares` 仍然在，但改名對齊 hexagonal：

| starter | YSK Kit |
|---|---|
| routes | driving adapter（HTTP） |
| controllers | thin HTTP mapper |
| dtos / interfaces | `@ysk/contracts` |
| services | application use-cases |
| repositories | driven adapter implementing port |
| entities | domain |
| exceptions | `AppError` + mapper |
| config | `@ysk/config` typed env |
| utils | 只准無業務雜項；有業務就升做 package |

`apps/api` 每個 bounded context 自己一個 folder，避免巨大 `controllers/` 垃圾桶。

```
apps/api/src/
├── main.ts
├── composition.ts              # 唯一 new Xxx() 嘅地方
├── modules/
│   └── identity/
│       ├── domain/
│       ├── application/
│       └── infra/http + prisma
└── shared/
```

---

## 9. Frontend 模板

- Feature-Sliced：**routes / features / entities / shared**
- `features/*` 只透過 `@ysk/web-sdk` 打 API
- 表單用同一個 Zod schema（contracts）
- i18n key 同 enum label 共用
- 權限：contracts 出 `Permission` const，UI 用 `<Can permission="booking.cancel">`

---

## 10. 一鍵安裝 / 加入模組

### 開新產品

```bash
pnpm create @ysk/app
# 問：product name、DB（mysql/pg/sqlite）、auth、jobs、admin、i18n
```

產生：

- apps/web + apps/api
- Docker Compose（db + redis）
- `.env.example`（zod 驗證）
- GitHub Actions
- 第一個 health module
- README 用邊啲 command

### 加能力

```bash
ysk add auth
ysk add rbac
ysk add jobs
ysk add storage
ysk add mail
ysk add audit-log
ysk add i18n
ysk add admin
ysk add billing
ysk add llm
ysk add websocket
ysk add module booking   # 空嘅 hexagonal slice
```

每個 `ysk add X` 做嘅事（固定流程）：

1. 加 workspace dependency
2. merge Prisma schema fragment（`modules/X/prisma/*.prisma`）
3. 註冊 composition root
4. 掛 contract router
5. 可選：加 web route + UI
6. 出 migration 提示
7. 更新 `.env.example`

模組清單（第一期建議實作）：

| 模組 | 內含 |
|---|---|
| identity | register / login / refresh / logout |
| rbac | Role + Permission const + guard |
| audit-log | actor, action, resource, diff |
| files | signed upload |
| jobs | queue + dashboard hook |
| mail | template + queue |
| i18n | zh-HK / en |
| notifications | in-app + mail |
| observability | requestId, pino, health, metrics |
| llm | OpenAI-compatible client + usage log |

---

## 11. Database 共用策略

Kit 提供 **base schema**（User、Session、AuditLog），產品加自己嘅 models。

規則：

- 共用表前綴 `ysk_` 或放 `kit` schema
- 產品表唔改 kit 表結構；用 extension table
- 每個產品自己嘅 migration history
- seed 用 `packages/db-prisma/seeds` + 產品 seed
- multi-tenant：預設 `organizationId` 欄位可選模組，唔寫死全部產品

---

## 12. DX Command

```bash
pnpm dev                 # turbo: api + web + docker deps
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate
pnpm db:studio
pnpm gen:openapi
pnpm gen:module booking
pnpm changeset
```

---

## 13. 同現有產品點接

| 產品 | 形態 | 建議 |
|---|---|---|
| 新 TypeScript 產品 | generate | 必須用 kit |
| SlashMap | 已有四端 monorepo | **最接近 kit**；抽 shared/sdk/ui-logic 做 `@ysk/*`，產品 domain 留低 |
| AQTMS | pnpm + turbo + shared-types | 保留 trading 核心；HTTP/error/auth 對齊 kit |
| DatasetForge | backend/frontend 分倉式 | 模組目錄已好；抽 contracts，唔一次 rewrite |
| ysk-server | core + shared 已發 npm | 只對齊 logger/error/versioning；唔合併業務 |
| ysk-mint / DeFund / RiverPay | 鏈上 + 可選無後端 | 用 `static-web3` flavor；contracts 可以無 Prisma |
| ysk-omni / GCTOAC | gateway + Prisma + admin | 用 `gateway` flavor：queue、API key、OTP admin |
| instant-drama / SoulCorp | Electron / desktop | 用 `desktop` flavor |
| SalonEase / salonforge / ops / YSK / soulmd-hub | PHP | **唔用 kit runtime**；只消費 OpenAPI client / 共用 error code |

遷移順序：contracts → logger/error → sdk → auth → 新模組先、舊模組後。

---

## 14. 刻意唔做嘅事

- 唔用 NestJS 做預設
- 唔把 Prisma client 暴露俾 web / RN
- 唔用 TypeScript `enum`
- 唔用 Zodios
- 唔強制 Next.js
- 唔做「萬能 UserService 三千行」
- 唔在 kit 寫死行業業務（salon booking、listing/order、trading strategy）
- 唔把 SlashMap 地圖／訂單搬入 kit
- 唔要求 PHP 產品改寫成 Node 先用得合約
- 唔共用 React DOM 元件去 RN

---

## 15. 第一期落地範圍（建議 1–2 週）

1. monorepo skeleton + tsconfig/biome/turbo（統一 pnpm，唔再 npm/pnpm 混用）
2. `@ysk/contracts` + enum 規則 + `{ ok, data }` / `{ ok, error }` envelope
3. `@ysk/domain-kernel`（Result, AppError）
4. Express *或* Fastify adapter + health + users demo
5. Prisma **MySQL** 預設（產品現況）+ PG 可選
6. Vite web + **admin** + Expo mobile skeleton
7. `@ysk/sdk`（web / RN / admin 同一 client）+ token storage port
8. `@ysk/ui-logic`（純函數，零 DOM）
9. `create-ysk-app` flavors + `ysk add module`
10. CI + Docker Compose + 依賴方向測試

之後：auth（JWT + OTP）、jobs、storage、push、llm、desktop。

---

## 16. 對住 GitHub 19 個 repo 要加嘅優化

盤點（2026-09-28，`user:yanshekki` 共 19 個）：

| 類型 | Repo |
|---|---|
| TS 四端 / 多端 monorepo | SlashMap（web+admin+api+mobile）、AQTMS、ysk-mint、ysk-server |
| TS 單倉全端 | DatasetForge、ysk-omni、GCTOAC、instant-drama-magician |
| Desktop | instant-drama-magician、SoulCorp |
| PHP 產品站／SaaS | YSK、salonease、salonforge、ysk-ops-system、soulmd-hub |
| 鏈上 | ysk-mint、DeFund-Protocol、RiverPay-Poker |
| 舊分倉 | finfin-frontend / finfin-backend |

### 16.1 工具鏈要統一（而家最散）

現況：SlashMap 用 npm workspaces；AQTMS 用 pnpm+turbo；DatasetForge / GCTOAC / Omni 用 npm 單 package；測試 Jest 同 Vitest 共存；HTTP Express 4 同 Fastify 共存。

Kit 鎖死：

- package manager：**pnpm**
- task runner：**turbo**
- test：**Vitest**
- lint：**Biome**
- HTTP：**adapter**（預設 Fastify 對齊 SlashMap，或者 Express 對齊 DatasetForge；兩個都要能 generate）
- DB 預設：**MySQL + Prisma**（SlashMap、ops、SalonEase、ysk-server data 都係呢條線）
- Node **>= 22**

### 16.2 從現有產品「抽」而唔係「發明」嘅 package

已經證明有用、應該升級成 `@ysk/*`：

| 來源 | 抽成 | 原因 |
|---|---|---|
| SlashMap `packages/shared` | `@ysk/contracts` | enum / dto / error / rules / i18n 零 UI |
| SlashMap `packages/sdk` | `@ysk/sdk` | web/admin/mobile 同一 HTTP+WS |
| SlashMap `packages/ui-logic` | `@ysk/ui-logic` | format、狀態機、按鈕可唔可以撳 |
| SlashMap `packages/config` | `@ysk/config` | url、zod env、feature flags |
| ysk-server `packages/shared` + npm publish | `@ysk/*` 發佈流程 | changeset + GitHub Packages |
| ysk-mint `@ysk-mint/sdk` + `@ysk-mint/config` | flavor：config 同 sdk 分家 | 鏈上產品都係咁拆 |
| DatasetForge `src/modules/*` | `ysk add module` 切片 | auth/user/team/permission/upload/notification/activity-log |
| DatasetForge MinIO + SlashMap S3 | `@ysk/storage` | presigned URL |
| AQTMS BullMQ / GCTOAC durable queue | `@ysk/jobs` | 隊列唔好每個產品自寫 |
| ysk-omni / GCTOAC / ysk-server LLM | `@ysk/llm` | OpenAI-compatible client + usage log |
| GCTOAC AES-256 + per-key policy | `@ysk/crypto` + `@ysk/apikey` | gateway 類產品 |
| 幾乎所有 README | `@ysk/i18n` | zh-HK + en 成對 |

### 16.3 產品 flavor（`create-ysk-app --flavor`）

唔可以用一個 Vite+Express 模板硬套全部 repo。

| Flavor | 產出 | 對應現有產品 |
|---|---|---|
| `saas` | api + web + admin +（可選）mobile | SlashMap、DatasetForge 下一版、SalonEase 若重寫 |
| `trading` | api + web + worker | AQTMS |
| `gateway` | api + admin + queue + apikey | ysk-omni、GCTOAC |
| `desktop` | electron/vite + local prisma + optional remote | instant-drama、SoulCorp |
| `static-web3` | vite web + packages/config+sdk，無 API | ysk-mint |
| `php-bridge` | 只出 openapi.yaml + TS/PHP client | YSK 官網、ops、現役 SalonEase |

### 16.4 幾乎每個產品都重複、kit 必須一鍵加

- **Admin 端**（SlashMap / Omni / GCTOAC / DatasetForge permission）
- **Auth 兩種**：email+JWT（DatasetForge）同 phone OTP（SlashMap）；admin OTP（GCTOAC）
- **Team + RBAC + audit log**（DatasetForge modules）
- **Upload / presigned**（MinIO 或 S3）
- **Realtime**（SlashMap socket.io、AQTMS websocket）
- **Push**（SlashMap FCM port、RN expo-notifications）
- **i18n zh-HK / en**
- **Health / readiness / PM2 ecosystem**
- **Bilingual README + .env.example zod 驗證**
- **香港預設**：`+852` phone、HKD **integer**、Asia/Hong_Kong、Platform enum `web | ios | android | admin | desktop`

### 16.5 刻意唔抽入 kit 嘅業務

- SlashMap：地圖 pin、listing、order state machine、地區圈
- AQTMS：交易所 connector、風控、回測
- SalonEase：預約／POS／熱感紙
- ysk-server：Linux apply / nginx / mail stack
- instant-drama：故事板、FFmpeg pipeline

呢啲用產品 module，唔用 kit module。

---

## 17. React Native 接入（以 SlashMap 為準）

SlashMap 已有 `apps/mobile`：Expo 57 + RN 0.86 + React 19，依賴 `@slashmap/config|sdk|shared|ui-logic`。Kit 照抄呢條依賴線，唔另發明一套。

### 17.1 邊啲可以共用、邊啲唔可以

| 可以共用 | 唔可以共用 |
|---|---|
| `@ysk/contracts` | `div` / shadcn / Tailwind class |
| `@ysk/sdk`（fetch + WS） | Leaflet / DOM map |
| `@ysk/ui-logic` | `localStorage`、`window`、`document` |
| `@ysk/config`（public flags） | Prisma、Node `fs`、Express |
| Zod form schema、error code、i18n 字串 | `@ysk/ui` web 元件 |

依賴：

```
apps/web     ─┐
apps/admin   ─┼─► @ysk/sdk ─► @ysk/contracts
apps/mobile  ─┘       │
                      └─► @ysk/ui-logic ─► @ysk/contracts
apps/desktop ─► @ysk/sdk（可選）
apps/api ────────────► @ysk/contracts
```

`apps/api` 唔依賴 sdk。sdk 唔依賴 React。

### 17.2 必須有嘅 port（RN 先唔會同 web 分叉）

```ts
export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export interface DevicePort {
  platform: 'ios' | 'android';
  registerPushToken(token: string): Promise<void>;
}

export interface FilePickerPort {
  pickImage(): Promise<{ uri: string; mime: string } | null>;
}
```

- Web：`localStorage` / cookie
- RN：`expo-secure-store`
- Desktop：`safeStorage`
- SDK `createClient({ baseUrl, tokenStore, client: 'web' | 'ios' | 'android' | 'admin' | 'desktop' })`

### 17.3 Mobile 模板

```
apps/mobile/
  app.config.ts          # EAS + bundle id
  src/
    app.tsx
    navigation/
    screens/             # 只組合 ui-logic + sdk
    adapters/            # TokenStore, Push, FilePicker
```

`ysk add mobile` 會：

1. 加 Expo app
2. 接同一 `@ysk/sdk`
3. 加 `Platform` enum 同 `/me/devices`
4. 加 push adapter 空位
5. 加 EAS preview / production profile

### 17.4 RN 邊界規則

- Metro 要能 resolve workspace package（`pnpm` + `expo-yarn-workspaces` 風格 config 寫死喺模板）
- contracts / sdk / ui-logic **唔用** Node built-in
- 地圖、相機、聯絡人只存在 `apps/mobile/adapters`
- 狀態機、價錢格式、權限判斷只存在 ui-logic（SlashMap 已證明：唔係咁就會出現 App 有「完成」掣但 API 409）
- Deep link scheme 放 `@ysk/config`
- 測試：Vitest 測 ui-logic；Testing Library RN 測 screen 組裝

### 17.5 唔建議

- React Native Web 硬砌同一套畫面去 co-exist（admin／官網 SEO 會痛）
- 一個 `packages/ui` 同時 export DOM 同 NativeWind（後期一定炸）
- 喺 RN bundle Prisma 或 server env
