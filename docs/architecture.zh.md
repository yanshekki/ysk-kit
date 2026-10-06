# 架構

Language: [English](architecture.md) · 中文

YSK Kit 是合約先行的平台，讓新產品撰寫業務規則，而不必重建前端、後端、資料庫與流動應用骨架。本倉是可運行的 `saas` flavor：身分、檔案、通知、工作、郵件、API 金鑰、加密、即時通訊已經接上。產品業務 domain 不寫入 kit。

Agent 法律：[AGENTS.zh.md](../AGENTS.zh.md)。本檔摘要的主題，指南會展開。版本變更紀錄：[CHANGELOG.zh.md](../CHANGELOG.zh.md)。階段日記：[history.zh.md](history.zh.md)。

## 原則

1. **合約是唯一真相來源**：enum、DTO、error code、API 路徑都在 `@ysk-kit/contracts`。
2. **業務核心不認識 Express、Prisma 或 React。** Domain 與 application 依賴 port。
3. **禁止向下依賴。** Domain 不 import infra。Contracts 不 import apps。
4. **預設 REST + OpenAPI**，瀏覽器、手機、合作方與 agent 共用同一 HTTP 介面。
5. **能力可加可不加。** 不是每個產品都需要 auth、jobs、billing。
6. **禁止複製業務程式；複製骨架用產生器。** 使用 `ysk-kit add module` 與 `create-ysk-app`。

## 現行棧

| 層 | 預設 | 備選 |
|---|---|---|
| Monorepo | pnpm 12.9.0 workspaces + Turborepo 2.11.7 | — |
| 語言 | TypeScript 6.0.3 `strict` + `exactOptionalPropertyTypes` | TypeScript 7 要等 dependency-cruiser 支援該 compiler API |
| Web / admin | Vite 8.3 + React 19.2 + TanStack Router + TanStack Query + Tailwind CSS 4 | 產品需要 SSR 才考慮 Next.js |
| 桌面 | Electron 44 + electron-vite 5 + Vite 7 | 穩定版 electron-vite 支援 Vite 8 之後（6 仍是 beta） |
| 流動應用 | Expo 57 / React Native 0.86 / React 19.2 | — |
| HTTP API | Express 5 adapter（預設） | `HTTP_ADAPTER=fastify` 切 Fastify 5 |
| 合約 | ts-rest + Zod 4 | — |
| 資料庫 | Prisma 7.10（`prisma-client` generator、MariaDB adapter、客戶端在 `apps/api/src/generated/prisma`） | `--db` 可改 PostgreSQL 或 SQLite adapter |
| 佇列 / 快取 | Redis 8.10 + BullMQ；未設 `REDIS_URL` 時用記憶體佇列 | — |
| 驗證 | JWT + refresh，經 `IAuthPort`；電郵／密碼與 `+852` OTP | 設齊 `TWILIO_*` 時用 Twilio Messages REST |
| UI | `@ysk-kit/ui`（AppShell、PageHeader、EmptyState、ErrorBanner、FormField、Spinner、Can） | — |
| 日誌 | Pino（生產環境 JSON） | — |
| Lint | Biome 2.5 | — |
| 測試 | Vitest 5.0、Testing Library、一條 Playwright Chromium smoke | — |
| 文件 | ts-rest → OpenAPI → Scalar（`GET /docs`） | — |
| 運行時 | Node 24 LTS | — |
| 觀測 | Prometheus `GET /metrics`；可選 OTLP traces／metrics；Compose 可選 Jaeger／Grafana | — |

預設 ORM 是 Prisma，因為遷移、Studio、巢狀寫入與招聘。Domain 仍然只對 `IRepository` port 說話——application 程式永不 `import { prisma }`。未附帶 Drizzle。tRPC 不是預設；公開 HTTP、webhook 與非 TypeScript 客戶端需要 REST。

## 目錄結構

