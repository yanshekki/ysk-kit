# 計劃：程式審查所見的安全缺口

Language: 英文配對 `2026-10-06-security-gaps.md` · 中文 `2026-10-06-security-gaps.zh.md`

| | |
|---|---|
| **Slug** | `security-gaps` |
| **日期** | 2026-10-06 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-06-security-gaps.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。

已在 `main` @ `707ae2c` 覆核（與 2026-10-06 研究報告同一 commit）。寫本計劃前已重讀現行樹。

## 目標與使用者問題

程式審查列出 living `saas` kit 的安全熱點。營運者與產生出來的產品會繼承這些預設。本次修補已確認的缺口：權杖不以明文落盤、Electron 達到官方清單基線、日誌不會回顯密鑰、`/v1/llm` 不能接收客戶端 `system` 提示且有配額、Stripe webhook 以 `event.id` 去重。

## 範圍

- 包含：
  - Desktop `safeStorage` 失敗時只留記憶體，並記錄不含密鑰的警告
  - Electron CSP、`sandbox: true`、導航／新視窗拒絕、IPC sender 檢查
  - `@ysk-kit/logger` 的 pino redaction
  - LLM：客戶端訊息只准 `user`｜`assistant`；伺服器前置 `LLM_SYSTEM_PROMPT`；以 `LlmUsage` 做每用戶配額，回 `RATE_LIMITED`
  - Stripe webhook：持久化 `ProcessedWebhookEvent`、略過重送、略過同一組織較舊的 `event.created`、維持 raw body 驗簽
  - Capability 模板、`capability-patches`、`thin.ts`、環境變數文件、架構說明
  - 26 個公開套件的 patch changeset；README 最近三版窗口與 CHANGELOG
- PR 列為後續（今次不做）：web／admin 的 `localStorage` 權杖；未來模組的通用組織成員規則

## 非目標

- 不含：
  - 新增 `docs/skills/`（另一個 PR）
  - Helmet（API 已用 `applySecurityHeaders` 設 CSP）
  - web／admin 改用 httpOnly cookie session
  - 額外 Stripe 事件（`customer.subscription.*`、`invoice.payment_failed`）
  - 為 webhook 新增 BullMQ job（`activate` 是本地 upsert；先認領再套用仍然快）
  - Electron fuses／自訂 protocol（本輪不要求）
  - 改 flavor／preset／資料庫預設
  - 合併或 npm 發佈

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身（會複製 desktop／api／logger 的 flavor） | desktop flavor 繼承 Electron 修正；其餘繼承 logger／LLM／billing |
| Preset | thin／full | thin 會拿掉 LLM／billing／`ProcessedWebhookEvent`；`add llm`／`add billing` 可還原 |
| Capabilities | llm、billing、desktop | 既有 IP 速率限制保留；LLM 再加每用戶配額 |

## 合約先行

DTO 名稱、欄位、error code、ts-rest 路徑。先加 `OkSchema`／`ErrSchema`，才寫 handler。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | `LlmMessage` 仍用 `LlmRole`（`system`｜`user`｜`assistant`） | 供應商／伺服器訊息 |
| Command | `LlmCompleteCommand.messages` 用 `LlmClientMessage`（`user`｜`assistant`） | 破壞性：客戶端 `system` → `VALIDATION_FAILED`（422） |
| Error codes | 重用 `RATE_LIMITED`（429）、`VALIDATION_FAILED`、`UNAUTHENTICATED` | 不新增代碼 |
| 路徑 | `/v1/llm/complete`、`/v1/llm/stream` 不變 | Envelope；SSE 例外不變 |
| Webhook | `POST /v1/billing/webhook` 仍在 ts-rest 之外 | Envelope `{ ok: true, data: { received: true } }` |

## 資料模型／Prisma 與遷移

只做 Prisma 7.10 的加法遷移。不 reset。

`ProcessedWebhookEvent`：`id`、`provider`、`eventId`、`eventType`、`eventCreatedAt`、`organizationId?`、`createdAt`。唯一鍵 `(provider, eventId)`。索引 `(provider, organizationId, eventCreatedAt)`。不加 FK（未知組織仍須認領）。

`LlmUsage` 已有 `(userId, createdAt)` 索引，供 `countSince`。

遷移：`apps/api/prisma/migrations/20261006120000_processed_webhook_event/`。片段：`modules/billing/prisma/subscription.prisma`。thin 會刪除此 model。

## 模組切片與分層

