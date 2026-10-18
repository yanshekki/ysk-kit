# Skills

Language: [中文](index.zh.md) · English

Procedures for people and AI agents. Each skill has trigger, inputs, steps, verification, and done criteria. It points at law, CLI, and recipes. It does not duplicate [AGENTS.md](../../AGENTS.md).

| Skill | When | Do not use when | Related vendor skill |
|---|---|---|---|
| [plan-feature](plan-feature.md) | Write `docs/plans/<yyyy-mm-dd>-<slug>.md` before contracts and code | Typo / one-file rename | Tool native plan modes (copy into the dated file) |
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
| [debug-issue](debug-issue.md) | Red test, CI, or user report | Green-field design; JSON INTERNAL dump (error-log-review) | `git bisect` |
| [error-log-review](error-log-review.md) | INTERNAL / 5xx JSON logs, secret-in-log | Green-field design; already-red Vitest | — |
| [review-change](review-change.md) | Review a PR / branch vs law + plan | Implementing the change | getsentry `security-review` (diff scope) |
| [llm-feature](llm-feature.md) | Product LLM prompt, `/v1/llm`, evals | Client-only copy; non-LLM audit | OWASP LLM Top 10 |
| [security-review](security-review.md) | Authz, tenancy, secrets, tokens, webhooks, LLM input | Docs typos, no new trust boundary | getsentry `security-review`; openai threat-model |
| [db-migration](db-migration.md) | Prisma 7.10 SQL review, expand/contract, no silent reset | Prisma 8 CLI; no schema change | prisma/skills `prisma-cli` |
| [webhook-handling](webhook-handling.md) | Inbound webhooks (Stripe first): signature, ack, idempotency | Outbound Stripe SDK | Stripe webhooks / stripe/ai |
| [desktop-electron](desktop-electron.md) | Electron isolation, CSP, IPC, safeStorage | Renderer-only UI | Electron security tutorial |

Shared wrappers live in `.agents/skills/<name>/SKILL.md` (YAML `name` + `description`, a short step summary, then a pointer here). `create-ysk-app` and `ysk-kit upgrade` also write identical copies to `.claude/skills/`, `.cursor/skills/`, and `.grok/skills/` from `tooling/ysk-cli/templates/agent/`. `pnpm ysk-kit check agent` fails if those copies drift or drop `AGENTS.md`.

Other agents read `AGENTS.md`, then this index.
