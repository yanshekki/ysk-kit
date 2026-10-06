# Skills

Language: [中文](index.zh.md) · English

Procedures for people and AI agents. Each skill has trigger, inputs, steps, verification, and done criteria. It points at law, CLI, and recipes. It does not duplicate [AGENTS.md](../../AGENTS.md).

| Skill | When |
|---|---|
| [plan-feature](plan-feature.md) | Write `docs/plans/<yyyy-mm-dd>-<slug>.md` before contracts and code |
| [test-plan](test-plan.md) | Rank risks and list given/when/then cases before writing tests |
| [write-tests](write-tests.md) | Vitest / Testing Library / Playwright in this repo |
| [new-product](new-product.md) | Scaffold a product with `create-ysk-app` |
| [add-module](add-module.md) | New HTTP resource |
| [add-capability](add-capability.md) | Restore llm / team / billing / push (or other catalogue names) |
| [ui-design](ui-design.md) | Screens in web / admin / mobile / desktop |
| [ui-review](ui-review.md) | QA checklist before UI work is done |
| [verify-change](verify-change.md) | After any feature |
| [fix-layers](fix-layers.md) | `pnpm layers` failed |
| [envelope-api](envelope-api.md) | New route, SSE, PDF, or error shape |

Shared wrappers live in `.agents/skills/<name>/SKILL.md` (YAML `name` + `description`, then a pointer here). `create-ysk-app` and `ysk-kit upgrade` also write identical copies to `.claude/skills/`, `.cursor/skills/`, and `.grok/skills/` from `tooling/ysk-cli/templates/agent/`. `pnpm ysk-kit check agent` fails if those copies drift or drop `AGENTS.md`.

Other agents read `AGENTS.md`, then this index.
