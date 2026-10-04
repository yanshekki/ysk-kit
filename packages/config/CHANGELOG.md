# @ysk-kit/config

## 1.1.1

### Patch Changes

- cc7076b: Weekly maintenance for 2026-10-04. pnpm 12.9.0, Turborepo 2.11.7, pino 10.4.0, AWS SDK S3 clients 3.1146.0, TanStack Query 5.104.1, supertest 7.3.1, and @types/node 24.19.1. Doctor quotes the product packageManager pin. Audit accepts unfixed node-forge (Expo CLI) and braces (Metro). Held: TypeScript 7, Node 26 types, Prisma 8 rc, desktop Vite 7, Expo 57 / React Native 0.86 / React 19.2.8.

## 1.1.0

### Minor Changes

- 149f4fa: `ysk-kit doctor` checks Node/pnpm engines, required env, insecure defaults, database reachability and migrations, guardrail drift versus `upgrade`, and `check agent`. `--json` prints the report. Exit 1 when any check is an error.
  
  Thin products stub mobile push until `ysk-kit add push`, and that stub's test matches. `static-web3` skips the Prisma enum comparison because that flavor has no API.

## 1.0.2

### Patch Changes

- Refresh safe dependency ranges (Biome 2.5.15, Turborepo 2.11.6, Vitest 5.0.3, Vite 8.3.2 on web/admin, React 19.2.8, Expo 57.0.26, Electron 44.5.1). pnpm overrides patch transitive `deepmerge-ts` 8.0.2, `mariadb` 3.4.7, and `mysql2` 3.24.5. TypeScript stays 6.0.3, Prisma stays 7.10.0, desktop stays on Vite 7, and `@ts-rest/core` stays on 3.53.0-rc.1.

## 1.0.1

### Patch Changes

- CLI command is `ysk-kit` with alias `yskk`. The `ysk` binary is removed.

## 1.0.0

### Major Changes

- First public release. Packages publish to npmjs as `@ysk-kit/*`. `create-ysk-app` from the registry downloads the matching GitHub tag of `yanshekki/ysk-kit`.
