---
name: supply-scan
description: >
  Scan YSK Kit third-party runtimes and pins (Node, PHP, Linux kernel,
  lockfile IOCs, GitHub Actions SHA, compose tags) with ysk-kit check supply.
  Use when CVE, php2shell, Node security release, supply chain, third-party
  versions, lockfile audit, or /supply-scan.
  中文：供應鏈、第三方程式、CVE、runtime 下限、check supply。
  Do not use for diff-scoped authz (security-review) or to reproduce exploits.
---

Read `docs/skills/supply-scan.md`. Law: `AGENTS.md`.

1. Run `pnpm ysk-kit check supply --json` then `--repo-only`. Do not `npx` an unknown scanner.
2. If the named CVE is newer than catalog.updated, research the vendor advisory, patch `tooling/ysk-cli/src/supply/catalog.json`, re-run.
3. Remediate: raise engines / composer / override. `ignoreGhsas` only with a CHANGELOG reason. Credential-theft campaigns: rotate.
Gotcha: kernel reminders are warn-only; do not write exploit PoCs.
Verify: `ysk-kit check supply --repo-only` ok (or documented ignores).
Full steps: `docs/skills/supply-scan.md`.