- `packages/logger` — pino `redact`
- `packages/config` — `LLM_SYSTEM_PROMPT`、`LLM_QUOTA_MAX`、`LLM_QUOTA_WINDOW_MS`
- `packages/contracts` — `LlmClientRole`／`LlmClientMessage`
- `apps/api/src/modules/llm` — 前置 system prompt；呼叫供應商前檢查配額
- `apps/api/src/modules/billing` — `IProcessedWebhookRepository`；`handleStripeEvent`
- Express 與 Fastify 呼叫 `applyVerifiedStripeWebhook`（raw body 驗簽，再入 application）
- domain／application 不碰 Express、Fastify、Prisma、React、BullMQ

## SDK／web-sdk／客戶端表面

SDK `llm.complete` 的 body 跟隨 command（沒有 `system`）。不要 raw `fetch`。Desktop 只改 main／preload：抽出 `secret-store` 與 `security`；renderer 仍用 `@ysk-kit/sdk`。

## Jobs／mail／realtime／notifications

沒有。Webhook 在認領後於行程內套用（本地 upsert）。不新增 `JobName`。

## 安全與私隱

- 權杖：永不把明文寫入磁碟；警告不含密鑰
- IPC：只接受已載入的 renderer origin／`file:`
- 日誌：遮蔽 authorization、cookie、token、password、API key、webhook／Stripe 密鑰
- LLM：伺服器持有 system prompt；每用戶配額；既有 IP `RATE_LIMIT_*` 仍然生效
- Webhook：簽名與時間窗不變；以 Stripe `event.id` 冪等
- 不要把 OTP、Stripe `sk_`、webhook 密鑰寫進日誌

## 測試計劃

只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

- [ ] Desktop secret-store：加密不可用時不寫盤；記憶體來回；警告字串不含密鑰
- [ ] Desktop security：CSP 字串；導航允許清單用 `URL` origin；IPC 拒絕未知 frame；新視窗 deny
- [ ] Logger：production JSON 遮蔽 `password`、`authorization`、`token`、`cookie`，以及巢狀 `req.headers.authorization`
- [ ] LLM：客戶端 `system` → 422；服務前置設定的 prompt；超配額 → 429 `RATE_LIMITED`（complete 與 stream）
- [ ] Webhook：錯簽名 → 401；第一次事件開通；重送 → 只處理一次；較舊 `created` 在較新之後到達 → 不覆寫
- [ ] Express 與 Fastify webhook 行為一致
- [ ] Capability 模板與 living llm／billing 樹位元組一致

## 驗證命令

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

可選：`pnpm lint`。CI：`check`、`thin-smoke`、`e2e`、`flavor-smoke`、`example-smoke`。不要合併。不要發佈。

## 文件／變更紀錄／changeset

- [ ] **不要**改 `docs/skills/`
- [ ] `docs/cli/env.md` 與 `.zh.md`、架構的 desktop 句、`.env.example`
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三版窗口（`v1.2.2` 安全；保留已發佈的 `v1.2.1` 與 `v1.2.0`）
- [ ] 列出全部 26 個公開 `@ysk-kit` 套件的 patch changeset

## 風險與回滾

- 破壞性：仍傳送 `role: "system"` 的客戶端會驗證失敗 — 已記錄；改由伺服器 prompt 取代
- 遷移只加法；回滾是讓該表閒置
- Linux 上 `safeStorage` 經常不可用 — 每次啟動要重新登入（預期行為）
- 認領後套用失敗：釋放該列讓 Stripe 重試；`NOT_FOUND` 保留認領
- 回滾：還原 commit；不要 `migrate reset`

## 任務清單

按順序列出。每項都有驗收條件。

1. [ ] 合約 — *驗收：* `LlmClientRole` + `LlmClientMessage`；`LlmCompleteCommand` 拒絕 `system`；沒有 TypeScript `enum`
2. [ ] Config／logger — *驗收：* 新環境變數；pino redact 已測
3. [ ] Desktop — *驗收：* 沒有明文後備；CSP + sandbox + 導航 + IPC 測試
4. [ ] LLM application — *驗收：* 記憶體 port 測試涵蓋 prompt 與配額；HTTP 422／429
5. [ ] Webhook — *驗收：* Prisma model + 遷移；記憶體與 HTTP 重送／次序測試
6. [ ] 模板／patches／thin — *驗收：* `capability-templates` 位元組相符；thin 刪除 `ProcessedWebhookEvent`
7. [ ] 驗證 — *驗收：* 上述五條命令全綠
8. [ ] 文件／changeset — *驗收：* 中英配對；26 套件 patch changeset

## 未決問題

- 沒有阻擋項。Web 權杖儲存與通用組織成員規則留在 PR 作後續。
