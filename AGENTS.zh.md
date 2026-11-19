# YSK Kit — agent 指南

Language: [English](AGENTS.md) · 中文

本檔是 agent 法律的**唯一**來源。不要複製到工具包裝檔。

**先讀 [docs/agent/NOW.md](docs/agent/NOW.md)。** 程序：[docs/skills/index.zh.md](docs/skills/index.zh.md)。架構：[docs/architecture.zh.md](docs/architecture.zh.md)。命令：[docs/cli/](docs/cli/)。

本 checkout 是活的 `saas` flavor。產品 domain 不進本 kit。新 HTTP 資源：`pnpm ysk-kit add module <kebab-name> --prisma --web`。

## 硬規則

1. **`@ysk-kit/contracts` 是 enums、DTO、錯誤碼與 ts-rest 路徑的唯一來源。** 在 handler、SDK 或 UI 之前先加 DTO 與 `OkSchema`／`ErrSchema`。
2. **不要用 TypeScript `enum`。** 在 contracts 用 `as const` + Zod。
3. **Prisma 留在 `apps/api/src/modules/*/infra`**（以及共用的 `apps/api/src/infra`）。客戶端不得 import `@prisma/client`、`@ysk-kit/db-prisma`、`apps/api/src/generated` 或 `generated/prisma`。
4. **web／admin／mobile／desktop 只經 `@ysk-kit/sdk` 呼叫 API**（React Query 經 `@ysk-kit/web-sdk`）。不要對 kit 路徑 raw `fetch`。
5. **domain 與 application 不得 import Express、Fastify、Prisma、React 或 BullMQ。** `pnpm layers` 強制分層。
6. **每條 JSON 路由都用 `{ ok: true, data }`／`{ ok: false, error }`。**
7. **envelope 例外只有：** LLM SSE（`POST /v1/llm/stream`）、發票 PDF HTTP 302、`GET /docs`、`GET /openapi.json`。新例外必須有明確使用者決定，並在那四項旁邊更新文件，且不走 ts-rest。
8. **`exactOptionalPropertyTypes` 已開啟。** 省略可選鍵；不要傳 `undefined`。
9. **測試用記憶體 port。** CI 不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。
10. **從 `GET /openapi.json` 或 `docs/openapi.yaml` 發現路徑。** 呼叫仍走 `@ysk-kit/sdk`。
11. **先用 `test-plan` 規劃測試，再用 `write-tests` 撰寫。** 優先資料遺失、授權、金錢、併發與租戶；用記憶體 port。
12. **客戶端 UI 跟 `ui-design`，`ui-review` 通過才算完成。** 複雜結構先走 `layout-system`。重用 `@ysk-kit/ui` 與 zinc 主題。

## 何時寫計劃

預設 **精簡**：`pnpm ysk-kit plan <slug>` 寫入 `docs/plans/<yyyy-mm-dd>-<slug>.md`（`plan: lean`）。六個章節：決定、檔案、測試、風險、完成、未決問題。決定最多 15 行。`/compact` 之後只重讀決定。`--zh` 才寫中文配對；預設不寫。

只有 HTTP 路由、Prisma model、授權、密鑰、webhook 或新的 envelope 例外才用 **`--full`**（19 章模板，`plan: full`）。

可略過計劃（除非被要求）：只改錯字、只改註解，或單檔機械式重新命名。協議要求計劃時，不要先實作再補計劃。

## 驗證

`pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors && pnpm ysk-kit check docs-budget`

單一套件：`pnpm --filter <pkg> test`。只有跨套件工作才跑完整鏈。

## 不要

- 把沙龍、交易所、地圖或其他行業 domain 放進本 kit。教程在 `examples/`。
- 從 web／admin／mobile／desktop import `@ysk-kit/observability`。
- 把 Hono／Drizzle／Nest／Next 當成預設。
- 把本檔複製進 `.cursor/`、`.claude/`、`.github/` 或 `GEMINI.md`。
- 把密鑰、OTP、Stripe `sk_` 或 webhook secret 寫進日誌。
- 搜 `docs/qa/**/*.png`，或 14 天以前的 `docs/plans/`，除非使用者點名。
- 在本 kit 發明 `fund-protocol` 檔。若產品自己有該文件，跟產品的。
