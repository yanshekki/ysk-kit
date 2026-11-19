# Feature plans

Language: [中文](README.zh.md) · English

Durable plans for YSK Kit work. Agent law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Lean template: [_template-lean.md](_template-lean.md). Full template: [_template.md](_template.md).

## Location

| File | Role |
|---|---|
| `_template-lean.md` / `_template-lean.zh.md` | Default six-section skeleton (`plan: lean`). |
| `_template.md` / `_template.zh.md` | 19-section skeleton (`plan: full`). Do not fill these in place. |
| `<yyyy-mm-dd>-<slug>.md` | Canonical English plan (ISO date, kebab slug). |
| `<yyyy-mm-dd>-<slug>.zh.md` | Optional Chinese pair (`--zh`). |
| `/plan.md` (repo root) | Optional session pointer. Gitignored. |
| `sdd-path.md` / `sdd-path.zh.md` | Lean and full path card. Do not pass it to `plan --check`. |

When a plan is required, write the dated file **before** contracts and implementation. Edit the dated file, not only the session pointer.

## Create

```bash
pnpm ysk-kit plan <kebab-slug>
pnpm ysk-kit plan <kebab-slug> --full
pnpm ysk-kit plan <kebab-slug> --zh
pnpm ysk-kit plan <kebab-slug> --force
pnpm ysk-kit plan <kebab-slug> --date 2026-10-06
pnpm ysk-kit plan --check docs/plans/2026-10-06-<slug>.md
```

Default is English lean (`plan: lean`). `--full` uses the 19-section template (`plan: full`). `--zh` writes the Chinese pair. `--lean` and `--full` cannot be used together. `--date` defaults to today (local). `--force` overwrites. `--check` fails on missing headings. Empty bodies and `none` / `n/a` / `nil` / `no` / `沒有` / `不適用` pass. Files with `plan: lean` are checked against lean headings; unmarked and old files against full headings.

## When required

See [AGENTS.md — When to plan](../../AGENTS.md#when-to-plan). Lean is the default. `--full` only for HTTP, Prisma, authz, secrets, webhooks, or a new envelope exception.

## Approval gate

Do not edit project files until the user approves the plan (unless they waived it). After `/compact`, re-read only Decision (lean) or the dated file (full). Unresolved items go to Open questions.

## Status

Most recent 10 dated English plans (filename only):

| File |
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

Do not search `docs/plans/` older than 14 days unless the user names them.

## Tool plan modes

Each tool may write its own scratch plan. **The approved record in this repo is always** `docs/plans/<yyyy-mm-dd>-<slug>.md`, created with `pnpm ysk-kit plan <slug>`.

| Tool | Native plan (official) | This repo |
|---|---|---|
| **Grok Build** | Session `~/.grok/sessions/<encoded-cwd>/<session-id>/plan.md` | Copy into the dated file. |
| **Cursor** | Plan Mode; **Save to workspace** → `.cursor/plans/` | `.cursor/plans/` is not the record. |
| **Claude Code** | Permission mode `plan` | Stay in plan mode until the dated file is complete. |
| **Codex** | `/plan` or `Shift+Tab` | Use this kit’s template, not a second `PLANS.md`. |
| **OpenCode** | Built-in Plan agent | Copy into `docs/plans/`. |
| **Copilot** | `/plan`; session `/memories/session/plan.md` | Persist with `pnpm ysk-kit plan <slug>` before the chat ends. |

## Copy-paste `/plan` prompt

```text
/plan Follow AGENTS.md and docs/plans/_template-lean.md (or --full for HTTP / Prisma / auth / secrets / webhook / envelope exceptions).
Six sections: Decision, Files, Tests, Risks, Done, Open questions. Decision ≤ 15 lines.
Save with: pnpm ysk-kit plan <kebab-slug>
```
