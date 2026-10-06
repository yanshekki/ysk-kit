# 功能計劃

Language: [English](README.md) · 中文

YSK Kit 工作的可保存計劃。Agent 法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。模板：[_template.zh.md](_template.zh.md)。

## 位置

| 檔案 | 角色 |
|---|---|
| `_template.md`／`_template.zh.md` | 雙語骨架。不要直接填在這兩個檔。 |
| `<yyyy-mm-dd>-<slug>.md` | 正規英文計劃（ISO 日期，kebab slug）。 |
| `<yyyy-mm-dd>-<slug>.zh.md` | 中文配對，深度相同。 |
| `/plan.md`（倉根） | 可選工作階段指針。已 gitignore。`pnpm ysk-kit plan <slug>` 會寫入。 |

協議要求計劃時，在合約與實作**之前**寫好日期檔。請改日期檔，不要只改工作階段指針。

## 建立

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

`--date` 預設是今天（本地日期）。`--force` 會覆寫已有的日期配對。`--check` 在缺必要 `##` 標題、或章節仍是佔位內容時失敗。

## 何時必須

見 [AGENTS.zh.md — 計劃協議](../../AGENTS.zh.md#計劃協議)。簡述：新增或改動 HTTP、Prisma、capability、SDK／客戶端表面、跨套件工作、授權／密鑰，或使用者要求計劃。

## 批准閘

計劃獲使用者批准之前不要改專案檔（除非他們豁免）。不要退出工具的 plan mode 或交出草稿。缺任何模板章節都不算完整。若使用者拒絕或說太短，補上缺的章節，不要縮短。未解決的項目放到未決問題，不要猜測。`/compact` 或長工作階段之後，繼續之前先重讀日期計劃檔。

## 工具計劃模式

每個工具都可以寫自己的草稿計劃。**本倉獲准的紀錄一律是** `docs/plans/<yyyy-mm-dd>-<slug>.md`（及 `.zh.md` 配對），用 `pnpm ysk-kit plan <slug>` 建立，並按 [_template.md](_template.md) 填寫。把原生筆記抄進那些標題；不要把工具的工作階段檔當成替代品提交。

下表來自現行官方文件（不要發明額外檔名或捷徑）。

| 工具 | 原生計劃（官方） | 本倉做法 |
|---|---|---|
| **Grok Build** | 工作階段檔 `~/.grok/sessions/<encoded-cwd>/<session-id>/plan.md`（[Plan Mode](https://docs.x.ai/build/features/plan-mode)、[user guide](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/19-plan-mode.md)）。固定結構：Context、recommended approach、要改的檔、可重用函數（連路徑）、verification。用 `/plan [description]` 或 `Shift+Tab` 進入。批准畫面：`a` 批准、`s` 要求修改（輸入意見）、`q` 離開。`/effort` 設定目前模型的推理力度（該模型支援時可用 `high`／`xhigh`）。`grok inspect` 列出已載入規則。全域規則：`~/.grok/AGENTS.md` 與 `~/.grok/rules/*.md`（[AGENTS.md／專案規則](https://docs.x.ai/build/features/project-rules)）。 | 批准後抄進日期模板。Grok 工作階段檔的「只寫一個建議做法」並不豁免日期檔的「考慮過的方案」（有真正替代時仍要兩個）。 |
| **Cursor** | `Shift+Tab` 或模式選單進入 Plan Mode（[Plan Mode](https://cursor.com/docs/agent/plan-mode)）。會探索、提問、寫出可審的 Markdown 計劃。預設存在家目錄；**Save to workspace** 放到 `.cursor/plans/`。按 **Build** 才實作。 | 獲准計劃用 `pnpm ysk-kit plan <slug>` 保存；不要把 `.cursor/plans/` 當紀錄。 |
| **Claude Code** | 權限模式 `plan`：`Shift+Tab`、`/plan`，或 `claude --permission-mode plan`（[permission modes](https://code.claude.com/docs/en/permission-modes)）。Claude 探索並寫計劃，批准前不改原始碼。**No, keep planning** 會留在 plan mode。 | 同一份日期檔。ysk-kit 模板填完之前不要退出 plan mode。 |
| **Codex** | Plan mode：`/plan` 或 `Shift+Tab`（[best practices](https://developers.openai.com/codex/learn/best-practices)）。長工作可另用 `PLANS.md` 模板。 | 用本 kit 的 `_template.md`，不要另起一份 `PLANS.md`。 |
| **OpenCode** | 內建 Plan agent（`Tab` 切換）。探索時不改一般專案檔；可以寫 OpenCode 計劃檔。V2 除 `~/.opencode/plan` 外拒絕編輯（[agents](https://opencode.ai/v2/docs/agents/)、[permissions](https://opencode.ai/v2/docs/permissions/)）。 | 把 OpenCode 計劃抄進 `docs/plans/`。 |
| **Copilot** | Plan agent 或 `/plan`（[Planning](https://code.visualstudio.com/docs/agents/planning)）。Local session 的計劃在 `/memories/session/plan.md`（工作階段記憶；對話結束即清）。文件中的 **Open in Editor**／**Start Implementation**。 | 對話結束前用 `pnpm ysk-kit plan <slug>` 持久化。 |

## 可複製的 `/plan` 提示

工具原生計劃過短、或形狀不合模板時使用。

英文：

```text
/plan Follow docs/plans/_template.md (Chinese pair: docs/plans/_template.zh.md).
Fill every ## heading. Do not drop sections. Do not edit project files until I approve.
Explore existing modules, contracts, SDK resources, hooks, and generators (ysk-kit add module) first; list them under Current state and reuse.
Put unverified facts in Assumptions or Open questions — no silent guesses.
When a real alternative exists, give at least two options with tradeoffs, then the chosen option and why.
Each task step must name files, interface/contract/data changes, risk, rollback, and acceptance.
Each verification command needs an expected result; add manual checks (UI flows, envelope shape, auth roles) when relevant.
Save the approved plan with: pnpm ysk-kit plan <kebab-slug>
If I reject this or say it is too short, expand the missing sections. Never shrink.
```

中文：

```text
/plan 跟 docs/plans/_template.zh.md（英文配對：docs/plans/_template.md）。
填滿每個 ## 標題。不要刪章節。我批准之前不要改專案檔。
先探索既有模組、合約、SDK resource、hooks、產生器（ysk-kit add module），寫在「現況與重用」。
未核實的事實放進假設或未決問題，不要默默猜測。
有真正替代時至少兩個方案加權衡，再寫選定與原因。
每步任務要寫檔案、介面／合約／資料、風險、回滾、驗收。
每條驗證命令要有預期結果；有 UI／HTTP／授權時加人手檢查。
獲准後用 pnpm ysk-kit plan <kebab-slug> 存成日期檔。
若我拒絕或說太短，補上缺的章節，不要縮短。
```
