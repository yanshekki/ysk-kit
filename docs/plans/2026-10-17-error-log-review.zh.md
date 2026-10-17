# 計劃：錯誤日誌檢查

Language: 英文配對 `2026-10-17-error-log-review.md` · 中文 `2026-10-17-error-log-review.zh.md`

| | |
|---|---|
| **Slug** | `error-log-review` |
| **日期** | 2026-10-17 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-17-error-log-review.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-17-error-log-review.zh.md`。

## 目標與使用者問題

開發者與 agent 現在看不見、也不知道如何處理真正的伺服器失敗。Envelope 已有 `error.code` 與 `requestId`，Pino／OTel／Prometheus 亦已存在，但 Express 與 Fastify 的 error middleware 只回 `{ ok: false }`、不呼叫 `logger.error`，SDK 丟 `AppError` 時丟掉 `requestId`，Grafana 亦只有行程 CPU／RSS。結果 `INTERNAL` 靜靜消失，人只會 `console.log` 或想接 Sentry／建 `ErrorLog` 表。

此改動把「減少錯誤」變成可重複的環：預防（靜態 `check errors`）→ 觀測（structured ERROR log + 有限 cardinality 指標）→ 賦能（skill 與 `check logs` 把 exemplar `requestId` 變成紅燈測試）。

## 範圍

- 包含：HTTP error handler（Express + Fastify）對 `INTERNAL`／5xx／未知 throw 寫 structured `logger.error({ err, requestId, code, status })`。預期 4xx `AppError` 不打 ERROR（access log 已有 status）。
- 包含：`registerWorkers` 在 job 失敗時 `logger.error`（span 已 `recordException`）。
- 包含：有限 cardinality 的 Prometheus 計數 `ysk_http_errors_total{code,status}`（只有既有 `ErrorCode` + HTTP status）。Grafana 加 5xx／按 code 面板。
- 包含：可選 `LOG_LEVEL`（預設不變：production `info`，其餘 `debug`）。
- 包含：可選 `AppError.requestId`；SDK 從 envelope 複製；kit 登入畫面的 `ErrorBanner` 可顯示。不加 toast。不加 ErrorBoundary。
- 包含：`ysk-kit check errors`（原始碼）與 `ysk-kit check logs`（JSONL）。Doctor 對靜態 finding 給 warn。CI 跑 `check errors`。Skill `error-log-review`、recipe、observability 指南。修正過期的 secrets-logging（logger 已 redact）。

## 非目標

- 不含：新 capability 名稱、Prisma `ErrorLog`、admin 錯誤收件箱（不要與 `AuditLog` 混用；不要把 stack／PII 放入 MySQL 或瀏覽器）。
- 不含：Sentry／Datadog RUM／Loki 作為 kit 預設（與 Kubernetes 同一類：預設棧以外）。
- 不含：新 envelope 例外、新 `ErrorCode`、客戶端 import `@ysk-kit/logger` 或 observability。
- 不含：CI 啟動 Jaeger／Grafana／Redis。`check logs` 不進入五條 verify chain（單元測試用 silent／pretty pino）。
- 不含：全站 ErrorBoundary、改遍 examples overlay、用 request path 做 Prometheus label（高 cardinality）。

## 假設

- 「賦能開發者」是 SOP + 自動化 + 相關 ID，不是公開羞辱或強迫每人開 Grafana。
- 生產（或一次 capture）可以收集 JSON stdout。Compose 的 Jaeger／Grafana 維持可選。
- 本樹 `application/` 已多用 `AppError`；針對 `throw new Error(` 的靜態規則應是低噪音。
- 不需要新 HTTP 資源。Audit 繼續只記領域事件。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | Logger、adapter、CLI、skill 會經 `ysk-kit upgrade` 抄到所有 flavor |
| Preset | thin／full | Error handler 在預設 HTTP 棧上 |
| Capabilities | 無新增 | 重用 `audit-log`（領域）與永遠存在的 `@ysk-kit/logger`／`@ysk-kit/observability` |

## 現況與重用

先探索樹，才提議新檔。列出相關的既有檔案與符號，並寫出倉內路徑（模組、合約、SDK resource、hooks、產生器例如 `ysk-kit add module`）。說明會重用甚麼，而不是另寫一套。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `packages/contracts/src/errors/codes.ts` | `ErrorCode` | 日誌、指標、CLI 的唯一分類 |
| `packages/api-http/src/envelope-error.ts` | `envelopeError` | mapping 保持純函式；加 `classifyEnvelopeLog` |
| `packages/api-express/src/error-handler.ts` | `errorHandler` | 回 JSON 前打 log；factory 接 logger 與計數 |
| `packages/api-fastify/src/errors.ts` | `registerErrorHandler` | 同一套 classify + log |
| `packages/logger/src/index.ts` | `createLogger`、`LOG_REDACT_PATHS` | JSON、redact、可選 level |
| `packages/observability/src/pino-otel-mixin.ts` | `pinoOtelMixin` | 每行帶 `trace_id`／`span_id` |
| `packages/observability/src/job-span.ts` | `withJobSpan` | 保留 span 例外；補 stdout ERROR |
| `deploy/grafana/dashboards/ysk-api.json` | YSK API dashboard | 加 5xx／按 code 面板 |
| `tooling/ysk-cli/src/check-agent.ts` | findings 格式 | `check errors`／`check logs` 的模式 |
| `docs/skills/debug-issue.md` | 紅燈迴圈 skill | 日誌複盤的下游；不要合併 |

最大缺口：error middleware 從不打 log；SDK 丢掉 `requestId`；沒有 log JSON 合約；沒有開發者 SOP。

## 考慮過的方案

有真正替代方案時，至少列出兩個可行做法。每列寫權衡：複雜度、觸及的分層、遷移風險、客戶端影響。然後寫選定方案與原因。

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A 平台 DX + 修觀測缺口 | 中 | adapter、logger、observability、CLI、skills | 無 | 只加可選 `requestId` | Structured ERROR、有限指標、兩個 check 命令 |
| B Prisma `ErrorLog` + admin inbox + `add module` | 高 | 合約、Prisma、admin | 新表 + retention | 新 HTTP + UI | 把觀測混進領域；PII 進 MySQL |
| C 預設接 Sentry | 中 | 新 vendor + capability | 無 | SDK／RUM | 新 capability 須先問；測試不可打出去 |

**選定：** A  
**原因：** 符合 Google SRE（log 診斷、metric 告警、trace 串連）、OTel 例外嚴重程度（未處理 = ERROR；預期 4xx 不是 ERROR），以及 kit 法律（不發明 capability、測試不開 Jaeger、客戶端不 import observability）。

## 合約先行

DTO 名稱、欄位、error code、ts-rest 路徑。先加 `OkSchema`／`ErrSchema`，才寫 handler。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | 無 | Envelope 已有 `ApiErrorBody.requestId` |
| Command | 無 | 不加 ts-rest 路徑 |
| Error codes | 重用既有 `INTERNAL` 與 4xx | 不新增代碼 |
| 路徑 | 無 | 不加 `/v1/…` |
| Log 合約 | JSON ERROR 行 | `requestId` 或 `reqId`、`code`、Pino `err`；由 `check logs` 執行，不是 ts-rest |
| 指標 | `ysk_http_errors_total{code,status}` | 七個 code，不用 path label |

`AppError.requestId` 是 `@ysk-kit/domain-kernel` 的附加欄位（`exactOptionalPropertyTypes`：沒有就省略）。SDK 複製 envelope 的 `error.requestId`。

## 資料模型／Prisma 與遷移

沒有。不加 `ErrorLog`。`AuditLog` 不變。不需要 `pnpm db:migrate`。

## 模組切片與分層

domain 與 application 不碰 Express、Fastify、Prisma、React、BullMQ。不改 `apps/api/src/modules/<name>/application` 的業務規則（既有 `AppError` throw 維持）。

- `packages/api-http`：`classifyEnvelopeLog` — `INTERNAL` 或 status ≥ 500 → `error`，否則 `silent`。
- `packages/api-express`／`packages/api-fastify`：先 log 再送 envelope。Adapter 不 import observability（計數經 `CreateAppInput` callback）。
- `apps/api` 的 `app.ts`／`app-fastify.ts`／`composition.ts`／`main.ts`／`worker.ts`／`workers.ts`：接 logger、可選 `LOG_LEVEL`、job ERROR、指標 recorder。
- 測試用記憶體 pino destination 與假計數。不要啟動 Jaeger 或 Grafana。

## SDK／web-sdk／客戶端表面

`packages/sdk` 的 `HttpClient` 把 `requestId` 抄到 `AppError`。不加新 web-sdk hook。`packages/ui` 的 `ErrorBanner` 接受可選 `requestId`。Web 與 admin 登入畫面做示範。不要 raw `fetch`。客戶端不要 Prisma。不加 toast／ErrorBoundary。

## Jobs／mail／realtime／notifications

Job 失敗：`logger.error({ err, job })` 再 rethrow，讓 `withJobSpan` 仍然記錄例外。Mail、realtime、notification payload 不變。不加新 `JobName`。

## 安全與私隱

授權不變。ERROR log 可以有 **伺服器端** stack。Envelope `details` 仍然不可有 SQL、stack 或密鑰名稱。繼續用 `LOG_REDACT_PATHS`。`check logs` 對 `sk_live`／`sk_test`／`whsec_`／OTP 字面量失敗。`requestId` 可以顯示給使用者作支援引用；stack 不要到客戶端。不要 log webhook payload、OTP 或 Stripe `sk_`。程序：[security-review](../skills/security-review.zh.md)。更新 secrets-logging：kit logger **已經** redact。

## 測試計劃

用 [test-plan](../skills/test-plan.zh.md) 填寫（按風險排序的 `given / when / then`、夾具、不涵蓋範圍、分層對應）。只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

風險先：secret 進 log、5xx 無 ERROR log、4xx 誤打成 ERROR、SDK 丢掉 `requestId`、靜態檢查假陽性、指標 label 爆炸（用固定 code 夾具）。

- given 未知 throw，when Express **與** Fastify error handler，then envelope `INTERNAL` 且 `logger.error` 帶 `err`、`requestId`、`code`（記憶體 stream）。
- given `AppError('NOT_FOUND')`，when handler，then 404 envelope 且沒有 `logger.error`。
- given `ZodError`，when handler，then 422，沒有 ERROR log。
- given job handler throw，when `registerWorkers`，then `logger.error` 再 rethrow（記憶體隊列）。
- given envelope 有 `requestId`，when SDK unwrap，then `error.requestId` 有值；沒有就省略該鍵。
- given JSONL 夾具有 `sk_test` 與 INTERNAL，when `check logs`，then secret finding 退出碼 1，INTERNAL 計入摘要。
- given `application/foo.ts` 寫 `throw new Error(`，when `check errors`，then `application-throw-plain-error`。
- given `apps/api/src/infra/seed.ts` 的 `console.log`，when `check errors`，then allowlist。
- given 同一 code／status `inc` 兩次，when 讀 registry 字串，then 見到 `ysk_http_errors_total`（不啟動 Prometheus 程序）。

- [x] Memory-repo 服務案例（job logger 經記憶體隊列）
- [x] Envelope／error code 案例（兩個 adapter）
- [ ] 資源有擁有者時，授權／租戶／另一作者案例 — 不在範圍
- [x] 若改了 UI，hooks 只經 SDK — 登入仍用 web-sdk mutation
- [ ] 僅在改了登入、shell 或使用者可見路徑時才加 Playwright／ui-review — ErrorBanner 可選 requestId；schema 無效登入沒有 requestId，既有測試維持

不涵蓋：真 Jaeger UI、生產 log ship、除非 ErrorBanner 版面回歸才跑 Playwright。

## 驗證命令

每條命令都有預期結果。按改動增刪列。

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK／logger／observability |
| `pnpm typecheck` | 退出碼 0；可選 `requestId` 符合 `exactOptionalPropertyTypes` |
| `pnpm test` | 退出碼 0；新記憶體 port 與 CLI 夾具；不開 Jaeger／Grafana |
| `pnpm gen:openapi` | `docs/openapi.yaml` 相對 HEAD 不變（沒改路徑） |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit check errors` | 在本 kit 印出 `ysk-kit check errors: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-17-error-log-review.zh.md` | 印出 `ysk-kit plan --check: ok` |

可選：`pnpm lint`。不需要 `pnpm e2e`（登入 schema 路徑不變）。Grok Build：`grok inspect`。

### 人手檢查

- [ ] UI 流程：web／admin 登入仍顯示 schema 訊息；API 回 `requestId` 時 ErrorBanner 顯示它
- [ ] Envelope 形狀 `{ ok: true, data }`／`{ ok: false, error }`，錯誤帶 `requestId`
- [ ] 授權角色：不變
- [ ] Capture 一條 production 格式 JSON 5xx：`level` error、`code` INTERNAL、與 envelope 同一 `requestId`、沒有密鑰字面量

## 文件／變更紀錄／changeset

- [ ] `docs/skills/error-log-review.md` 配對 + wrappers；recipe `review-error-logs`；指南 `observability`
- [ ] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口
- [ ] 公開套件的 changeset（logger、observability、api-http、api-express、api-fastify、domain-kernel、sdk、ui、config、cli）

另外：AGENTS 漸進披露、skills 目錄、verify-change（加 `check errors`；有 JSONL 才跑 `check logs`）、debug-issue 連結、CLI help、env.md 的 `LOG_LEVEL`、envelope 一句、secrets-logging 更正、Grafana／deploy、product-plan 今日可做、CI `check errors`。

## 風險與回滾

靜態檢查噪音 — 只留三條規則與 allowlist；doctor 給 warn，kit CI 當 error。4xx 打 ERROR 會淹死訊號 — classify 預設 silent。Pino `err` serializer 可能帶 cookie — 靠既有 redact 與夾具。Fastify 5xx access line 由 info 改 error 是正路。回滾：還原 commit。無遷移。不刮取的指標等於沒有。CLI 命令可以不用。

## 任務清單

按順序列出。每步寫明要改的檔案、介面／合約／資料變更、風險、回滾、驗收條件。

1. [ ] 計劃檔
   - **檔案：** `docs/plans/2026-10-17-error-log-review.md`、`.zh.md`
   - **介面／合約／資料：** 無
   - **風險：** 低
   - **回滾：** 刪日期檔
   - **驗收：** `pnpm ysk-kit plan --check` 雙語通過
2. [ ] Classify + HTTP log
   - **檔案：** `packages/api-http/src/envelope-error.ts`、Express／Fastify error handler 與測試、`apps/api/src/app.ts`、`app-fastify.ts`
   - **介面／合約／資料：** `classifyEnvelopeLog`；`createErrorHandler` 選項；不改 DTO
   - **風險：** 4xx 誤打成 ERROR
   - **回滾：** 還原 adapter 檔
   - **驗收：** 5xx 有 ERROR+stack 鍵；4xx 沒有
3. [ ] Jobs + 指標 + LOG_LEVEL
   - **檔案：** `apps/api/src/workers.ts`、`main.ts`、`worker.ts`、`packages/observability`、Grafana JSON、`packages/logger`、`packages/config`
   - **介面／合約／資料：** `createHttpErrorCounter`；可選 `LOG_LEVEL`；可選 `CreateAppInput.recordHttpError`
   - **風險：** adapter import observability（layers）
   - **回滾：** 還原套件與 Grafana JSON
   - **驗收：** 單元測試見到 counter 字串；預設 level 不變
4. [ ] 客戶端
   - **檔案：** `packages/domain-kernel`、`packages/sdk/src/http.ts`、`packages/ui/src/error-banner.tsx`、web／admin 登入
   - **介面／合約／資料：** `AppError`／ErrorBanner 可選 `requestId`
   - **風險：** `exactOptionalPropertyTypes` 傳 `undefined`
   - **回滾：** 還原那些檔
   - **驗收：** 沒有就省略該鍵；只用 SDK／web-sdk
5. [ ] CLI
   - **檔案：** `tooling/ysk-cli/src/check-errors.ts`、`check-logs.ts`、`index.ts`、`help.ts`、`doctor.ts`、`.github/workflows/ci.yml`
   - **介面／合約／資料：** `check errors`／`check logs` findings；doctor id `errors` 為 warn
   - **風險：** seed `console.log` 假陽性
   - **回滾：** 從 CI 拿掉命令
   - **驗收：** 夾具測試；kit 上 `check errors` ok
6. [ ] 文件
   - **檔案：** skill、recipe、指南、AGENTS、changelog、changeset
   - **介面／合約／資料：** 無
   - **風險：** skill-drift／文件配對
   - **回滾：** 還原文件
   - **驗收：** 中英配對深度一致；`check agent` ok
7. [ ] 驗證
   - **檔案：** 無額外
   - **介面／合約／資料：** 無
   - **風險：** 驗證鏈時間
   - **回滾：** 不適用
   - **驗收：** 上表驗證命令全綠

## 未決問題

- React `ErrorBoundary` 延後（ui-review 範圍）。不是這次。
- 產品內建 error inbox 須另開計劃，並先問新 capability 名稱。不是這次。
