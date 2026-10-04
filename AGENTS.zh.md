# YSK Kit — agent 法律

Language: [English](AGENTS.md) · 中文

改程式之前先讀本檔。架構：`docs/architecture.zh.md`。操作步驟：`docs/recipes/`。命令：`docs/cli/`。程序：`docs/skills/`。變更紀錄：`CHANGELOG.zh.md`（最近三個版本在根 README）。階段日記：`docs/history.zh.md`。路線圖：`docs/product-plan.zh.md`。

## 本倉是甚麼

合約先行的 SaaS 平台（pnpm 12 + Turborepo + Node 24）。產品業務 domain 不寫入 kit。本樹是可運行的 `saas` flavor：身分、檔案、通知、工作、郵件、API 金鑰、加密、即時通訊已經接上。

## 發明新目錄之前

開新產品：

```bash
pnpm create @ysk-kit/app my-product --preset thin --db mysql --flavor saas
# 本倉：pnpm --filter @ysk-kit/create-app start my-product --preset thin --db mysql --flavor saas
pnpm ysk-kit add module <kebab-name> --prisma --web
```

`--preset full` 複製完整示範（llm、billing、orgs、push 已經掛上）。還原被剝走的能力：`pnpm ysk-kit add llm|team|billing|push`（`billing` 須先有 `team`）。遷移之後執行 `pnpm db:seed`，以 `admin@ysk.hk` / `ysk-admin-dev` 登入（密碼在 `.env.example`）。

在本倉或已產生的產品新增 HTTP 功能：

```bash
pnpm ysk-kit add module <kebab-name> --prisma --web
```

該命令寫出 hexagonal 切片、ts-rest 合約、SDK resource、web-sdk hooks、Express + Fastify 掛載、composition 接線，以及 memory-repo 測試。業務規則填在 `application/` 與 Prisma model。不要另起一套目錄樹。

## 硬規則

1. `@ysk-kit/contracts` 是 enum、DTO、error code、ts-rest 路徑的唯一來源。先加 DTO 與 `OkSchema` / `ErrSchema`。
2. 不用 TypeScript `enum`。在 contracts 用 `as const` + Zod。
3. Prisma 只留在 `apps/api/src/modules/*/infra`。客戶端永不 import `@prisma/client` 或 `apps/api/src/generated`。
4. Web / admin / mobile / desktop 只經 `@ysk-kit/sdk` 呼叫 API（React Query 經 `@ysk-kit/web-sdk`）。不要對 kit 路徑直接 `fetch`。
5. domain 與 application 層不 import Express、Fastify、Prisma、React 或 BullMQ。
6. 每條 JSON 路由的 envelope 都是 `{ ok: true, data }` / `{ ok: false, error }`。
7. Envelope 例外只有：LLM SSE（`POST /v1/llm/stream`）、發票 PDF 的 HTTP 302、`GET /docs`、`GET /openapi.json`。
8. 已開啟 `exactOptionalPropertyTypes`：省略可選鍵，不要傳 `undefined`。
9. 測試使用記憶體 port。CI 不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。
10. 從 `GET /openapi.json` 或 `docs/openapi.yaml` 發現路徑。呼叫仍然經 `@ysk-kit/sdk`。

## 每個功能之後

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

`pnpm layers` 必須保持綠色（客戶端不碰 Express / Prisma / jobs / mail / push / AWS SDK）。`pnpm ysk-kit check agent` 必須保持綠色（沒有 TypeScript `enum`、客戶端沒有 Prisma、web/admin/mobile/desktop 沒有 raw `fetch`）。

## 不要

- 把沙龍、交易、地圖或其他行業 domain 放進本 kit。已完成教程在 `examples/`，套用到新目的地（`pnpm --filter @ysk-kit/examples start apply <slug> --yes`）。
- 從 web/admin/mobile/desktop import `@ysk-kit/observability`。
- 把 Hono / Drizzle / Nest / Next 設為預設。
- 把密鑰、OTP 代碼、Stripe `sk_` 或 webhook 密鑰寫進日誌。
