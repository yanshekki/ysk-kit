# 產品方向

Language: [English](product-plan.md) · 中文

YSK Kit 的目的，是讓新產品把第一天花在業務規則，而不是重做 enum、HTTP envelope、驗證或四端客戶端。人與 AI agent 走同一條路：以 thin 開倉、加模組、填 `application/` 與 Prisma，再用 `pnpm layers` 驗證。

## 今天可以做甚麼

| 範圍 | 現已提供 |
|---|---|
| 開倉 | `create-ysk-app --preset thin\|full`（預設 thin）與六個 flavor。TTY 會提示未傳的旗標；`--yes` 略過提問 |
| 切片 | `ysk add module` 寫出合約、DTO、repo、Express + Fastify、SDK、web-sdk、頁面、測試 |
| 能力 | 十六項已編目的 add；`llm`、`team`、`billing`、`push` 在缺失時複製源碼 |
| 客戶端 | Vite 8 web/admin（AppShell）；Expo 流動應用（組織列表／邀請）；Electron 桌面 |
| 資料 | `pnpm db:seed` upsert `admin@ysk.hk` 與 `user@ysk.hk` |
| 驗證 | `pnpm layers`、typecheck、Vitest（記憶體 port）、Testing Library 登入、一條 Playwright smoke |
| 文件 | 雙語公開手冊、CLI 參考、agent skills、`AGENTS.md` |
| 護欄 | `.ysk-kit.json` 記錄 kit 版本、flavor、preset 與資料庫。`ysk upgrade` 從 kit 工作副本複製允許清單上的法律、skills 與編譯／lint 設定 |
| Agent 掃描 | `ysk check agent` 標記 TypeScript `enum`、客戶端 Prisma，以及 web/admin/mobile/desktop 的 raw `fetch`。Biome `noEnum` 為 error。CI 會跑此掃描 |

十五分鐘路徑：

```text
create-ysk-app my-clinic --flavor saas --preset thin --db mysql
ysk add module appointment --prisma --web
pnpm db:migrate && pnpm db:seed && pnpm test && pnpm layers && pnpm dev
```

結果：`GET/POST /v1/appointments` 使用 envelope、SDK 有 `client.appointments`、Web 有一頁 list+create（同一套 Zod schema）、memory-repo 測試，以及 OpenAPI 路徑。

## 計劃中

| 工作 | 原因 |
|---|---|
| GitHub Packages 在擁有者與 `@ysk` 一致時 | 可發布程式庫已設定 `publishConfig`。GitHub 擁有者與 npm scope 一致時，registry 路徑才用得着。日常更新使用 `ysk upgrade`。 |

## 預設棧以外

以下不進入預設，讓 kit 維持一條有主見的路徑：

| 選擇 | 原因 |
|---|---|
| 以 Hono、Nest、Next.js 為預設 HTTP／SSR | Express + Fastify 已覆蓋 adapter 替換；Next 是需要 SEO／SSR 的產品決定 |
| 以 Drizzle 為預設 ORM | Prisma 是招聘與遷移的預設；domain port 允許日後加 adapter |
| 以 tRPC 或 GraphQL 為預設 | 公開 REST、webhook 與非 TypeScript 客戶端需要 OpenAPI |
| Kubernetes manifest | Compose + PM2 對齊本機與單機生產；叢集圖表屬於產品 |
| 稅務識別碼介面、用量計費 | Stripe Checkout + 組織座位覆蓋常見 SaaS |
| Electron 安裝包／自動更新 | 桌面是 API 客戶端模板，不是應用商店流水線 |
| APNs 或 web push | Expo Push + FCM HTTP v1 覆蓋流動應用模板 |

行業 domain（市集 listing、交易所連接器、沙龍預約）寫在產品倉，不寫在本 kit。
