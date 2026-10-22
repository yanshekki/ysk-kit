# Scan third-party versions

Language: [中文](scan-supply.zh.md) · English

How to inventory Node, PHP, kernel, lockfile, Actions, and compose pins with `ysk-kit check supply`. Law: [AGENTS.md](../../AGENTS.md). Skill: [supply-scan](../skills/supply-scan.md). CLI: [ysk-kit](../cli/ysk-kit.md).

## Commands

```bash
pnpm ysk-kit check supply --json
pnpm ysk-kit check supply --repo-only
pnpm ysk-kit check supply --repo-only --online
```

`--repo-only` skips host PHP and kernel (CI). `--online` runs `pnpm audit --json` and honors `pnpm-workspace.yaml` `auditConfig.ignoreGhsas`. Vitest never calls the registry.

## What a finding looks like

```text
runtime-below-floor  node  have=v26.12.0 need=26.12.1  CVE-2026-111497
constraint-below-floor  engines.node  have=>=26.0.0 need=26.12.1  package.json  CVE-2026-111497
```

`--json` prints `{ ok, catalogUpdated, inventory, findings }` for agents.

## Typical remediations

| Finding | Fix |
|---|---|
| Node below floor | Install ≥26.12.1; set `engines.node` to `>=26.12.1` |
| PHP below floor | Install the patched line (8.2.35 / 8.3.36 / 8.4.27 / 8.5.12); composer `>=8.2.35` |
| GHSA | Workspace override to a patched release, or documented `ignoreGhsas` |
| Unpinned Action | `uses: owner/repo@<40-char-sha>` |
| Compose `latest` | Pin a version tag |
| Kernel reminder | Distro kernel update; the CLI will not fail CI on `ubuntu-latest` |

Do not add Trivy or OSV-Scanner as a default. Do not run exploit PoCs. After a new world-class CVE, patch `tooling/ysk-cli/src/supply/catalog.json` then re-run.
