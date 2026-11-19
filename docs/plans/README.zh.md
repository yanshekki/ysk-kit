# 功能計劃

Language: [English](README.md) · 中文

YSK Kit 工作的可保存計劃。Agent 法律：[AGENTS.zh.md](../../AGENTS.zh.md)。程序：[plan-feature](../skills/plan-feature.zh.md)。精簡模板：[_template-lean.zh.md](_template-lean.zh.md)。完整模板：[_template.zh.md](_template.zh.md)。

## 位置

| 檔案 | 角色 |
|---|---|
| `_template-lean.md`／`_template-lean.zh.md` | 預設六章骨架（`plan: lean`）。 |
| `_template.md`／`_template.zh.md` | 19 章骨架（`plan: full`）。不要直接填在這兩個檔。 |
| `<yyyy-mm-dd>-<slug>.md` | 正規英文計劃（ISO 日期，kebab slug）。 |
| `<yyyy-mm-dd>-<slug>.zh.md` | 可選中文配對（`--zh`）。 |
| `/plan.md`（倉根） | 可選工作階段指針。已 gitignore。 |
| `sdd-path.md`／`sdd-path.zh.md` | 精簡與完整路徑卡。不要傳給 `plan --check`。 |

協議要求計劃時，在合約與實作**之前**寫好日期檔。請改日期檔，不要只改工作階段指針。

## 建立

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --full
pnpm ysk-kit plan <kebab-slug> --zh
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

預設是英文精簡（`plan: lean`）。`--full` 用 19 章模板（`plan: full`）。`--zh` 才寫中文配對。`--lean` 與 `--full` 不可並用。`--date` 預設今天（本地）。`--force` 覆寫。`--check` 在缺標題時失敗。空章節與 `none`／`n/a`／`nil`／`no`／`沒有`／`不適用` 通過。有 `plan: lean` 的檔用精簡標題；未標記與舊檔用完整標題。

## 何時必須

見 [AGENTS.zh.md — 何時寫計劃](../../AGENTS.zh.md#何時寫計劃)。預設精簡。只有 HTTP、Prisma、授權、密鑰、webhook 或新的 envelope 例外才 `--full`。

## 批准閘

計劃獲使用者批准之前不要改專案檔（除非他們豁免）。`/compact` 之後只重讀決定（精簡）或日期檔（完整）。未解決的項目放到未決問題。

## 狀態

最近 10 個日期英文計劃（只列檔名）：

| 檔案 |
|---|
| [2026-11-08-rust-create-app-choice.md](2026-11-08-rust-create-app-choice.md) |
| [2026-11-01-clarify-feature-sdd-path.md](2026-11-01-clarify-feature-sdd-path.md) |
| [2026-10-27-audit-slice.md](2026-10-27-audit-slice.md) |
| [2026-10-23-supply-scan.md](2026-10-23-supply-scan.md) |
| [2026-10-17-error-log-review.md](2026-10-17-error-log-review.md) |
| [2026-10-15-stable-versions.md](2026-10-15-stable-versions.md) |
| [2026-10-13-create-app-guided-wizard.md](2026-10-13-create-app-guided-wizard.md) |
| [2026-10-11-weekly-v124.md](2026-10-11-weekly-v124.md) |
| [2026-10-11-node26.md](2026-10-11-node26.md) |
| [2026-10-11-expo58.md](2026-10-11-expo58.md) |

不要搜 14 天以前的 `docs/plans/`，除非使用者點名。

## 工具計劃模式

每個工具都可以寫自己的草稿計劃。**本倉獲准的紀錄一律是** `docs/plans/<yyyy-mm-dd>-<slug>.md`，用 `pnpm ysk-kit plan <slug>` 建立。

| 工具 | 原生計劃（官方） | 本倉做法 |
|---|---|---|
| **Grok Build** | 工作階段 `~/.grok/sessions/<encoded-cwd>/<session-id>/plan.md` | 抄進日期檔。 |
| **Cursor** | Plan Mode；**Save to workspace** → `.cursor/plans/` | `.cursor/plans/` 不是紀錄。 |
| **Claude Code** | 權限模式 `plan` | 日期檔填完之前留在 plan mode。 |
| **Codex** | `/plan` 或 `Shift+Tab` | 用本 kit 模板，不要另起 `PLANS.md`。 |
| **OpenCode** | 內建 Plan agent | 抄進 `docs/plans/`。 |
| **Copilot** | `/plan`；工作階段 `/memories/session/plan.md` | 對話結束前用 `pnpm ysk-kit plan <slug>` 持久化。 |

## 可複製的 `/plan` 提示

```text
/plan Follow AGENTS.md and docs/plans/_template-lean.md (or --full for HTTP / Prisma / auth / secrets / webhook / envelope exceptions).
Six sections: Decision, Files, Tests, Risks, Done, Open questions. Decision ≤ 15 lines.
Save with: pnpm ysk-kit plan <kebab-slug>
```
