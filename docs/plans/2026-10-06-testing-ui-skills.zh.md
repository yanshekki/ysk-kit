# 計劃：Testing Ui Skills

Language: 英文配對 `2026-10-06-testing-ui-skills.md` · 中文 `2026-10-06-testing-ui-skills.zh.md`

| | |
|---|---|
| **Slug** | `testing-ui-skills` |
| **日期** | 2026-10-06 |
| **狀態** | done |
| **正規檔** | `docs/plans/2026-10-06-testing-ui-skills.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。

## 目標與使用者問題

用 YSK Kit 建產品的 AI coding agent 需要專業的測試與 UI／UX 程序。沒有它們，agent 會略過授權／envelope 案例、mock 真實服務，並交出泛用、不可及的畫面。此改動新增四份雙語 skill，並接入 `create-ysk-app`／`ysk-kit upgrade` 已經會複製的每種工具指針。

## 範圍

- 包含：`test-plan`、`write-tests`、`ui-design`、`ui-review`（英文 + `.zh.md`）、包裝、巢狀 `AGENTS.md`、範圍限定的 Cursor／Copilot 檔、smoke 斷言、PATCH changeset、變更紀錄視窗。

## 非目標

- 不含：加入 Playwright axe、視覺回歸 CI、`fast-check`、深色主題或新 UI 元件。
- 不含：重寫計劃協議（`plan-feature`、`AGENTS.md` 的 Planning 一節）— 另一項改動可能先登陸。
- 不含：合併或 npm 發佈。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身（所有工作區產品經複製 + upgrade 繼承） | `php-bridge` 仍然略過包裝 |
| Preset | thin／full | 兩者都收到 skill 套件 |
| Capabilities | 不適用 | 只有文件 |

## 合約先行

沒有 DTO、路徑或 error code 改動。

## 資料模型／Prisma 與遷移

沒有。

## 模組切片與分層

沒有 application／infra 程式。只有護欄：`docs/skills/`、`.agents/skills/`、`.claude/skills/`、`.cursor/rules/`、`.github/instructions/`、巢狀 `AGENTS.md`、CLI 測試。

## SDK／web-sdk／客戶端表面

沒有 runtime 客戶端程式。巢狀客戶端 `AGENTS.md` 指向 `ui-design`／`ui-review`。

## 工作／郵件／即時／通知

沒有。

## 安全與私隱

Skills 要求 agent 測試 webhook HMAC、永不把 OTP／Stripe `sk_`／webhook 密鑰寫進日誌，並覆蓋 `FORBIDDEN`／另一租戶案例。

## 測試計劃

用 [test-plan](../skills/test-plan.zh.md) 填寫。只用記憶體 port。

- [x] Skill 包裝存在，且 `.agents`／`.claude`／模板一致（`docs-pair`、`agent-stubs`）
- [x] create-app 與 upgrade 斷言新檔
- [x] thin-smoke／flavor-smoke 列出新路徑
- [x] 計劃模板含 `test-plan`
- [x] 待處理 changeset 以 `patch` 列出全部 26 個公開套件
- [x] `pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent` 綠色
- [x] 根目錄加巢狀 `AGENTS.md` 仍低於 24 KiB

## 驗證命令

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

可選：`pnpm lint`。`pnpm check:links`。

## 文件／變更紀錄／changeset

- [x] `docs/skills/` 四對 + 目錄
- [x] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本視窗（v1.2.1）
- [x] 全部 26 個公開套件的 PATCH changeset

## 風險與回滾

Skill 副本可能漂移 — `check agent` 會令 PR 失敗。同時進行的計劃協議 PR 可能改 `AGENTS.md`／`_template.md`；rebase 時同時保留 Test plan 指針與任何計劃改動。回滾即還原該 commit；沒有遷移。

## 工作清單

1. [x] Skills — *驗收：* 四份英文 + 中文，含觸發／輸入／步驟／驗證／完成
2. [x] 包裝 — *驗收：* 模板、`.agents`、`.claude` 相同且提及 `AGENTS.md`
3. [x] 指針 — *驗收：* AGENTS 目錄 + 兩條硬規則；巢狀檔；Cursor／Copilot glob
4. [x] 產生器 — *驗收：* create-app／upgrade／smoke 斷言檔案
5. [x] 驗證 — *驗收：* 上述五條命令為綠色
6. [x] 文件 — *驗收：* 英文與中文配對深度相同

## 未決問題

- 沒有。Axe 與視覺回歸維持可選，不加依賴。
