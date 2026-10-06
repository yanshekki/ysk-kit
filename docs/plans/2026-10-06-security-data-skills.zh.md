# 計劃：安全與資料 agent skills

Language: 英文配對 `2026-10-06-security-data-skills.md` · 中文 `2026-10-06-security-data-skills.zh.md`

| | |
|---|---|
| **Slug** | `security-data-skills` |
| **日期** | 2026-10-06 |
| **狀態** | accepted |
| **正規檔** | `docs/plans/2026-10-06-security-data-skills.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。

## 目標與使用者問題

擴充 YSK Kit 的 coding agent 沒有安全審查、Prisma 7.10 遷移、入站 webhook 或 Electron 加固的程序。AGENTS.md 已把授權、密鑰與 webhook 列為須先寫計劃的主題，但步驟不在任何 skill。本計劃新增四份雙語 skill，讓 agent 跟隨 kit 路徑，而不是 Prisma 8 文件、泛用 OWASP 清單或 Electron 傳聞。

## 範圍

- 包含：`security-review`、`db-migration`、`webhook-handling`、`desktop-electron`（英文 + 香港繁體中文）。
- 包含：`.agents`／`.claude` 包裝（短步驟摘要、中文觸發詞、「不要用於…」）。
- 包含：skill 目錄、AGENTS.md 漸進披露列、Cursor 規則、Copilot 指示、create-app／upgrade 模板、`SKILLS` 陣列、smoke 斷言。
- 包含：從 `add-module`、`add-capability`、`verify-change` 交叉連結。
- 包含：patch changeset（全部 26 個公開套件）、變更紀錄／README 三版本窗口。

## 非目標

- 不含：logger 遮罩、webhook 冪等、Electron CSP／IPC、明文 token 後備、LLM system prompt／限額的 runtime 修復（另開 PR）。
- 不含：`contract-change`、`debug-issue`、`review-change`、`llm-feature`（稍後 PR）。
- 不含：改寫原有七個 skill 的單行包裝。
- 不含：合併或發佈。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | 經 `create-ysk-app`／`upgrade` 複製到每個工作區 flavor |
| Preset | thin／full | 兩種都會收到 skills |
| Capabilities | billing、team、llm、files、desktop | 只引用，不重寫實作 |

## 合約先行

不改 DTO、command、error code 或 ts-rest 路徑。

| 項目 | 名稱／路徑 | 備註 |
|---|---|---|
| DTO | — | 沒有 |
| Command | — | 沒有 |
| Error codes | 重用既有 | Skills 會提到 `FORBIDDEN`、`NOT_FOUND`、`UNAUTHENTICATED`、`RATE_LIMITED` |
| 路徑 | — | 只文件化 webhook 路徑 `/v1/billing/webhook` |

## 資料模型／Prisma 與遷移

沒有。`db-migration` 描述 Prisma 7.10（`migrate dev --create-only`、`migrate deploy`）。本 PR 不改 schema。

## 模組切片與分層

不改 `apps/api` 的 application 或 infra。

## SDK／web-sdk／客戶端表面

不改 SDK 或 UI。Desktop skill 描述 `apps/desktop/src/main` 與 `preload` 的正確模式。

## Jobs／mail／realtime／notifications

Webhook skill 指向 `@ysk-kit/jobs`（`createMemoryQueue`）做非同步履約。不新增隊列。

## 安全與私隱

Skills 教導：application 層 membership 檢查、pino redact、禁止明文 token 後備、raw body 驗簽、產品功能不要讓 client 送 LLM `system` role。本 PR 不改這些實作。

## 測試計劃

只用記憶體 port。不要啟動 Redis、Stripe、Twilio、FCM、Jaeger 或 Grafana。

- [x] Memory-repo 服務案例 — 不適用（文件）
- [x] Envelope／error code 案例 — 不適用
- [x] `docs-pair` 的 SKILLS 陣列包含四個名稱
- [x] `ysk-kit check agent` 的 skill-drift／24 KiB 預算
- [x] create-app／upgrade／smoke 斷言新包裝與 Cursor 規則

## 驗證命令

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

另跑 `pnpm lint` 與 `pnpm check:links`。

## 文件／變更紀錄／changeset

- [x] `docs/skills/` 中英配對
- [x] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本窗口
- [x] 全部公開套件的 patch changeset

## 風險與回滾

- 與進行中的 PR #23 在 skill 目錄、`SKILLS` 陣列、changelog v1.2.1 可能衝突。以附加列與獨立 changeset 檔名降低衝突。
- AGENTS.md 位元組預算：只加短索引列。
- 回滾：還原文件 commit。

## 任務清單

1. [x] 計劃 — *驗收：* 本檔 + 中文配對
2. [x] Skills — *驗收：* 四份中英 skill、security-review 參考、包裝含步驟／中文／不要用於
3. [x] 接線 — *驗收：* 目錄、AGENTS.md、規則、指示、模板、測試
4. [x] 發佈衛生 — *驗收：* lockstep patch changeset、README 三版本窗口
5. [ ] 驗證 — *驗收：* lint、typecheck、test、OpenAPI、`check agent`、連結
6. [ ] PR — *驗收：* 一個 draft PR，列出來源，不合併

## 未決問題

- 沒有。程式缺口留給另一個 PR。
