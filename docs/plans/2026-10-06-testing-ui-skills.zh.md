# 計劃：Testing Ui Skills

Language: 英文配對 `2026-10-06-testing-ui-skills.md` · 中文 `2026-10-06-testing-ui-skills.zh.md`

| | |
|---|---|
| **Slug** | `testing-ui-skills` |
| **日期** | 2026-10-06 |
| **狀態** | done |
| **正規檔** | `docs/plans/2026-10-06-testing-ui-skills.md` |
| **工作階段指針** | `/plan.md`（已 gitignore） |

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。檢查：`pnpm ysk-kit plan --check docs/plans/2026-10-06-testing-ui-skills.zh.md`。

## 目標與使用者問題

用 YSK Kit 建產品的 AI coding agent 需要專業的測試與 UI／UX 程序。沒有它們，agent 會略過授權／envelope 案例、mock 真實服務，並交出泛用、不可及的畫面。此改動新增四份雙語 skill，並接入 `create-ysk-app`／`ysk-kit upgrade` 已經會複製的每種工具指針。

## 範圍

- 包含：`test-plan`、`write-tests`、`ui-design`、`ui-review`（英文 + `.zh.md`）、包裝、巢狀 `AGENTS.md`、範圍限定的 Cursor／Copilot 檔、smoke 斷言、PATCH changeset、變更紀錄視窗。

## 非目標

- 不含：加入 Playwright axe、視覺回歸 CI、`fast-check`、深色主題或新 UI 元件。
- 不含：重寫計劃協議（`plan-feature`、`AGENTS.md` 的計劃協議一節）— 以 rebase 同時保留兩邊。
- 不含：合併或 npm 發佈。

## 假設

- 同時進行的計劃協議改動（PR #24）會先或並行登陸 `main`；本分支必須 rebase，同時保留新的計劃標題／`plan --check` 與測試／UI skills。
- `php-bridge` 繼續略過工作區 agent 包裝，與既有 smoke 一致。

## 受影響的 flavor／preset／capability

| 軸 | 值 | 備註 |
|---|---|---|
| Flavor | kit 本身（所有工作區產品經複製 + upgrade 繼承） | `php-bridge` 仍然略過包裝 |
| Preset | thin／full | 兩者都收到 skill 套件 |
| Capabilities | 不適用 | 只有文件 |

## 現況與重用

重用 v1.2.0 的 agent 指引佈局（正規 `docs/skills/`、包裝在 `tooling/ysk-cli/templates/agent/skills/`、副本在 `.agents/skills/` 與 `.claude/skills/`、有漂移檢查）。不要另寫一套樹，也不要重寫 `plan-feature`。

| 路徑 | 符號 | 重用為 |
|---|---|---|
| `docs/skills/plan-feature.md` | skill 形狀 | 複製觸發／輸入／步驟／驗證／完成 |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | 加入四個名稱 |
| `docs/plans/_template.md` | 測試計劃一節 | 指向 `test-plan`；保留 #24 標題 |
| `.github/scripts/flavor-smoke.sh` | 包裝檔清單 | 加入 skill 與規則路徑；保留標題 grep |

## 考慮過的方案

| 方案 | 複雜度 | 分層 | 遷移 | 客戶端 | 備註 |
|---|---|---|---|---|---|
| A：四份 skill + 精簡 AGENTS.md 指針 | 低 | 文件、CLI 包裝、smoke | 沒有 | runtime 沒有 | 跟既有 skill 佈局一致 |
| B：把完整測試／UI 程序寫進 AGENTS.md | 中 | 根目錄 AGENTS.md | 沒有 | 沒有 | 會超過 24 KiB，並與計劃協議文字碰撞 |

**選定：** A  
**原因：** 漸進披露已把程序放到 `docs/skills/`；AGENTS.md 只需兩條硬規則與目錄列。

## 合約先行

沒有 DTO、路徑或 error code 改動。

## 資料模型／Prisma 與遷移

沒有。

## 模組切片與分層

沒有 application／infra 程式。只有護欄：`docs/skills/`、`.agents/skills/`、`.claude/skills/`、`.cursor/rules/`、`.github/instructions/`、巢狀 `AGENTS.md`、CLI 測試。

## SDK／web-sdk／客戶端表面

沒有 runtime 客戶端程式。巢狀客戶端 `AGENTS.md` 指向 `ui-design`／`ui-review`。

## Jobs／mail／realtime／notifications

沒有。

## 安全與私隱

Skills 要求 agent 測試 webhook HMAC、永不把 OTP／Stripe `sk_`／webhook 密鑰寫進日誌，並覆蓋 `FORBIDDEN`／另一租戶案例。

## 測試計劃

