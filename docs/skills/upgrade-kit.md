---
name: upgrade-kit
description: >
  Upgrade YSK Kit dependencies, review Dependabot, and run local smoke when
  GitHub Actions quota is exhausted. Use when doing weekly kit maintenance, stable
  bumps, major-hold lists, ki-mac-mini gates, or /upgrade-kit.
  中文：kit 依賴、Dependabot、穩定版、本機 smoke、ki-mac-mini。
  Do not use to refresh a generated product (docs/guides/upgrade.md).
---

# Skill: upgrade this kit

Language: [中文](upgrade-kit.zh.md) · English

Bump **this repository** (the living kit), not a dest product. Law: [AGENTS.md](../../AGENTS.md). Supply inventory: [supply-scan](supply-scan.md). Product-tree refresh: [Refreshing a generated product](../guides/upgrade.md) (`pnpm ysk-kit upgrade`) — that is a different job.

## Trigger

- Weekly kit maintenance, Dependabot PRs, or “bump deps”.
- A named toolchain (pnpm, Electron, Expo, Prisma, Node) has a newer **stable** release.
- GitHub Actions quota is exhausted; gates must run on ki-mac-mini (or another private worker).

Do not use to copy guardrails into a product (`ysk-kit upgrade`), to add a module, or to implement a feature.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Checkout | yes | Clean tree on latest `origin/main` |
| Host | when Actions cannot run | ki-mac-mini local equivalents of `check` / `thin-smoke` / `e2e` / `supply` |
| Approval | majors | Electron 45, TypeScript 7, Prisma 8, other majors — ask first |

## Steps

1. **Sync.** `git fetch origin && git checkout main && git pull --ff-only origin main`. Do not mix unrelated dirty work.

2. **Stable only.** Upgrade to latest **stable**. Never beta / RC / alpha / canary / nightly. If a tempting pre-release exists, stay on stable and list it under Held.

3. **Audit.** Compare `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` overrides, Actions SHAs, compose / Docker tags, Expo, Electron, `engines.node`, Vite. Then [supply-scan](supply-scan.md):

   ```bash
   pnpm ysk-kit check supply --repo-only --online
   ```

   `--repo-only --online` is what CI runs. Do not add Trivy. Do not invent a static npm registry token (Trusted Publishing / OIDC only).

4. **Classify.** Safe patch / minor that satisfies engines and peers → bump. Major or peer-breaking → hold for user approval. Ranked hold examples (2026-10-25): Electron **45.0.0** (stable since 2026-10-20; stay on 44.x until approved), TypeScript **7**, Prisma **8** (`latest` is still RC). Existing `@ts-rest/core` `3.53.0-rc.1` stays; do not introduce **new** pre-releases.

5. **One branch.** Apply safe bumps + critical vuln fixes together. Lockstep patch changeset across public `@ysk-kit/*` when user-facing packages change. Dependabot-only merges on `main` without product/docs/AGENTS work do **not** need a release by themselves.

6. **Local gates when Actions cannot run** (ki-mac-mini):

   ```bash
   pnpm lint && pnpm check:links
   pnpm ysk-kit check supply --repo-only --online
   pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi
   pnpm ysk-kit check agent && pnpm ysk-kit check errors
   ```

   Then thin-smoke (`create-ysk-app --preset thin --flavor saas --no-admin --no-mobile --db sqlite`, then dest `layers` / `check agent` / `check errors` / `typecheck` / `test` / `gen:openapi`). `pnpm e2e` when MySQL 8.4 is up. Record exact commands and results in the PR. Leave the PR open if the ruleset still requires GitHub check statuses that Actions cannot provide.

7. **Verify** with [verify-change](verify-change.md) after code edits. Cancel Actions runs that fire if quota is exhausted.

## Verification

```bash
pnpm ysk-kit check supply --repo-only --online
pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent
```

- [ ] No beta / RC / alpha / canary / nightly introduced
- [ ] Majors held unless the user approved them
- [ ] Changeset present when public packages change
- [ ] Local gate commands + results in the PR
- [ ] Dest-product refresh was **not** done here

## Output format

```md
## Upgrade kit — <date>
Stable bumps: <from → to>
Held (pre-release / major): <list>
Vulns: <fixed | ignored with reason | none>
Local gates: <commands + ok/fail>
PR: <url or none>
Release: vX.Y.Z changeset | no release needed
```

## Done criteria

Safe stables are on the branch or explicitly skipped with a reason. Majors are not sneaked in. Local CI equivalents ran on this machine when Actions could not. Product `ysk-kit upgrade` was not confused with this work.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `pnpm ysk-kit upgrade` on this kit to “bump deps” | This skill; dest refresh is [upgrade](../guides/upgrade.md) |
| Electron 45 / TS 7 / Prisma 8 “because latest” | Hold; ask |
| Paste a static npm registry token | Trusted Publishing / OIDC only |
| Skip gates because Actions is red on quota | Run the local list above; document results |
| New skill spam | At most 1–2 high-leverage bilingual skills per week |

## Escalate / ask

Ask before a major (Electron 45, TypeScript 7, Prisma 8, a new default HTTP adapter), before adding an envelope exception, or before publishing from a laptop.
