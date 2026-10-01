# 測試

Language: [English](testing.md) · 中文

## Vitest（預設）

API 測試注入記憶體 port。它們不啟動 MySQL、Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。`create-memory-input.ts` 組出與生產 composition 相同的 service。

```bash
pnpm test
pnpm test:coverage
```

Coverage 用 Vitest v8，範圍是 `apps/*/src`、`packages/*/src` 與兩套 CLI 的 `src`。略過 generated Prisma、templates、e2e、`infra/prisma-*.ts` 與行程入口（`main.ts`、`worker.ts`、Vite `main.tsx`）。設定門檻是行、函式、陳述式、分支均 95%。`pnpm test:coverage` 出報告；CI `check` 仍跑 `pnpm test`，直至其餘 client 頁面與 live adapter 補上缺口。單元測試維持記憶體 port。

Enum 字面值：`pnpm --filter @ysk-kit/db-prisma test` 比較 Prisma schema 與 `@ysk-kit/contracts`。

## Testing Library

Web 登入有一個無效電郵的元件測試。隨 web 套件的 Vitest 任務運行（`pnpm test` 已包含）。表單欄位優先使用 create-command 的 Zod schema。

## Playwright

`apps/web/e2e` 有一條 Chromium smoke。它用 `tsx` 啟動 API（工作區套件匯出 TypeScript），以及 5173 的 Vite preview。

```bash
pnpm --filter @ysk-kit/web exec playwright install chromium
pnpm --filter @ysk-kit/web build
pnpm e2e
```

需要空閒的 3001 與 5173、已遷移的資料庫，以及種子（CI 會做這些）。本機在未設 `CI` 時會 `reuseExistingServer`。

## 分層

```bash
pnpm layers
```

必須保持綠色。見 [hexagonal](hexagonal.zh.md)。

## Agent 掃描

```bash
pnpm ysk-kit check agent
```

對產品根目錄做文字掃描。有發現時退出 1。

| 規則 | 意思 |
|---|---|
| `no-ts-enum` | `apps`、`packages` 或 `modules` 出現 TypeScript `enum` / `const enum` |
| `clients-no-prisma` | web／admin／mobile／desktop import 了 Prisma 或 generated client |
| `clients-no-raw-fetch` | 那些 app 呼叫了 `fetch(` |

略過 `*.test.ts`、註解行與 generated 目錄。Admin Bull Board 探測頁 `apps/admin/src/features/queues/queues-page.tsx` 可以使用 `fetch`。CLI 參考：[`ysk-kit check agent`](../cli/ysk-kit.zh.md#ysk-kit-check-agent)。

`@ysk-kit/biome` 把 Biome `style.noEnum` 設為 `error`，因此 `pnpm lint` 也會拒絕 TypeScript enum。

## CI

| Job | 運行甚麼 |
|---|---|
| `check` | `pnpm lint && pnpm layers && pnpm ysk-kit check agent && pnpm typecheck && pnpm test` |
| `thin-smoke` | `create-ysk-app --preset thin --flavor saas --no-admin --no-mobile --db sqlite`，然後 generate／layers／`ysk-kit check agent`／typecheck／test／OpenAPI |
| `example-smoke` | 把每個已完成實例套用到 sqlite dest |
| `e2e` | MySQL 8.4 服務、migrate deploy、種子、Chromium Playwright。API 用 `tsx`。沒有 Redis、Stripe、Twilio、FCM、Jaeger、Grafana |
| `Release` | 只在 GitHub owner 為 `ysk` 時運行 |

功能完成後，本機門檻是：

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```
