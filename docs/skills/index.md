# Skills

Language: [中文](index.zh.md) · English

Procedures for people and AI agents. Each skill has trigger, inputs, steps, verification, and done criteria. It points at law, CLI, and recipes. It does not duplicate [AGENTS.md](../../AGENTS.md).

| Skill | When | Do not use when | Related vendor skill |
|---|---|---|---|
| [plan-feature](plan-feature.md) | Write `docs/plans/<yyyy-mm-dd>-<slug>.md` before contracts and code | Typo / one-file rename; unresolved Open questions (clarify-feature first) | Tool native plan modes (copy into the dated file) |
| [clarify-feature](clarify-feature.md) | Open questions are non-empty, or the user asks to clarify, before plan approval | Implementing; empty Open questions; Spec Kit / `.specify/` | — |
| [test-plan](test-plan.md) | Rank risks and list given/when/then cases before writing tests | Comment-only edits | Cloudflare Agents `test-plan` |
| [write-tests](write-tests.md) | Vitest / Testing Library / Playwright in this repo | Planning tests (use test-plan first) | Cloudflare sandbox-sdk testing |
| [new-product](new-product.md) | Scaffold a product with `create-ysk-app` | Adding a module inside this kit | — |
| [add-module](add-module.md) | New HTTP resource | Restoring llm/team/billing/push | — |
| [add-capability](add-capability.md) | Restore llm / team / billing / push (or other catalogue names) | Inventing a catalogue name | — |
| [layout-system](layout-system.md) | Shell, columns, nav, list+detail, responsive structure | Palette / second component library; API-only | jakubkrehel `better-layout` (adapt, don’t vendor) |
| [ui-design](ui-design.md) | Screens in web / admin / mobile / desktop | API-only changes; complex layout first (layout-system) | Anthropic frontend-design (stay on kit tokens) |
| [ui-review](ui-review.md) | QA checklist before UI work is done | Designing the screen (ui-design); skipping layout-system on a new shell | Vercel Web Interface Guidelines |
| [i18n-localize](i18n-localize.md) | User-visible copy, ErrorBanner, email/push, locale switch | Second UI library; RTL; unsupervised jargon MT | `@ysk-kit/i18n`; Vercel Locale |
| [verify-change](verify-change.md) | After any feature | Claiming done without running it | — |
| [fix-layers](fix-layers.md) | `pnpm layers` failed | Editing `.dependency-cruiser.cjs` without approval | — |
| [envelope-api](envelope-api.md) | New route, SSE, PDF, or error shape | Parallel error JSON | — |
| [contract-change](contract-change.md) | DTOs, paths, error codes, OpenAPI | Application-only rules; Prisma SQL | oasdiff (optional) |
| [debug-issue](debug-issue.md) | Red test, CI, or user report | Green-field design; JSON INTERNAL dump (error-log-review); CVE inventory (supply-scan) | `git bisect` |
| [error-log-review](error-log-review.md) | INTERNAL / 5xx JSON logs, secret-in-log | Green-field design; already-red Vitest | — |
| [supply-scan](supply-scan.md) | CVE / runtime versions / lockfile / Actions pins | Diff-scoped authz (security-review); exploit PoCs | — |
| [upgrade-kit](upgrade-kit.md) | Kit deps, Dependabot, weekly stables, local smoke when Actions cannot run | Dest-product refresh (`ysk-kit upgrade`) | — |
| [review-change](review-change.md) | Review a PR / branch vs law + plan | Implementing the change; combined Staff/QA slice audit (audit-slice) | getsentry `security-review` (diff scope) |
| [audit-slice](audit-slice.md) | Staff / QA combined review of a diff or named module | Implementing a feature; ordinary PR review; authz-only; post-scaffold; deleting files | — |
| [llm-feature](llm-feature.md) | Product LLM prompt, `/v1/llm`, evals | Client-only copy; non-LLM audit | OWASP LLM Top 10 |
| [security-review](security-review.md) | Authz, tenancy, secrets, tokens, webhooks, LLM input | Combined Staff/QA slice audit (audit-slice); docs typos; no new trust boundary | getsentry `security-review`; openai threat-model |
| [db-migration](db-migration.md) | Prisma 7.10 SQL review, expand/contract, no silent reset | Prisma 8 CLI; no schema change | prisma/skills `prisma-cli` |
| [webhook-handling](webhook-handling.md) | Inbound webhooks (Stripe first): signature, ack, idempotency | Outbound Stripe SDK | Stripe webhooks / stripe/ai |
| [desktop-electron](desktop-electron.md) | Electron isolation, CSP, IPC, safeStorage | Renderer-only UI | Electron security tutorial |

