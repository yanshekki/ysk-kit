# SDD 路徑

Language: [English](sdd-path.md) · 中文

法律：[AGENTS.zh.md](../../AGENTS.zh.md)。本檔是路徑卡。它不是第二套憲法，也不是日期功能計劃。不要對它跑 `pnpm ysk-kit plan --check`。不要建立 `.specify/`。不要貼 Spec Kit。

程序：[plan-feature](../skills/plan-feature.zh.md)。澄清閘：[clarify-feature](../skills/clarify-feature.zh.md)。精簡模板：[_template-lean.zh.md](_template-lean.zh.md)。完整模板：[_template.zh.md](_template.zh.md)。

## 何時用哪一條

| 路徑 | 何時用 |
|---|---|
| 精簡 | 預設。`pnpm ysk-kit plan <slug>`（英文，六章）。只改錯字、只改註解、單檔重新命名仍然略過計劃。 |
| 完整 | HTTP 路由、Prisma model、授權、密鑰、webhook 或新的 envelope 例外：`pnpm ysk-kit plan <slug> --full`。未決問題非空時先走 [clarify-feature](../skills/clarify-feature.zh.md)。 |

不要假設 `thin` 含 llm、team、billing 或 push。php-bridge 不收 skill 包裝；若該產品有日期計劃，序列仍然適用。

## 精簡

1. [plan-feature](../skills/plan-feature.zh.md) — 英文精簡計劃，然後 `pnpm ysk-kit plan --check`。停下來等批准。只有被要求才 `--zh`。
2. implement 路由器：只打開 [docs/skills/index.zh.md](../skills/index.zh.md) 裡對得上的程序。
3. [verify-change](../skills/verify-change.zh.md)。
4. [review-change](../skills/review-change.zh.md)。

## 完整

1. 未決問題非空時先 [clarify-feature](../skills/clarify-feature.zh.md) — 最多五題，然後把答案折進日期檔（只有被要求才寫 `--zh` 配對）。
2. [plan-feature](../skills/plan-feature.zh.md) 加 `--full`。
3. 同一個 implement 路由器：只打開對得上的程序。
4. [verify-change](../skills/verify-change.zh.md)。
5. converge-feature **尚未送出**。不要在本切片發明這個 skill。
6. 只有使用者要求 Staff／QA 切片審計時才跑 [audit-slice](../skills/audit-slice.zh.md)。

## 可複製提示

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Read docs/agent/NOW.md first. Do not create .specify/ and do not paste Spec Kit.
Lean: pnpm ysk-kit plan <kebab-slug> from docs/plans/_template-lean.md. pnpm ysk-kit plan --check the file. Stop for my approval. After I approve, implement only the files in the plan, then verify, then review.
Full: pnpm ysk-kit plan <kebab-slug> --full. If Open questions are non-empty, run clarify-feature first (at most five questions). Then the lean implement / verify / review steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

- **Cursor。** Plan mode 可能寫 `.cursor/plans/`。抄進日期檔。`.cursor/plans/` 不是紀錄。
- **Claude Code。** 日期檔獲准之前留在 plan 權限模式。
- **Grok Build。** 工作階段 `~/.grok/sessions/…/plan.md` 是草稿。抄進日期模板。`grok inspect` 列出規則；它不取代 `plan --check`。

## 本檔不含

- Spec Kit 的 `specify`／plan／tasks／implement／converge 命令。
- `.specify/` 樹或第二套憲法。
- `converge-feature`、`analyze-plan` 或需求清單（後續）。
