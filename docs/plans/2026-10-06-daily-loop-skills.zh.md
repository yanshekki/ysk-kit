# 計劃：日常工程循環 agent skills

Language: English pair `2026-10-06-daily-loop-skills.md` · 中文 `2026-10-06-daily-loop-skills.zh.md`

| | |
|---|---|
| **Slug** | `daily-loop-skills` |
| **Date** | 2026-10-06 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-06-daily-loop-skills.md` |
| **Session pointer** | `/plan.md` (gitignored) |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-06-daily-loop-skills.zh.md`。

## 目標與使用者問題

PR-A 已有安全、Prisma、webhook、Electron 程序。日常工作仍缺合約 diff、紅燈迴圈除錯、對照法律+計劃的審查、以及在 v1.2.2 伺服器持有 prompt 上做 LLM 功能的 kit 專用 skill。既有包裝只是一行指針，agent 會跳步驟。本 PR 加四個雙語 skill，並加厚原有包裝。

## 範圍

- 含：`contract-change`、`debug-issue`、`review-change`、`llm-feature`（英文 + 香港繁體中文）。
- 含：每個 skill 的 `.agents`／`.claude` 包裝（≤15 行摘要、Use when、中文觸發、「不要用於…」、description ≤1024 字）。
- 含：缺漏的 `## 輸出格式`、`## 反模式`、`## 升級／詢問`。
- 含：verify-change、new-product、add-module、add-capability、envelope-api、fix-layers 改進；index 欄；可選 `skill-triggers.test.ts`。
- 含：接線（AGENTS.md 索引、Cursor 規則、Copilot、create-app／upgrade、SKILLS 陣列、smoke）。
- 含：patch changeset（全部 26 個公開套件），changelog／README 三版本窗對準 **v1.2.3**。

## 非目標

- 不含：runtime 行為。
- 不含：合併或 npm 發佈。
- 不含：把 `oasdiff` 加進 workspace 依賴。

## 假設

- PR #29（`chore: version packages`，v1.2.2）可能在本分支開始後才進 main。推送前 rebase 到該 commit，讓 README／CHANGELOG 落在 v1.2.3。
- AGENTS.md 硬規則目前是 **十二** 條。review-change 指向現況清單。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身 | 護欄複製進每個 workspace flavor |
| Preset | thin／full | 兩邊都有 skills |
| Capabilities | llm、billing、push、apikey | 只引用，不重寫 |

## 現況與重用

沿用 v1.2.2 agent 護欄佈局。LLM 現況：`LlmClientRoleSchema`（只 `user`／`assistant`）、`LLM_SYSTEM_PROMPT`、配額 `RATE_LIMITED`、`createFakeLlm`。

## 考慮過的方案

| 方案 | 複雜度 | 備註 |
|---|---|---|
| A：四個 skill + 重寫包裝 | 低 | 對齊 PR-A |
| B：把日常循環寫進 AGENTS.md | 中 | 會超過 24 KiB |

**選定：** A。

## 合約優先

不改 DTO、command、錯誤碼或 ts-rest 路徑。

## 資料模型／Prisma 與遷移

沒有。

## 模組切片與分層

不改 `apps/api` application 或 infra。

## SDK／web-sdk／客戶端表面

沒有 runtime 客戶端程式。

## Jobs／mail／realtime／notifications

沒有。

## 安全與私隱

`llm-feature` 教伺服器持有 prompt、不可信內容分隔、配額、CI 不打真供應商。本 PR 不改實作。

## 測試計劃

- [x] `docs-pair` SKILLS 含四個名稱
- [x] 包裝在 `.agents`／`.claude`／templates 相同
- [x] `ysk-kit check agent` skill-drift／24 KiB
- [x] create-app／upgrade／smoke 斷言新包裝
- [x] `skill-triggers.test.ts`

## 驗證命令

```bash
pnpm lint && pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm check:links && pnpm ysk-kit check agent
```

預期：Biome 只有 info；分層／typecheck／test 綠；OpenAPI 無 diff；`check:links` ok；`ysk-kit check agent: ok`。

## 文件／變更紀錄／changeset

- [x] `docs/skills/` 英中成對
- [x] CHANGELOG 與 README 三版本窗（v1.2.3／v1.2.2／v1.2.1）
- [x] 全部公開套件的 patch changeset

## 風險與回滾

- AGENTS.md 位元組預算：只加短索引列。
- 與 #29 變更紀錄衝突：推送前 rebase 到 version commit。
- 回滾：還原文件 commit。

## 任務清單

1. [x] 計劃 — *驗收：* 本檔 + 中文對
2. [ ] Skills — *驗收：* 四個英中 skill；全部包裝
3. [ ] 改進 — *驗收：* 列出的既有 skill + index 欄
4. [ ] 接線 — *驗收：* AGENTS.md、規則、測試、smoke
5. [ ] 發佈衛生 — *驗收：* lockstep patch、v1.2.3 窗
6. [ ] 驗證 — *驗收：* lint、layers、typecheck、test、OpenAPI、links、check agent
7. [ ] PR — *驗收：* 一個 PR，CI 綠，不合併

## 未決問題

- 沒有。
