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

# Skill: scan third-party versions

Language: [中文](supply-scan.zh.md) · English

Inventory runtimes and pins, then match them against the vendored catalog. Law: [AGENTS.md](../../AGENTS.md). CLI: [ysk-kit check supply](../cli/ysk-kit.md). Diff-scoped authz stays in [security-review](security-review.md). Recipe: [scan supply](../recipes/scan-supply.md).

## Trigger

- The user asks to scan dependencies, CVEs, supply chain, or third-party program versions.
- A named runtime CVE (php2shell, a Node.js security release, a kernel LPE).
- Before a release, or when adding a **runtime** dependency.
- `ysk-kit check supply` reported findings.

Do not use for diff-scoped authz / tenancy / secrets ([security-review](security-review.md)), or to reproduce exploits.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Product root | no | `YSK_ROOT` if the scan is not this checkout |
| Named CVE / advisory | when the user named one | Compare its published date to `catalog.updated` |
| Network | for `--online` | `pnpm audit --json`; not for Vitest |

## Steps

1. Run both:

   ```bash
   pnpm ysk-kit check supply --json
   pnpm ysk-kit check supply --repo-only
   ```

   Host scan sees Node / PHP / kernel. `--repo-only` is what CI pins. Do not `npx` Trivy, OSV-Scanner, or an unknown scanner. Do not add a third-party GitHub Action to “just scan”.

2. If the named CVE’s published date is newer than `tooling/ysk-cli/src/supply/catalog.json` `updated`, or the id is absent: read the **vendor** advisory (php.net, Node.js blog, distro, CISA). Patch the catalog floors / IOC seed, bump `updated`, re-run. Products consume the catalog by upgrading `@ysk-kit/cli`.

3. Classify findings:

   | Rule | Meaning | Typical fix |
   |---|---|---|
   | `runtime-below-floor` | Host or CLI Node/PHP patch is below the line min | Install the patched interpreter |
   | `constraint-below-floor` | `engines.node` or `require.php` still allows a vulnerable patch | Raise the range (kit: `>=26.12.1`, PHP `>=8.2.35`) |
   | `runtime-eol` | PHP ≤8.1 (no upstream php2shell fix) | Migrate to a supported line |
   | `compromised-package` | Lockfile matches a catalog IOC (Shai-Hulud-class) | Remove / pin a known-good version; rotate credentials |
   | `audit-advisory` | `--online` GHSA not in `ignoreGhsas` | Override a patched release, or document an ignore |
   | `action-unpinned` | `uses:` is a tag, not a 40-character SHA | Pin by SHA (security-review already requires this) |
   | `image-unpinned` | Compose tag missing or `latest` | Pin a version tag (`mysql:8.4` is fine) |
   | `kernel-advisory` | Host is Linux; `uname` is **not** a pass | Confirm the distro kernel; warn-only, does not fail |

4. Remediate. Raise `engines` / composer / workspace override. Add `ignoreGhsas` only with a CHANGELOG reason (uuid / node-forge / braces style). Credential-theft campaigns: rotate npm, GitHub, and cloud tokens; do not only bump. Never paste exploit steps or PoCs.

5. Emit the [output format](#output-format). Then [verify-change](verify-change.md) if you changed code.

## Catalog

`tooling/ysk-cli/src/supply/catalog.json` ships inside `@ysk-kit/cli`. Initial floors (vendor advisories, 2026-10-21):

- Node 22 ≥ 22.23.4, 24 ≥ 24.22.1, 26 ≥ 26.12.1 (CVE-2026-111497).
- PHP 8.2 ≥ 8.2.35, 8.3 ≥ 8.3.36, 8.4 ≥ 8.4.27, 8.5 ≥ 8.5.12 (CVE-2026-109618 / CVE-2026-109619). PHP ≤8.1 is EOL.
- Linux reminders: Dirty Frag (CVE-2026-43284), ptrace LPE (CVE-2026-46333) — inventory only.
- npm seed: `@ctrl/tinycolor` 4.1.1 / 4.1.2 (Shai-Hulud). Completeness is `--online`.

## Verification

```bash
pnpm ysk-kit check supply --repo-only
pnpm ysk-kit check agent
```

Expected: `ysk-kit check supply: ok` on a patched tree (or only documented ignores / warn-only kernel). `check agent: ok` after catalog or skill edits.

- [ ] No exploit PoC in the tree or the write-up
- [ ] `ignoreGhsas` has a CHANGELOG reason when used
- [ ] Catalog `updated` matches the advisory you just added

## Output format

```md
## Supply scan — <scope>

catalog.updated: <date>
host: node <ver> php <ver|none> kernel <ver|skipped>
repo: engines.node <range> composer.php <range|none>

| Rule | Component | Have | Need | Advisories | Action |
|---|---|---|---|---|---|
| 1 | node | 26.12.0 | 26.12.1 | CVE-2026-111497 | install patched Node |

Online: ran | skipped
Done: no | yes
```

## Done criteria

Failing findings are fixed or explicitly accepted with a documented ignore. Catalog is current for the named CVE. No unknown scanner binary was added.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `npx trivy` / `osv-scanner` as default | `ysk-kit check supply`; ask before a new scanner binary |
| Treat `uname -r` as patched | Kernel is warn-only; read the distro advisory |
| Ignore GHSA to make CI green | Override a patched release, or document why |
| Reproduce php2shell / Dirty Frag | Inventory versions; never run a PoC |
| Fold CVE rules into `check agent` | `check agent` is law (enum / Prisma / fetch / skill-drift) |

## Escalate / ask

Stop and ask before adding Trivy/OSV-Scanner/Snyk as a kit default, before a new envelope exception, or before weakening `ignoreGhsas` without a reason.