用 [test-plan](../skills/test-plan.zh.md) 填寫。只用記憶體 port。

- [x] Skill 包裝存在，且 `.agents`／`.claude`／模板一致（`docs-pair`、`agent-stubs`）
- [x] create-app 與 upgrade 斷言新檔
- [x] thin-smoke／flavor-smoke 列出新路徑，並仍 grep #24 的模板標題
- [x] 計劃模板含 `test-plan` 以及假設／現況與重用／考慮過的方案
- [x] 兩份待處理 changeset 都以 `patch` 列出全部 26 個公開套件
- [x] `pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent` 綠色
- [x] 根目錄加巢狀 `AGENTS.md` 仍低於 24 KiB
- [x] 本配對的 `pnpm ysk-kit plan --check` 通過

## 驗證命令

| 命令 | 預期結果 |
|---|---|
| `pnpm layers` | 退出碼 0；客戶端不碰 Express／Prisma／jobs／mail／push／AWS SDK |
| `pnpm typecheck` | 退出碼 0 |
| `pnpm test` | 退出碼 0 |
| `pnpm gen:openapi` | `docs/openapi.yaml` 與 ts-rest 合約相符 |
| `pnpm ysk-kit check agent` | 印出 `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-testing-ui-skills.zh.md` | 印出 `ysk-kit plan --check: ok` |

可選：`pnpm lint`。`pnpm check:links`。沒有改登入／shell，不必 `pnpm e2e`。

### 人手檢查

沒有產品 UI／HTTP／授權流程改動 — 這次只改 agent 指引。

- [x] Envelope 形狀不變（沒有新增 HTTP 路由）
- [x] 授權角色不變

## 文件／變更紀錄／changeset

- [x] `docs/skills/` 四對 + 目錄
- [x] `CHANGELOG.md`／`CHANGELOG.zh.md` 與 README 最近三個版本視窗（v1.2.1 同時涵蓋計劃協議與測試／UI）
- [x] 全部 26 個公開套件的 PATCH changeset（與 `planning-discipline.md` 並存）

## 風險與回滾

Skill 副本可能漂移 — `check agent` 會令 PR 失敗。同時進行的計劃協議 PR（#24，squash 合併為 `93a1f47`）重疊 `AGENTS.md`／`_template.md`／變更紀錄／smoke；rebase 到 `main` 時同時保留 Test plan 指針與新的計劃標題。回滾即還原 commit；沒有遷移。

## 任務清單

1. [x] 合約
   - **檔案：** 沒有
   - **介面／合約／資料：** 沒有
   - **風險：** 沒有
   - **回滾：** 不適用
   - **驗收：** DTO + `OkSchema`／`ErrSchema` 存在；沒有 TypeScript `enum` — 不適用，沒有合約改動
2. [x] 骨架
   - **檔案：** `docs/skills/{test-plan,write-tests,ui-design,ui-review}.md` 及 `.zh.md`
   - **介面／合約／資料：** 沒有
   - **風險：** 另寫一套樹
   - **回滾：** 刪除四對檔
   - **驗收：** skill 檔跟既有觸發／輸入／步驟／驗證／完成
3. [x] Application 規則
   - **檔案：** `tooling/ysk-cli/templates/agent/skills/`、`.agents/skills/`、`.claude/skills/` 包裝
   - **介面／合約／資料：** 沒有
   - **風險：** 包裝漂移
   - **回滾：** 刪除包裝
   - **驗收：** 記憶體 port 測試通過（`docs-pair`、`agent-stubs`）
4. [x] 客戶端
   - **檔案：** 巢狀 `AGENTS.md`、`.cursor/rules/{tests,ui}.mdc`、`.github/instructions/`
   - **介面／合約／資料：** 沒有
   - **風險：** 漏了 raw fetch 提醒
   - **回滾：** 還原指針檔
   - **驗收：** 只用 SDK／web-sdk（指針，沒有 runtime 客戶端程式）
5. [x] 驗證
   - **檔案：** `ci.yml`、`flavor-smoke.sh`、create-app／upgrade／plan 測試
   - **介面／合約／資料：** 沒有
   - **風險：** rebase 時丢掉 #24 的標題 grep
   - **回滾：** 還原 commit
   - **驗收：** 上表驗證命令全綠
6. [x] 文件
   - **檔案：** AGENTS.md 配對、CHANGELOG／README 視窗、兩份 changeset
   - **介面／合約／資料：** 沒有
   - **風險：** 中英漂移或 AGENTS.md 超過 24 KiB
   - **回滾：** 還原文件
   - **驗收：** 中英配對深度一致；兩份 changeset 都以 patch 列出全部 26 個套件

## 未決問題

- 沒有。Axe 與視覺回歸維持可選，不加依賴。
