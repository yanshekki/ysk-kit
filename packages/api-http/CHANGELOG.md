# @ysk-kit/api-http

## 1.2.0

### Minor Changes

- bb32f12: Redesign agent guidance: professional AGENTS.md, planning protocol (`docs/plans/` + `ysk-kit plan`), multi-tool pointers, and check-agent guardrails for pointer drift, skill copies, and AGENTS.md size. Pin `source-map-js@1.2.2` (GHSA-68fv-2mgg-jv7q) via a workspace override.

### Patch Changes

- Updated dependencies [bb32f12]
  - @ysk-kit/auth@1.2.0
  - @ysk-kit/contracts@1.2.0
  - @ysk-kit/domain-kernel@1.2.0

## 1.1.3

### Patch Changes

- cafbf05: The root README and README.zh.md list only the latest three versions, grouped by category, and link to the full changelog. CHANGELOG.md and CHANGELOG.zh.md keep every version. Each release adds the new version at the top of the README section and moves the oldest of the three into the full changelog.
- Updated dependencies [cafbf05]
  - @ysk-kit/auth@1.1.3
  - @ysk-kit/contracts@1.1.3
  - @ysk-kit/domain-kernel@1.1.3

## 1.1.2

### Patch Changes

- 1e2a6cd: Publish to npm only with Trusted Publishing (OIDC). The release workflow no longer sends a static npm credential, and the publish script fails if the GitHub OIDC token is unavailable.
- Updated dependencies [1e2a6cd]
  - @ysk-kit/auth@1.1.2
  - @ysk-kit/contracts@1.1.2
  - @ysk-kit/domain-kernel@1.1.2

## 1.1.1

### Patch Changes

- cc7076b: Weekly maintenance for 2026-10-04. pnpm 12.9.0, Turborepo 2.11.7, pino 10.4.0, AWS SDK S3 clients 3.1146.0, TanStack Query 5.104.1, supertest 7.3.1, and @types/node 24.19.1. Doctor quotes the product packageManager pin. Audit accepts unfixed node-forge (Expo CLI) and braces (Metro). Held: TypeScript 7, Node 26 types, Prisma 8 rc, desktop Vite 7, Expo 57 / React Native 0.86 / React 19.2.8.
- Updated dependencies [cc7076b]
  - @ysk-kit/auth@1.1.1
  - @ysk-kit/contracts@1.1.1
  - @ysk-kit/domain-kernel@1.1.1

## 1.1.0

### Minor Changes

- 149f4fa: `ysk-kit doctor` checks Node/pnpm engines, required env, insecure defaults, database reachability and migrations, guardrail drift versus `upgrade`, and `check agent`. `--json` prints the report. Exit 1 when any check is an error.
  
  Thin products stub mobile push until `ysk-kit add push`, and that stub's test matches. `static-web3` skips the Prisma enum comparison because that flavor has no API.

### Patch Changes

- Updated dependencies [149f4fa]
  - @ysk-kit/auth@1.1.0
  - @ysk-kit/contracts@1.1.0
  - @ysk-kit/domain-kernel@1.1.0

## 1.0.2

### Patch Changes

- Refresh safe dependency ranges (Biome 2.5.15, Turborepo 2.11.6, Vitest 5.0.3, Vite 8.3.2 on web/admin, React 19.2.8, Expo 57.0.26, Electron 44.5.1). pnpm overrides patch transitive `deepmerge-ts` 8.0.2, `mariadb` 3.4.7, and `mysql2` 3.24.5. TypeScript stays 6.0.3, Prisma stays 7.10.0, desktop stays on Vite 7, and `@ts-rest/core` stays on 3.53.0-rc.1.
- Updated dependencies
  - @ysk-kit/auth@1.0.2
  - @ysk-kit/contracts@1.0.2
  - @ysk-kit/domain-kernel@1.0.2

## 1.0.1

### Patch Changes

- CLI command is `ysk-kit` with alias `yskk`. The `ysk` binary is removed.
- Updated dependencies
  - @ysk-kit/auth@1.0.1
  - @ysk-kit/contracts@1.0.1
  - @ysk-kit/domain-kernel@1.0.1

## 1.0.0

### Major Changes

- First public release. Packages publish to npmjs as `@ysk-kit/*`. `create-ysk-app` from the registry downloads the matching GitHub tag of `yanshekki/ysk-kit`.

### Patch Changes

- Updated dependencies
  - @ysk-kit/auth@1.0.0
  - @ysk-kit/contracts@1.0.0
  - @ysk-kit/domain-kernel@1.0.0
