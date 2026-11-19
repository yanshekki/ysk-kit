---
name: plan
description: >
  Write a YSK Kit feature plan to docs/plans/<yyyy-mm-dd>-<slug>.md.
  Default is lean (six sections). Use --full for HTTP / Prisma / auth /
  secrets / webhook / envelope exceptions.
  Use when the user wants a plan, plan.md, or design.
  Do not use for typo-only or one-file mechanical renames.
---

Read `docs/skills/plan-feature.md`. Law: `AGENTS.md`. Read `docs/agent/NOW.md` first.

`pnpm ysk-kit plan <slug>` writes a lean English plan. `--full` uses the 19-section template. `--zh` writes the Chinese pair. `--lean` and `--full` cannot be used together.
