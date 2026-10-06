# Changelog

Language: [中文](CHANGELOG.zh.md) · English

Versioned notes for YSK Kit, newest first. [README.md](README.md) shows only the latest three versions. Entries come from GitHub product releases, tags, the Changesets per-package changelogs, and git history.

Changesets still writes each package changelog. Those files stay:

| Package | Changelog |
|---|---|
| `@ysk-kit/api-express` | [packages/api-express/CHANGELOG.md](packages/api-express/CHANGELOG.md) |
| `@ysk-kit/api-fastify` | [packages/api-fastify/CHANGELOG.md](packages/api-fastify/CHANGELOG.md) |
| `@ysk-kit/api-http` | [packages/api-http/CHANGELOG.md](packages/api-http/CHANGELOG.md) |
| `@ysk-kit/apikey` | [packages/apikey/CHANGELOG.md](packages/apikey/CHANGELOG.md) |
| `@ysk-kit/application` | [packages/application/CHANGELOG.md](packages/application/CHANGELOG.md) |
| `@ysk-kit/auth` | [packages/auth/CHANGELOG.md](packages/auth/CHANGELOG.md) |
| `@ysk-kit/cli` | [tooling/ysk-cli/CHANGELOG.md](tooling/ysk-cli/CHANGELOG.md) |
| `@ysk-kit/config` | [packages/config/CHANGELOG.md](packages/config/CHANGELOG.md) |
| `@ysk-kit/contracts` | [packages/contracts/CHANGELOG.md](packages/contracts/CHANGELOG.md) |
| `@ysk-kit/create-app` | [tooling/create-ysk-app/CHANGELOG.md](tooling/create-ysk-app/CHANGELOG.md) |
| `@ysk-kit/crypto` | [packages/crypto/CHANGELOG.md](packages/crypto/CHANGELOG.md) |
| `@ysk-kit/db-prisma` | [packages/db-prisma/CHANGELOG.md](packages/db-prisma/CHANGELOG.md) |
| `@ysk-kit/domain-kernel` | [packages/domain-kernel/CHANGELOG.md](packages/domain-kernel/CHANGELOG.md) |
| `@ysk-kit/i18n` | [packages/i18n/CHANGELOG.md](packages/i18n/CHANGELOG.md) |
| `@ysk-kit/jobs` | [packages/jobs/CHANGELOG.md](packages/jobs/CHANGELOG.md) |
| `@ysk-kit/llm` | [packages/llm/CHANGELOG.md](packages/llm/CHANGELOG.md) |
| `@ysk-kit/logger` | [packages/logger/CHANGELOG.md](packages/logger/CHANGELOG.md) |
| `@ysk-kit/mail` | [packages/mail/CHANGELOG.md](packages/mail/CHANGELOG.md) |
| `@ysk-kit/observability` | [packages/observability/CHANGELOG.md](packages/observability/CHANGELOG.md) |
| `@ysk-kit/push` | [packages/push/CHANGELOG.md](packages/push/CHANGELOG.md) |
| `@ysk-kit/realtime` | [packages/realtime/CHANGELOG.md](packages/realtime/CHANGELOG.md) |
| `@ysk-kit/sdk` | [packages/sdk/CHANGELOG.md](packages/sdk/CHANGELOG.md) |
| `@ysk-kit/storage` | [packages/storage/CHANGELOG.md](packages/storage/CHANGELOG.md) |
| `@ysk-kit/ui` | [packages/ui/CHANGELOG.md](packages/ui/CHANGELOG.md) |
| `@ysk-kit/ui-logic` | [packages/ui-logic/CHANGELOG.md](packages/ui-logic/CHANGELOG.md) |
| `@ysk-kit/web-sdk` | [packages/web-sdk/CHANGELOG.md](packages/web-sdk/CHANGELOG.md) |

The phase diary (Phase 1 through Phase 53) stays in [docs/history.md](docs/history.md).

## v1.2.3

### New features

