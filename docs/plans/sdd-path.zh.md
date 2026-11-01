# SDD 路徑

Language: [English](sdd-path.md) · 中文

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。本檔是路徑卡。它不是第二套憲法，也不是日期功能計劃。不要對它跑 `pnpm ysk-kit plan --check`。不要建立 `.specify/`。不要貼 Spec Kit。

計劃程序：[plan-feature](../skills/plan-feature.zh.md)。澄清閘：[clarify-feature](../skills/clarify-feature.zh.md)。模板：[_template.zh.md](_template.zh.md)。

## 何時用哪一條

| 路徑 | 何時用 |
|---|---|
| 精簡 | 未決問題是空的，或使用者已經決定授權、租戶、envelope、flavor／preset 與 UI 表面。只改錯字、只改註解、單檔重新命名仍然略過計劃（[計劃協議](../../AGENTS.zh.md#計劃協議)）。 |
| 完整 | 日期計劃的未決問題非空，或使用者在批准前要求澄清。 |

不要假設 `thin` 含 llm、team、billing 或 push。php-bridge 不收 skill 包裝；若該產品有日期計劃，序列仍然適用。

## 精簡

1. [plan-feature](../skills/plan-feature.zh.md) — 日期計劃與中文配對，然後對兩份檔跑 `pnpm ysk-kit plan --check`。停下來等批准。
2. 計劃點名的實作 skill。常見列：[add-module](../skills/add-module.zh.md)、[add-capability](../skills/add-capability.zh.md)、[envelope-api](../skills/envelope-api.zh.md)、[contract-change](../skills/contract-change.zh.md)、[db-migration](../skills/db-migration.zh.md)、[ui-design](../skills/ui-design.zh.md)、[layout-system](../skills/layout-system.zh.md)。沒有單獨的 implement skill。
3. [verify-change](../skills/verify-change.zh.md)。
4. [review-change](../skills/review-change.zh.md)。

## 完整

1. [clarify-feature](../skills/clarify-feature.zh.md) — 最多五題，然後把答案折進兩份日期檔。
2. [plan-feature](../skills/plan-feature.zh.md) — 與精簡第 1 步相同。
3. 計劃點名的同一批實作 skill。
4. [verify-change](../skills/verify-change.zh.md)。
5. converge-feature **尚未送出**。不要在本切片發明這個 skill。
6. 只有使用者要求 Staff／QA 切片審計時才跑 [audit-slice](../skills/audit-slice.zh.md)。

## 可複製提示

Cursor、Claude Code、Grok Build 共用一份提示。下面的工具行是唯一差別。

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Do not create .specify/ and do not paste Spec Kit.
Lean: write docs/plans/<yyyy-mm-dd>-<slug>.md from docs/plans/_template.md and the Chinese pair. pnpm ysk-kit plan --check both files. Stop for my approval. After I approve, implement only the plan checklist, then verify-change, then review-change.
Full: if Open questions are non-empty, run clarify-feature first (at most five questions) and fold the answers into both plan files. Then the lean steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

- **Cursor。** Plan mode 可能寫 `.cursor/plans/`。抄進日期檔。`.cursor/plans/` 不是紀錄。
- **Claude Code。** 日期檔獲准之前留在 plan 權限模式。
- **Grok Build。** 工作階段 `~/.grok/sessions/…/plan.md` 是草稿。抄進日期模板。`grok inspect` 列出規則；它不取代 `plan --check`。

## 本檔不含

- Spec Kit 的 `specify`／plan／tasks／implement／converge 命令。
- `.specify/` 樹或第二套憲法。
- `converge-feature`、`analyze-plan` 或需求清單（後續）。
- 對 `TBD` 一詞做 `plan --check` 警告（後續）。