```
ysk-kit/
├── AGENTS.md
├── .agents/skills/   共用 agent skill 包裝
├── docs/plans/       可保存的功能計劃
├── apps/
│   ├── api/          Express 5 預設；HTTP_ADAPTER=fastify
│   ├── web/          Vite 8
│   ├── admin/        Vite 8
│   ├── mobile/       Expo 57
│   └── desktop/      Electron 44 + Vite 7
├── packages/         @ysk-kit/* 程式庫（contracts、sdk、ui、jobs、…）
├── modules/          Prisma fragments 與 notes 形狀的產生器例子
├── tooling/
│   ├── create-ysk-app/
│   └── ysk-cli/
└── docs/
```

產生出來的產品在 `apps/api/src/modules/<name>/` 與 `apps/web/src/features/<name>/` 加入自己的 bounded context。Kit 的 Prisma 表沒有前綴。

### 套件

| 套件 | 職責 |
|---|---|
| `@ysk-kit/contracts` | enum、DTO、error code、ts-rest router、郵件模板 |
| `@ysk-kit/domain-kernel` | 共用 domain 原語 |
| `@ysk-kit/application` | 分頁輔助（`parsePageQuery`、`slicePage`） |
| `@ysk-kit/api-http` | 與框架無關的 `HttpHandler`、envelope 輔助、OpenAPI flatten、速率限制、安全標頭 |
| `@ysk-kit/api-express` / `@ysk-kit/api-fastify` | HTTP adapter |
| `@ysk-kit/sdk` / `@ysk-kit/web-sdk` | 有型別的客戶端與 React Query hooks |
| `@ysk-kit/ui` / `@ysk-kit/ui-logic` | DOM 元件；不含 DOM 的畫面規則 |
| `@ysk-kit/auth` / `@ysk-kit/apikey` / `@ysk-kit/crypto` | 密碼、JWT、雜湊 API 金鑰、AES-256-GCM |
| `@ysk-kit/jobs` / `@ysk-kit/mail` / `@ysk-kit/storage` / `@ysk-kit/i18n` | 佇列、郵件 port、預簽署、字典 |
| `@ysk-kit/llm` / `@ysk-kit/push` / `@ysk-kit/realtime` | Chat Completions、裝置推送、Socket.IO |
| `@ysk-kit/logger` / `@ysk-kit/observability` / `@ysk-kit/config` | Pino、OTel、環境變數 |
| `@ysk-kit/db-prisma` | 對 Prisma schema 的 enum-drift 測試 |

可發布的程式庫輸出 `dist/`，並為 npmjs（`@ysk-kit` scope）設定 `publishConfig`。工作區解析 TypeScript 原始碼。

## 分層