- Agent skills `contract-change`, `debug-issue`, `review-change`, and `llm-feature` (English + Hong Kong Traditional Chinese), with `.agents` / `.claude` wrappers, Cursor / Copilot pointers, and create-app / upgrade templates.

### Improvements

- Every skill wrapper is a short step summary (Use when, Chinese triggers, Do not use for…) instead of a one-line pointer. Skills that lacked them now have Output format, Anti-patterns, and Escalate / ask.
- `verify-change` names expected output per command, a failure-to-fix table, `git diff --exit-code docs/openapi.yaml`, and a fixed verification report.
- `new-product` verifies with `pnpm ysk-kit doctor`, lists human-filled fields (`eas` `projectId`), and hints at flavor choice.
- `add-module` requires Express **and** Fastify app tests; org-scoped resources check membership in `application/`.
- `add-capability` has a one-line before-production item per capability (billing → webhook-handling, llm → llm-feature, push credentials, apikey scope/rotation) plus doctor.
- `envelope-api` has an error-code → HTTP table, `AppError` / `ERROR_MESSAGE` zh-HK+en, and webhook-style off ts-rest JSON.
- `fix-layers` maps each cruiser rule to a typical bad import and forbids editing `.dependency-cruiser.cjs` without approval.
- Skill index adds “Do not use when” and “Related vendor skill” columns.

### Security

- Workspace override `shell-quote@1.11.0` closes [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) / CVE-2026-102422 (`quote()` command injection after a `{ comment }` token). The copy is transitive through Expo / React Native `react-devtools-core`.

## v1.2.2

### New features

- Agent skills `security-review`, `db-migration`, `webhook-handling`, and `desktop-electron` (English + Hong Kong Traditional Chinese), with `.agents` / `.claude` wrappers, scoped Cursor / Copilot pointers, and create-app / upgrade templates.

### Improvements

- `add-module`, `add-capability`, `verify-change`, and `envelope-api` point at the new procedures. The plan template's data-model and security sections name Prisma expand/contract, security review, webhooks, and Electron.

### Fixes

- Published `@ysk-kit/*` libraries emit valid Node ESM: relative imports in `dist/` include `.js` extensions, so `node` can load the tarball (`import('@ysk-kit/<pkg>')`). Public packages inherit `module` / `moduleResolution` `NodeNext` from `tsconfig.base.json`.
- `@ysk-kit/create-app` and `@ysk-kit/cli` bins start with `#!/usr/bin/env node` and are executable, so `create-ysk-app` / `ysk-kit` / `yskk` run after install (they previously failed with `import: not found` and `ERR_MODULE_NOT_FOUND`).
- Scaffold from npm is `npm create @ysk-kit/app` or `pnpm create @ysk-kit/app`. There is no unscoped `create-ysk-app` package on npm; the published package is `@ysk-kit/create-app`.
- `@ysk-kit/observability` pins OpenTelemetry SDK and exporter packages to versions that exist on npm (`resources` / `sdk-*` 2.11.0, exporters / instrumentation 0.222.0). Caret ranges floated onto `sdk-metrics@2.12.0`, which depends on missing `resources@2.12.0`.

### Security

- Electron no longer writes access or refresh tokens to disk in plaintext when `safeStorage` is unavailable. Tokens stay in memory for the session and the main process logs a warning that does not include the secret.
- Desktop sets a Content-Security-Policy, `sandbox: true`, and `webSecurity: true`, denies unexpected navigation and `window.open`, and rejects IPC whose sender frame is not the loaded renderer.
- `@ysk-kit/logger` redacts authorization headers, cookies, tokens, passwords, API keys, and similar fields (pino `redact`).
- `/v1/llm/complete` and `/v1/llm/stream` accept only `user` and `assistant` messages. The system prompt comes from `LLM_SYSTEM_PROMPT` (server-owned). Per-user quota is `LLM_QUOTA_MAX` / `LLM_QUOTA_WINDOW_MS` and returns envelope `RATE_LIMITED` (429).
- `POST /v1/billing/webhook` still verifies `Stripe-Signature` on the raw body, persists Stripe `event.id` on `ProcessedWebhookEvent`, acks duplicates, and ignores older events for the same organization.

