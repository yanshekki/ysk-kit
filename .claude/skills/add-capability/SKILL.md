---
name: add-capability
description: >
  Merge a catalogued YSK Kit capability (llm, team, billing, push, jobs, mail, …) with ysk-kit add.
  Use when the user wants ysk-kit add llm/team/billing/push, restore a thin capability, or /add-capability.
  中文：加能力、llm、billing、push、doctor。
  Do not use to invent a capability outside the catalogue or to add industry domain.
---

Read `docs/skills/add-capability.md`. Law: `AGENTS.md`.

1. Catalogue name only. `billing` needs `team` first.
2. `pnpm ysk-kit add <name>`. Prisma → db-migration.
3. Before production: billing→webhook-handling, llm→llm-feature, push credentials, apikey scope/rotation. Then doctor.
Gotcha: second add is a no-op when the skip token exists.
Verify: `pnpm ysk-kit doctor` then the five verify commands.
Full steps: `docs/skills/add-capability.md`.
