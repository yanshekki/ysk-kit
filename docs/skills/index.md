# Skills

Language: [中文](index.zh.md) · English

Procedures for people and AI agents. Each skill is a short sequence that points at law, CLI, and recipes. It does not duplicate [AGENTS.md](../../AGENTS.md).

| Skill | When |
|---|---|
| [new-product](new-product.md) | Scaffold a product with `create-ysk-app` |
| [add-module](add-module.md) | New HTTP resource |
| [add-capability](add-capability.md) | Restore llm / team / billing / push (or other catalogue names) |
| [verify-change](verify-change.md) | After any feature |
| [fix-layers](fix-layers.md) | `pnpm layers` failed |
| [envelope-api](envelope-api.md) | New route, SSE, PDF, or error shape |

Grok loads `.grok/skills/<name>/SKILL.md`. Cursor loads `.cursor/skills/<name>/SKILL.md`. Those files are English wrappers generated from `tooling/ysk-cli/templates/agent/` (`create-ysk-app` and `ysk upgrade`): YAML `description` plus a pointer here. They are gitignored. Other agents read `AGENTS.md`, then this index.