### Internal/CI

- CI job `pack-and-run` builds, `pnpm pack`s all 26 public packages, installs the tarballs in a clean directory, imports each package, runs the CLI `--help` bins, and scaffolds a non-interactive `php-bridge` dest from the in-tree CLI.
- Release skips the tag step when `changesets/action` reports `hasChangesets` (version PR opened or updated). `.github/tag-and-release.mjs` reads versions, pending changeset files, and `CHANGELOG.md` at `GITHUB_SHA`. After a successful publish it creates the annotated `vX.Y.Z` tag at that commit, opens a GitHub Release with that version's changelog notes, and verifies by installing the published tarballs and running the CLI bins. Publish stays OIDC Trusted Publishing only.
- `thin-smoke`, `flavor-smoke`, create-app, and upgrade tests assert the new skill files and Cursor rules.

## v1.2.1

### New features

- `pnpm ysk-kit plan --check <file>` verifies a plan has every required template heading and fails when a required section is still placeholder-only.
- Agent skills `test-plan`, `write-tests`, `ui-design`, and `ui-review` (English + Hong Kong Traditional Chinese), with `.agents` / `.claude` wrappers and scoped Cursor / Copilot pointers so generated products get them via `create-ysk-app` and `ysk-kit upgrade`.

### Improvements

- The planning protocol keeps the v1.2.0 kit-specific sections and adds: explore-before-planning (**Current state and reuse** before Contracts), **Assumptions** next to Scope / Non-goals, **Options considered** (two approaches when a real alternative exists), task steps that name files / interface / contract / data / risk / rollback / acceptance, verification commands with expected results and a manual-check list, and an approval / anti-shrinking gate.
- [docs/plans/README.md](docs/plans/README.md) maps native plan modes (Grok Build, Cursor, Claude Code, Codex, OpenCode, Copilot) to this template, with a copy-paste `/plan` prompt (EN + zh). The approved plan is still `docs/plans/<date>-<slug>.md` via `pnpm ysk-kit plan <slug>`.
- The plan template's Test plan section points at `test-plan` (risk-ranked given/when/then, fixtures, out of scope, layer map).
- Nested `AGENTS.md` files point API/contracts at testing skills and client apps at UI skills.
- The lockstep test requires any pending changeset set to list all 26 public `@ysk-kit` packages at one bump type.

### Internal/CI

- `thin-smoke` and `flavor-smoke` assert the new template headings plus the testing/UI skill files and Cursor rules. Generated products receive the upgraded `_template.md` pair. create-app and upgrade tests assert the same skill files.

## v1.2.0

### New features