Shared wrappers are **four routers** (`plan`, `implement`, `verify`, `review`) in `.agents/skills/<name>/SKILL.md`. Each body must mention `AGENTS.md`. `create-ysk-app` and `ysk-kit upgrade` write identical copies to `.claude/skills/`, `.cursor/skills/`, and `.grok/skills/` from `tooling/ysk-cli/templates/agent/`. `pnpm ysk-kit check agent` fails if those copies drift or drop `AGENTS.md`.

- **plan** → [plan-feature](plan-feature.md)
- **implement** → this index; open only the matching procedure. If the product has a fund-protocol doc, follow it. This kit does not ship one.
- **verify** → [verify-change](verify-change.md)
- **review** → [review-change](review-change.md). Open [security-review](security-review.md) only when the diff touches auth, secrets, or webhooks. Open [audit-slice](audit-slice.md) only when the user asks.

Read [AGENTS.md](../../AGENTS.md) and [docs/agent/NOW.md](../agent/NOW.md) first.

## Task index

| Task | Read |
|---|---|
| Plan a feature | [plan-feature](plan-feature.md), [docs/plans/_template-lean.md](../plans/_template-lean.md) (`--full`: [_template.md](../plans/_template.md)) |
| Clarify open questions | [clarify-feature](clarify-feature.md) |
| Lean / full path | [sdd-path](../plans/sdd-path.md) |
| Scaffold a product | [new-product](new-product.md), [create-ysk-app](../cli/create-ysk-app.md) |
| Add a resource | [add-module](add-module.md), [recipe](../recipes/add-module.md) |
| Developer how-to | [docs/recipes/](../recipes/README.md) |
| Restore llm / team / billing / push | [add-capability](add-capability.md) |
| Envelope / SSE / PDF | [envelope-api](envelope-api.md), [envelope guide](../guides/envelope.md) |
| DTO / path / OpenAPI | [contract-change](contract-change.md) |
| Red test or user report | [debug-issue](debug-issue.md) |
| INTERNAL / 5xx JSON logs | [error-log-review](error-log-review.md) |
| CVE / third-party versions | [supply-scan](supply-scan.md) |
| Kit deps / Dependabot | [upgrade-kit](upgrade-kit.md) |
| Review a PR / branch | [review-change](review-change.md) |
| Staff / QA slice audit | [audit-slice](audit-slice.md) |
| Product LLM prompt | [llm-feature](llm-feature.md) |
| `pnpm layers` failed | [fix-layers](fix-layers.md), [hexagonal](../guides/hexagonal.md) |
| After any feature | [verify-change](verify-change.md) |
| Plan how to test | [test-plan](test-plan.md) |
| Write tests | [write-tests](write-tests.md), [testing guide](../guides/testing.md) |
| Layout structure | [layout-system](layout-system.md) |
| Add or change a screen | [ui-design](ui-design.md) |
| Finish UI | [ui-review](ui-review.md) |
| Localize UI / envelope strings | [i18n-localize](i18n-localize.md) |
| Security review | [security-review](security-review.md) |
| Prisma migration | [db-migration](db-migration.md) |
| Inbound webhook | [webhook-handling](webhook-handling.md) |
| Electron desktop | [desktop-electron](desktop-electron.md) |
| Refresh a product | [upgrade](../guides/upgrade.md) |
| CLI flags | [ysk-kit](../cli/ysk-kit.md) |

## Coding tools

Official loading rules (do not invent extra convention files):

| Tool | What it reads | This repo |
|---|---|---|
| Codex | `AGENTS.md`, nested closer-wins; skills `.agents/skills/` | Root + nested `AGENTS.md`. |
| OpenCode | Project `AGENTS.md`. Fallback `CLAUDE.md` only if no `AGENTS.md` | Rely on `AGENTS.md`. |
| Grok Build | `AGENTS.md` / `AGENT.md` / `CLAUDE.md` (official Discovery does not list `GEMINI.md`) plus `.grok/rules/`. Project skills: `.grok/skills/` and Claude Code skills; user `~/.agents/skills/` | Pointers stay tiny. |
| Cursor | Root + nested `AGENTS.md` and `CLAUDE.md`. `.cursor/rules/*.mdc`. Skills `.agents/skills/` | Scoped `.mdc` files are reminders. |
| Claude Code | `CLAUDE.md` (`@AGENTS.md`). Skills **only** `.claude/skills/` | Keep `@AGENTS.md` in `CLAUDE.md`. Kit mirrors `.claude/skills/` from `.agents/skills/`. |
| Copilot | `AGENTS.md`. `.github/copilot-instructions.md`. Project skills `.agents/skills/` and `.claude/skills/` | Pointers stay short. Do not add `.github/skills`. |
| Gemini CLI | `.gemini/settings.json` `fileName: ["AGENTS.md"]`. Project skills `.agents/skills/` | `GEMINI.md` is a pointer only. Do not add `.gemini/skills`. |
