# Skill: add capability

Language: [中文](add-capability.zh.md) · English

Merge a catalogued platform feature. Follow [docs/recipes/add-capability.md](../recipes/add-capability.md). Law: [AGENTS.md](../../AGENTS.md).

## Steps

1. Confirm the name is in the catalogue (`auth`, `rbac`, `audit-log`, `storage`, `i18n`, `jobs`, `mail`, `notifications`, `llm`, `websocket`, `push`, `mobile`, `team`, `apikey`, `crypto`, `billing`). Alias `org` → `team`.
2. If the name is `billing`, run `pnpm ysk add team` first.
3. `pnpm ysk add <name>`.
4. `pnpm db:migrate` when Prisma changed.
5. Fill env keys from `.env.example` (never commit secrets).
6. [verify-change](verify-change.md).

Do not invent a new capability folder outside the catalogue. Do not add an industry domain this way.
