# Feature plans

Language: [中文](README.zh.md) · English

Durable plans for YSK Kit work. Agent law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Template: [_template.md](_template.md).

## Location

| File | Role |
|---|---|
| `_template.md` / `_template.zh.md` | Bilingual skeleton. Do not fill these in place. |
| `<yyyy-mm-dd>-<slug>.md` | Canonical English plan (ISO date, kebab slug). |
| `<yyyy-mm-dd>-<slug>.zh.md` | Chinese pair, same depth. |
| `/plan.md` (repo root) | Optional session pointer. Gitignored. `pnpm ysk-kit plan <slug>` writes it. |

When a plan is required, write the dated file **before** contracts and implementation. Edit the dated file, not only the session pointer.

## Create

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

`--date` defaults to today (local). `--force` overwrites an existing dated pair. `--check` fails if a required `##` heading is missing or the section is still placeholder-only.

## When required

See [AGENTS.md — Planning protocol](../../AGENTS.md#planning-protocol). Short form: new or changed HTTP, Prisma, capabilities, SDK/client surfaces, multi-package work, authz/secrets, or the user asked for a plan.

## Approval gate

Do not edit project files until the user approves the plan (unless they waived it). Do not exit the tool's plan mode or hand over a sketch. A plan missing any template section is incomplete. If the user rejects it or says it is too short, expand the missing sections — never shorten. Unresolved items go to Open questions, not guesses. After `/compact` or a long session, re-read the dated plan file before continuing.

## Tool plan modes

Each tool may write its own scratch plan. **The approved record in this repo is always** `docs/plans/<yyyy-mm-dd>-<slug>.md` (and the `.zh.md` pair), created with `pnpm ysk-kit plan <slug>` and filled from [_template.md](_template.md). Copy native notes into those headings; do not commit the tool's session file as a substitute.

Facts below are from current official docs (do not invent extra files or shortcuts).

| Tool | Native plan (official) | This repo |
|---|---|---|
| **Grok Build** | Session file `~/.grok/sessions/<encoded-cwd>/<session-id>/plan.md` ([Plan Mode](https://docs.x.ai/build/features/plan-mode), [user guide](https://github.com/xai-org/grok-build/blob/main/crates/codegen/xai-grok-pager/docs/user-guide/19-plan-mode.md)). Built-in structure: Context; recommended approach; files to change; reusable functions with paths; verification. Enter with `/plan [description]` or `Shift+Tab`. Approval screen: `a` approve, `s` request changes (type notes), `q` quit. `/effort` sets reasoning effort for the current model (`high` / `xhigh` when that model supports them). `grok inspect` lists loaded rules. Global rules: `~/.grok/AGENTS.md` and `~/.grok/rules/*.md` ([AGENTS.md / project rules](https://docs.x.ai/build/features/project-rules)). | After approval, copy into the dated ysk-kit template. Grok's "one recommended approach" in the session file does not waive **Options considered** in the dated file when a real alternative exists. |
| **Cursor** | Plan Mode via `Shift+Tab` or the mode picker ([Plan Mode](https://cursor.com/docs/agent/plan-mode)). Researches, asks questions, writes a reviewable Markdown plan. Default save is the home directory; **Save to workspace** puts it under `.cursor/plans/`. Click **Build** to implement. | Save the approved plan with `pnpm ysk-kit plan <slug>`; do not treat `.cursor/plans/` as the record. |
| **Claude Code** | Permission mode `plan`: `Shift+Tab`, `/plan`, or `claude --permission-mode plan` ([permission modes](https://code.claude.com/docs/en/permission-modes)). Claude explores and writes a plan; it does not edit source until you approve. **No, keep planning** stays in plan mode. | Same dated file. Stay in plan mode until the ysk-kit template is complete. |
| **Codex** | Plan mode: `/plan` or `Shift+Tab` ([best practices](https://developers.openai.com/codex/learn/best-practices)). Optional extra `PLANS.md` template for long work. | Use this kit's `_template.md`, not a second `PLANS.md`. |
| **OpenCode** | Built-in Plan agent (`Tab` to switch). Explores without editing normal project files; it may write OpenCode plan files. V2 denies edits except under `~/.opencode/plan` ([agents](https://opencode.ai/v2/docs/agents/), [permissions](https://opencode.ai/v2/docs/permissions/)). | Copy the OpenCode plan into `docs/plans/`. |
| **Copilot** | Plan agent or `/plan` ([Planning](https://code.visualstudio.com/docs/agents/planning)). Local session plan lives at `/memories/session/plan.md` (session memory; cleared when the chat ends). **Open in Editor** / **Start Implementation** as documented. | Persist with `pnpm ysk-kit plan <slug>` before the chat ends. |

## Copy-paste `/plan` prompt

Use this when the tool's native plan comes back short or in its own shape.

English:

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

Chinese:

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