```
apps/web  ──►  @ysk-kit/web-sdk  ──►  @ysk-kit/contracts
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

- `domain` 只可 import `@ysk-kit/domain-kernel` 與 `@ysk-kit/contracts`。
- `application` 只可 import domain 與 contracts。
- `infra` 實作 port。HTTP handler 把傳輸對應到 use-case，不持有 Prisma。
- `apps/web` 不可 import Prisma、Express、Fastify、`@ysk-kit/auth`、jobs、mail、push 或 AWS SDK。
- `apps/api` 不可 import React 或 `@ysk-kit/ui`。
- `pnpm layers`（dependency-cruiser）強制這些方向。逐步說明：[hexagonal 指南](guides/hexagonal.zh.md)。

身分模組是參考實作：`apps/api/src/modules/identity/{domain,application,infra}`。

## Enum、DTO、Command

不用 TypeScript `enum`。字面值只在 contracts 寫一套，Prisma 鏡像同一組：

```ts
export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
```

三種形狀分開：

| 形狀 | 位置 | 例子 |
|---|---|---|
| 線上 DTO | `@ysk-kit/contracts` | `UserDtoSchema` |
| Command | `@ysk-kit/contracts` | `CreateUserCommandSchema` |
| Domain entity | 模組 `domain/` | 帶行為的 `User` |

Prisma enum 字面值與 contracts 漂移時，`pnpm --filter @ysk-kit/db-prisma test` 會失敗。

## Envelope

每條 JSON 路由都回 `{ ok: true, data }` 或 `{ ok: false, error }`，單一資源也是。分頁放在 `data` 內。輔助：`@ysk-kit/contracts` 的 `OkSchema` / `ErrSchema`。

例外（只有這些）：

| 路徑 | 傳輸 | 原因 |
|---|---|---|
| `POST /v1/llm/stream` | SSE（`event: delta\|done`） | 權杖串流 |
| `GET /v1/billing/invoices/:id/pdf` | HTTP 302 | Stripe 託管 PDF |
| `GET /docs` | HTML | Scalar 介面 |
| `GET /openapi.json` | OpenAPI 文件 | 機器發現 |

詳情：[envelope 指南](guides/envelope.zh.md)。

## HTTP adapter

Handler 是 `@ysk-kit/api-http` 裏與框架無關的 map。預設 Express 5。設 `HTTP_ADAPTER=fastify` 時 Fastify 5 服務同一套合約。LLM SSE 與本地檔案 PUT 兩邊都有。只有 composition（`apps/api/src/composition.ts`）會 `new` adapter。

## 客戶端

Web 與 admin 使用 TanStack Router 與 `features/*`。表單重用 command 的 Zod schema。權限用 contracts 的 `Permission` 加 `@ysk-kit/ui` 的 `<Can>`。AppShell 的合約是 `{ brand, nav, trailing?, children }`。

流動應用是 Expo（登入、主頁、收件箱、組織列表、邀請、`DevicePort`、`FilePickerPort`）。桌面經 `@ysk-kit/sdk` 呼叫 API，`platform: desktop`；權杖在可用時使用 Electron `safeStorage`。Prisma 永不在 Electron 內運行。

## 產生器

| 命令 | 作用 |
|---|---|
| `create-ysk-app` | 複製本樹（或 php-bridge 模板），套用 flavor 與 `--preset`，寫入 `.ysk-kit.json`。TTY 會提示未傳的旗標；`--yes` 略過提問 |
| `ysk-kit add module` | 一條 hexagonal HTTP 切片 |
| `ysk-kit add <capability>` | 合併 Prisma、環境變數、依賴；llm／team／billing／push 在缺失時複製源碼 |
| `ysk-kit generate openapi` | 寫出 `docs/openapi.yaml` |
| `ysk-kit upgrade` | 把允許清單上的護欄（法律、skills、TypeScript／Biome 設定、`pnpm layers`）從本 kit 複製到產品 |
| `ysk-kit check agent` | 標記 TypeScript `enum`、客戶端 Prisma，以及 web/admin/mobile/desktop 的 raw `fetch` |
| `ysk-kit doctor` | engines、必要環境變數、不安全預設、資料庫遷移、護欄差異，以及 `check agent` |

`--preset thin`（預設）複製後剝走 llm、billing、organizations 與 devices。`--preset full` 保留完整示範。`php-bridge` 與 `static-web3` 忽略 preset。產品以 `ysk-kit upgrade` 更新 kit 護欄；日常路徑不會從 registry 安裝 `@ysk-kit/*`。手冊：[CLI](cli/index.zh.md)、[flavors](guides/flavors.zh.md)、[能力](guides/capabilities.zh.md)、[升級](guides/upgrade.zh.md)。

## 產品範圍

以下是產品決定，不是未完成的作業：

- 預設 HTTP 是 Express；Fastify 是第二個 adapter。Hono、Nest、Next 不是預設。
- 預設 ORM 是 Prisma。未附帶 Drizzle。
- 公開 API 是 ts-rest + OpenAPI。釘選與 v2 退出路徑記在 [ADR 0001](adr/0001-ts-rest.zh.md)。tRPC 與 GraphQL 不是預設。
- 行業 domain 寫在產品倉。
- CI 使用記憶體 port。不啟動 Redis、Stripe、Twilio、FCM、Jaeger、Grafana 或 OTLP collector。
- Kit 的資料表沒有 `ysk_` 前綴。
- 產品需要交易時，在 API infra 包 Prisma `$transaction`。`@ysk-kit/application` 提供分頁輔助，沒有 unit-of-work port。