- `pnpm ysk-kit plan <slug>` writes a bilingual feature plan to `docs/plans/<yyyy-mm-dd>-<slug>.md` (and the `.zh.md` pair) from the shared template, plus a gitignored root `plan.md` pointer.
- Thin and full workspace products receive the same agent pointer set: `.agents/skills/`, `.claude/skills/`, scoped `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `.gemini/settings.json`, `GEMINI.md`, and the plan template.

### Improvements

- `AGENTS.md` / `AGENTS.zh.md` are a professional agent guide: orientation, repo map, the ten hard rules with reasons, a mandatory understand → plan → contracts → scaffold → implement → verify → docs workflow, definition of done, ask-vs-decide, pitfalls, and a coding-tool table. Procedures stay in `docs/skills/`.
- `pnpm ysk-kit check agent` also fails when a pointer file drops `AGENTS.md`, skill copies drift, or root + nested `AGENTS.md` exceed 24 KiB.
- Skills (`docs/skills/` and `.agents/skills/`) now include `plan-feature` and use trigger / inputs / steps / verification / done criteria.

### Security

- pnpm override `source-map-js@1.2.2` closes [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) / CVE-2026-93749 (indexed source-map offset event-loop DoS). The copy is transitive through PostCSS / Expo Metro.

### Dependency upgrades

| Package | From | To |
|---|---|---|
| source-map-js (workspace override) | 1.2.1 | 1.2.2 |

### Internal/CI

- `thin-smoke` and `flavor-smoke` assert the generated pointer set. `php-bridge` still skips workspace agent stubs.

## v1.1.3

### Improvements

- The root `README.md` and `README.zh.md` list only the latest three versions. Each version is grouped into the categories that apply: New features, Improvements, Fixes, Security, Dependency upgrades, and Internal/CI. The section ends with a link to this file.

### Internal/CI

- This file and [CHANGELOG.zh.md](CHANGELOG.zh.md) keep every version, newest first, in those categories. The per-package changelogs above stay as Changesets writes them.
- [Contributing](docs/contributing.md) and the release section of [workspace scripts](docs/cli/workspace-scripts.md) require each release to add the new version at the top of the README section and move the oldest of the three into this file.

## v1.1.2

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.2)

### Security

- npm publish uses Trusted Publishing only. The release workflow keeps `id-token: write` and provenance, and does not pass a static npm credential.
- `actions/setup-node` does not receive `registry-url` or `scope`, so it does not write a registry auth line that would override OIDC.
- `.github/publish-packages.mjs` exits when the GitHub OIDC token is unavailable.

### Internal/CI

- Post-publish `npm view` verification stays.
- The product release remains one annotated tag `vX.Y.Z`.

## v1.1.1

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.1)

### Improvements

- `ysk-kit doctor` quotes the product's `packageManager` pin in the engines fix.
- `pnpm version:packages` copies `@ysk-kit/create-app`'s version into the root `package.json` and into the version cells in `README.md` and `README.zh.md`.

### Security

- Overrides stay on `deepmerge-ts` 8.0.2, `mariadb` 3.4.7 (the Prisma adapter declares 3.4.5), and `mysql2` 3.24.5.
- Accepted, with no patched npm release: uuid 7 via Expo `xcode` (GHSA-w5hq-g745-h8pq), node-forge 1.4.0 via Expo CLI code signing (GHSA-86w9-cpqp-85rv), and braces 3.0.3 via Metro's file map (GHSA-vfj7-8cjw-p6xm).

### Dependency upgrades

- pnpm 12.9.0 (the 12.9.0 `pnpm login` redirect no longer forwards credentials; 12.9.1 was still inside the 24-hour release-age window), Turborepo 2.11.7, pino 10.4.0, `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` 3.1146.0, `@tanstack/react-query` 5.104.1, supertest 7.3.1, and `@types/node` 24.19.1.
- Held: TypeScript 7.0.2, `@types/node` 26 (engines are Node 24), Prisma 8.0.0-rc.19, desktop Vite 7.3.6 with `@vitejs/plugin-react` 5 (electron-vite 5 peers Vite 5–7), Expo 57.0.26 / React Native 0.86.3 / React 19.2.8 (Expo SDK 58 targets React Native 0.88, which is still a release candidate), and `@ts-rest/core` 3.53.0-rc.1.
- `prom-client` 15.1.3 stays until `@prometheus-io/client` replaces the `/metrics` registry. Compose images stay MySQL 8.4, Redis 8.10.2, Jaeger 2.21.0, Prometheus v3.15.0, and Grafana 13.2.3. Actions stay on their commit SHAs.

### Internal/CI

- The release job fails unless `npm view` sees each published version. `pnpm release:publish` runs `pnpm publish --provenance` (commit `817e0f0`, after the v1.1.0 tag and before v1.1.1).

## v1.1.0

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.1.0)

### New features

- `ysk-kit doctor` (`--json`) checks Node and pnpm against `engines`, required env, insecure defaults (`JWT_SECRET` too short or a known placeholder), database reachability and applied migrations, guardrail drift against `ysk-kit upgrade`, and `ysk-kit check agent`. Warnings stay on exit 0. Errors exit 1. The JSON report omits secret values.

### Improvements

- Thin products stub mobile push until `ysk-kit add push`, and that stub's test matches. `static-web3` skips the Prisma enum comparison because that flavor has no API.
- [ADR 0001](docs/adr/0001-ts-rest.md) keeps `@ts-rest/core` pinned at `3.53.0-rc.1`. A contracts test fails if that pin moves. The v2 path recorded there is an in-tree `defineContract` with the same plain router shape. The kit does not add `@ts-rest` server or OpenAPI packages.
- The root `package.json` version matches `@ysk-kit/create-app`, which is what `create-ysk-app` checks inside the `vX.Y.Z` archive.

### Security

- 1.1.0 was published by GitHub Actions OIDC. Each package's npm metadata records `_npmUser.name` `GitHub Actions`, `_npmUser.trustedPublisher.id` `github`, and `dist.attestations.provenance` (SLSA v1). A static registry credential was still in the workflow as a fallback. pnpm 12 lets a successful OIDC exchange override that static credential.

### Internal/CI

- CI job `flavor-smoke` generates every flavor at `thin` and `full` (sqlite) and runs install, typecheck, test, and build. Flavors: saas, desktop, gateway, php-bridge, trading, static-web3.
- The Changesets action sets `create-github-releases: false`. The v1.1.0 GitHub Release is the product release, not one release per package.
- While changeset files are pending, the release workflow opens the version PR. `pnpm version:packages` runs `changeset version` and the root version sync as one pnpm script.

## v1.0.2

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.2)

### Improvements

- `create-ysk-app` resolves the git tag to a commit, downloads that commit archive, and checks `package.json` name and version.
- The rate limiter stays in memory unless `REDIS_URL` is set, in which case the API uses a Redis fixed window.
- Each public package publishes `license: MIT`, a description, `homepage` https://ysk.hk/products/ysk-kit, `repository.directory`, and a README.

### Fixes

- README License and Author match ysk-omni (commit `10e4782`).

### Security

- Production `JWT_SECRET` must be at least 32 characters and cannot be `change-me-in-dev-only`. Development still accepts the example secret.

| Component | Advisory | Severity | Status |
|---|---|---|---|
| mariadb | GHSA-cqhc-2h57-wpxf / CVE-2026-55215, GHSA-42r5-vhpq-m858, GHSA-g5xc-5w98-jfvm | HIGH + two moderate | Fixed. pnpm override `mariadb@3.4.7` (patched in 3.4.6). `@prisma/adapter-mariadb` had pinned 3.4.5. |
| mysql2 | GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3 | HIGH + moderate | Fixed. Override `mysql2@3.24.5`. Prisma had pinned 3.15.3. |
| deepmerge-ts | GHSA-ggr8-5vv4-36mx / CVE-2026-40345 | HIGH | Fixed. Override `deepmerge-ts@8.0.2`. Prisma had pinned 7.1.5. |
| uuid 7.0.3 via Expo `xcode` | GHSA-w5hq-g745-h8pq / CVE-2026-41907 | moderate | Accepted. The fix is uuid 11+, which is ESM-only and breaks xcode's CommonJS `require()`. Recorded in `auditConfig.ignoreGhsas`. |
| Redis 8.10.2-alpine, Prometheus 3.15.0 | Trivy | — | Clean. |
| Grafana 13.2.3, Jaeger 2.21.0, mysql:8.4, postgres:18-alpine | Image CVEs in bundled plugins, Alpine OpenSSL, or `gosu` | HIGH/CRITICAL | Accepted. Official images. Fixes are upstream rebuilds. Postgres 19 is still beta. |
| GitHub Actions | — | — | Pinned to commit SHAs. CI is `contents: read`. The release job adds contents write, pull-request write, and `id-token: write`. npm publish sets `NPM_CONFIG_PROVENANCE=true`. |

### Dependency upgrades

| Package | From | To |
|---|---|---|
| Biome | 2.5.14 | 2.5.15 |
| Turborepo | 2.11.5 | 2.11.6 |
| dependency-cruiser | 18.4.0 | 18.5.0 |
| Vitest | 5.0.2 | 5.0.3 |
| Vite (web, admin) | 8.3.1 | 8.3.2 |
| React, react-dom | 19.2.3 | 19.2.8 |
| TanStack Router | 1.120.3 | 1.170.41 |
| Electron | 44.4.5 | 44.5.1 |
| Expo | 57.0.25 | 57.0.26 |
| BullMQ / Bull Board | 6.3.9 / 9.10.1 | 6.3.11 / 9.10.2 |
| pg | 8.16.3 | 8.23.1 |
| AWS S3 SDK | 3.1142.0 | 3.1144.0 |
| Redis image | 8.10-alpine | 8.10.2-alpine |

Also current in that release: nodemailer 10.0.13, socket.io 4.8.4, jose 6.2.12, Playwright 1.63.0, happy-dom 20.14.5, `@types/node` 24.19.0, `@types/supertest` 7.2.1.

Held:

| Item | Reason |
|---|---|
| TypeScript 7.0.2 | dependency-cruiser 18.5 has no TypeScript 7 compiler API. Staying on 6.0.3. |
| Prisma 8.0.0-rc.19 | Release candidate. `@prisma/client` latest was still 7.10.0. |
| Desktop Vite 8 | electron-vite 5 peers Vite 5–7. electron-vite 6 (Vite 8) was still beta. Desktop stays Vite 7.3.6. |
| React 19.3 | React Native 0.86.3 peers `react` ^19.2.3. |
| Expo 58 / React Native 0.87 | Not the Expo SDK 57 pair. |
| `@ts-rest/core` 3.52.1 | The kit was already on 3.53.0-rc.1. `latest` would be a downgrade. |
| MySQL `8.4` | LTS floating tag. Innovation 9.x is not the kit default. |
| Postgres 18 | Postgres 19 was still beta. |
| Node 24 / pnpm 12.8.1 | Already current at that release. |

The same dependency note is the patch text in every public package changelog for 1.0.2: safe ranges for Biome 2.5.15, Turborepo 2.11.6, Vitest 5.0.3, Vite 8.3.2 on web/admin, React 19.2.8, Expo 57.0.26, and Electron 44.5.1, with overrides for `deepmerge-ts` 8.0.2, `mariadb` 3.4.7, and `mysql2` 3.24.5. TypeScript stays 6.0.3, Prisma stays 7.10.0, desktop stays on Vite 7, and `@ts-rest/core` stays on 3.53.0-rc.1. Turborepo `agentGuidance` is off so this repo's `AGENTS.md` stays the agent law.

### Internal/CI

- Release skips npm publish when every public `name@version` is already on the registry (commit `10e4782`).
- `SECURITY.md` (English and Chinese) and weekly Dependabot for npm, GitHub Actions, and Docker.
- Internal markdown links are checked in CI. `pnpm audit --audit-level=low` runs in CI.

## v1.0.1

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.1)

### Improvements

- The generator CLI is `ysk-kit` with alias `yskk`. The `ysk` command is no longer the generator. `create-ysk-app` is unchanged. Package names stay `@ysk-kit/*`.

### Fixes

- `example-smoke` still invoked `pnpm ysk` after the rename. It now calls `ysk-kit` (commit `b44f84a`).

## v1.0.0

[GitHub release](https://github.com/yanshekki/ysk-kit/releases/tag/v1.0.0)

### New features

- First public release. Workspace packages are `@ysk-kit/*`.
- Contract-first SaaS kit (Express 5 + Fastify, Prisma, Vite web/admin, Expo, Electron).
- Sixteen `ysk add` capabilities and `ysk add module` (the `ysk` command was removed in v1.0.1).
- Ten worked examples under `examples/`.
- Public libraries on the npmjs org `ysk-kit`. `create-ysk-app` from the registry downloads the matching GitHub tag of `yanshekki/ysk-kit`.
- The GitHub repo stays `yanshekki/ysk-kit`. GitHub Packages is unused.
