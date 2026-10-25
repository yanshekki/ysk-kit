---
name: upgrade-kit
description: >
  Upgrade YSK Kit dependencies, review Dependabot, and run local smoke when
  GitHub Actions quota is exhausted. Use when doing weekly kit maintenance, stable
  bumps, major-hold lists, ki-mac-mini gates, or /upgrade-kit.
  中文：kit 依賴、Dependabot、穩定版、本機 smoke、ki-mac-mini。
  Do not use to refresh a generated product (docs/guides/upgrade.md).
---

Read `docs/skills/upgrade-kit.md`. Law: `AGENTS.md`.

1. Sync `origin/main`. Upgrade **stable** only (never beta/RC/alpha/canary/nightly).
2. Audit pins + `pnpm ysk-kit check supply --repo-only --online`. Hold majors (Electron 45, TypeScript 7, Prisma 8) unless the user approved.
3. When Actions quota is exhausted, run local `check` / thin-smoke / e2e equivalents on this machine and record results. Trusted Publishing / OIDC only.
Gotcha: dest-product refresh is `docs/guides/upgrade.md` (`pnpm ysk-kit upgrade`), not this skill.
Verify: no new pre-releases; changeset if public packages changed; local gates documented.
Full steps: `docs/skills/upgrade-kit.md`.
